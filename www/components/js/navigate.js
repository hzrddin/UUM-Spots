const serverUrl = window.APP_CONFIG.SERVER_URL;
const gMapApi = window.APP_CONFIG.GOOGLE_MAP_API;

// Global variables
let mapInstance = null;
let destinationObj = null;
let RouteLibrary = null;
let userMarker = null;
let watchId = null;
let currentUserLocation = null;

document.getElementById('navTitle').textContent = localStorage.getItem('destTitle');

// Initialize Map and Google Libraries
window.initMap = async function () {
    const destLat = parseFloat(localStorage.getItem('savedLat'));
    const destLng = parseFloat(localStorage.getItem('savedLng'));
    destinationObj = { lat: destLat, lng: destLng };

    const { Map } = await google.maps.importLibrary("maps");
    const { Route } = await google.maps.importLibrary("routes");
    await google.maps.importLibrary("marker");

    RouteLibrary = Route;

    mapInstance = new Map(document.getElementById("gMap"), {
        zoom: 15,
        center: destinationObj,
        mapId: "DEMO_MAP_ID",
        mapTypeControl: false,
        streetViewControl: false
    });

    requestAndDrawRoute();
};

// Sweetalert finding
window.retryLocation = function () {
    Swal.fire({
        title: 'Finding location...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    requestAndDrawRoute();
};

// Core Routing Logic
function requestAndDrawRoute() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                Swal.close();

                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Save the exact loc
                currentUserLocation = userLocation;

                const request = {
                    origin: userLocation,
                    destination: destinationObj,
                    travelMode: 'DRIVING',
                    fields: ['path', 'distanceMeters', 'durationMillis']
                };

                try {
                    const { routes } = await RouteLibrary.computeRoutes(request);

                    if (routes && routes.length > 0) {
                        const distanceKm = (routes[0].distanceMeters / 1000).toFixed(1) + " km";
                        const timeMinutes = Math.round(routes[0].durationMillis / 60000) + " min";

                        document.getElementById('descCardTitle').textContent = localStorage.getItem('destTitle');
                        document.getElementById('routeDistance').textContent = distanceKm;
                        document.getElementById('routeTime').textContent = timeMinutes;

                        // Draw the blue line
                        const mapPolylines = routes[0].createPolylines();
                        mapPolylines.forEach((polyline) => polyline.setMap(mapInstance));

                        // Generate A and B pins
                        const markers = await routes[0].createWaypointAdvancedMarkers();

                        const attachVisibleLabel = (marker, text) => {
                            const container = document.createElement('div');
                            container.style.display = 'flex';
                            container.style.flexDirection = 'column';
                            container.style.alignItems = 'center';

                            const label = document.createElement('div');
                            label.className = 'bg-white text-dark border px-2 py-1 rounded-pill shadow-sm small fw-bold mb-1';
                            label.style.whiteSpace = 'nowrap';
                            label.style.fontSize = '12px';
                            label.textContent = text;

                            container.appendChild(label);
                            container.appendChild(marker.content);

                            marker.content = container;
                        };

                        if (markers[0]) attachVisibleLabel(markers[0], "Current Location");
                        if (markers[markers.length - 1]) attachVisibleLabel(markers[markers.length - 1], localStorage.getItem('destTitle'));

                        markers.forEach((marker) => marker.map = mapInstance);
                    }
                } catch (e) {
                    console.error("The New Routes API was blocked:", e);
                    showLocationError();
                }
            },
            (error) => showLocationError(),
            { enableHighAccuracy: true, timeout: 30000 }
        );
    } else {
        showLocationError();
    }
}

function showLocationError() {
    Swal.fire({
        iconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="text-danger" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>`,
        customClass: { icon: 'border-0' },
        title: 'Location Required',
        text: 'We need your current location for navigation. Please allow location access in device settings.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#0d6efd',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) window.retryLocation();
    });
}

window.navigate = async function () {
    // Hide Setup UI
    document.getElementById('setupCardContainer').classList.add('d-none');
    const mainNav = document.querySelector('nav');
    if (mainNav) mainNav.classList.add('d-none');

    // Set initial Bottom Panel text
    document.getElementById('activeTimeLeft').textContent = document.getElementById('routeTime').textContent;
    document.getElementById('activeDistanceLeft').textContent = `${document.getElementById('routeDistance').textContent} remaining`;

    // Show only the Bottom Panel
    document.getElementById('navBottomPanel').classList.remove('d-none');

    // Tilt map for GPS view
    if (mapInstance) {
        mapInstance.setZoom(19);
        mapInstance.setTilt(55);
    }

    // GPS Arrow Icon
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    if (!userMarker) {
        const pin = document.createElement('div');
        pin.innerHTML = `
            <div id="navArrow" style="transition: transform 0.2s ease-out; transform-origin: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" style="filter: drop-shadow(0px 4px 5px rgba(0,0,0,0.4));">
                    <path fill="#0d6efd" stroke="#ffffff" stroke-width="2" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                </svg>
            </div>
        `;

        userMarker = new AdvancedMarkerElement({
            map: mapInstance,
            position: currentUserLocation || mapInstance.getCenter(),
            content: pin
        });
    }

    // Compass Listener
    const startCompassListener = () => {
        window.addEventListener('deviceorientationabsolute', function (event) {
            if (event.alpha !== null) {
                const compassHeading = 360 - event.alpha;
                const arrow = document.getElementById('navArrow');

                if (arrow && mapInstance) {
                    const mapHeading = mapInstance.getHeading() || 0;
                    const finalRotation = compassHeading - mapHeading;
                    arrow.style.transform = `rotate(${finalRotation}deg)`;
                }
            }
        }, true);
    };

    startCompassListener();

    // Live GPS Tracking
    if (navigator.geolocation && typeof turf !== 'undefined') {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const livePos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Move the arrow on the map
                if (userMarker) {
                    userMarker.position = livePos;
                }

                // Snap camera to user and rotate map based on GPS velocity
                if (mapInstance) {
                    mapInstance.panTo(livePos);
                    if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
                        mapInstance.setHeading(position.coords.heading);
                    }
                }

                // Update Remaining Distance via Turf.js
                if (destinationObj) {
                    const from = turf.point([livePos.lng, livePos.lat]);
                    const to = turf.point([destinationObj.lng, destinationObj.lat]);

                    const remainingKm = turf.distance(from, to, { units: 'kilometers' }).toFixed(2);
                    const remainingMeters = remainingKm * 1000;

                    const distanceUI = document.getElementById('activeDistanceLeft');
                    if (distanceUI) distanceUI.textContent = `${remainingKm} km remaining`;

                    // Destination Arrival Check
                    if (remainingMeters <= 50) {
                        navigator.geolocation.clearWatch(watchId);

                        Swal.fire({
                            title: 'You have arrived!',
                            text: 'You reached your destination.',
                            icon: 'success',
                            confirmButtonText: 'Finish',
                            customClass: { popup: 'rounded-4 border-0 shadow' }
                        }).then(() => {
                            window.location.href = 'home.html';
                        });
                    }
                }
            },
            (error) => console.warn("Lost live GPS signal:", error),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    }
};

// save act
window.endNavigation = function () {
    Swal.fire({
        title: 'Save the moment',
        html: `
        <div class="mb-3 text-start">
            <label class="form-label small fw-bold text-dark">Upload Picture</label>
            <input type="file" id="swalImage" class="form-control shadow-none" accept="image/*">
        </div>
        <div class="mb-0 text-start">
            <label class="form-label small fw-bold text-dark">Caption</label>
            <input type="text" id="swalCaption" class="form-control shadow-none" placeholder="It was wonderful...">
        </div>
    `,
        confirmButtonText: 'Save',
        confirmButtonColor: '#0d6efd',
        showCancelButton: true,
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'rounded-4 border-0 shadow'
        },

        preConfirm: () => {
            const imageFile = document.getElementById('swalImage').files[0];
            const caption = document.getElementById('swalCaption').value.trim();

            if (!imageFile) {
                Swal.showValidationMessage('Please select a picture first!');
                return false;
            }

            return {
                image: imageFile,
                caption: caption
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {

            // 1. Gather files and user input
            const savedImage = result.value.image;
            const savedCaption = result.value.caption;

            // 2. Pull IDs and Text from Storage
            const userID = localStorage.getItem('userID');
            const placeName = localStorage.getItem('placeName');
            const placeDesc = localStorage.getItem('placeDesc');
            const placeType = localStorage.getItem('placeType');

            if (!userID) {
                Swal.fire('Error', 'Missing User ID. Please log in again.', 'error');
                return;
            }

            // 3. Package it into FormData
            let formData = new FormData();
            formData.append('photo', savedImage);
            formData.append('caption', savedCaption);
            formData.append('userID', userID);
            formData.append('placeName', placeName);
            formData.append('placeDesc', placeDesc);
            formData.append('types', placeType);

            // 4. Send to saveact.php (Standard JSON Processing)
            fetch(serverUrl + '/saveact.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === "success") {
                        Swal.fire({
                            title: 'Saved!',
                            text: 'Your moment is saved.',
                            icon: 'success',
                            confirmButtonColor: '#0d6efd',
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = 'history.html';
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Save Failed",
                            text: data.message,
                        });
                    }
                })
                .catch(error => {
                    Swal.fire({
                        icon: "error",
                        title: "Upload Error",
                        text: error.message
                    });
                });

        } else {
            window.location.href = 'home.html';
        }
    });
};

loadGMap();

function loadGMap() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${gMapApi}&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}