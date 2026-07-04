const serverBaseUrl = window.APP_CONFIG.SERVER_URL;
const gMapApi = window.APP_CONFIG.GOOGLE_MAP_API;

// Global variables for the retry
let mapInstance = null;
let destinationObj = null;
let errorModal = null;
let RouteLibrary = null;

document.getElementById('navTitle').textContent = localStorage.getItem('destTitle');

// Initialize Map and Google Libraries
window.initMap = async function () {
    const destLat = parseFloat(localStorage.getItem('savedLat'));
    const destLng = parseFloat(localStorage.getItem('savedLng'));
    destinationObj = { lat: destLat, lng: destLng };

    // Initialize Bootstrap Modal
    errorModal = new bootstrap.Modal(document.getElementById('locationModal'));

    // Import Google libraries 
    const { Map } = await google.maps.importLibrary("maps");
    const { Route } = await google.maps.importLibrary("routes");
    await google.maps.importLibrary("marker");

    // Save Route library globally so the retry button can use it
    RouteLibrary = Route;

    // Initialize the empty map
    mapInstance = new Map(document.getElementById("gMap"), {
        zoom: 15,
        center: destinationObj,
        mapId: "DEMO_MAP_ID",
        mapTypeControl: false,
        streetViewControl: false
    });

    // Start the location request
    requestAndDrawRoute();
};

// Retry Function for the Modal Button
window.retryLocation = function () {
    requestAndDrawRoute();
};

// Core Routing and Location Logic
function requestAndDrawRoute() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // Success! Hide the error modal if it was open
                if (errorModal) errorModal.hide();

                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                const request = {
                    origin: userLocation,
                    destination: destinationObj,
                    travelMode: 'DRIVING',
                    fields: ['path', 'distanceMeters', 'durationMillis']
                };

                try {
                    const { routes } = await RouteLibrary.computeRoutes(request);

                    if (routes && routes.length > 0) {
                        const rawDistance = routes[0].distanceMeters;
                        const distanceKm = (rawDistance / 1000).toFixed(1) + " km";

                        // returns milliseconds, divide by 60,000, minutes
                        const rawMillis = routes[0].durationMillis;
                        const timeMinutes = Math.round(rawMillis / 60000) + " min";

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

                        // Attach labels to pins
                        if (markers[0]) attachVisibleLabel(markers[0], "Current Location");
                        if (markers[markers.length - 1]) attachVisibleLabel(markers[markers.length - 1], localStorage.getItem('destTitle'));

                        // Drop pins on the map
                        markers.forEach((marker) => marker.map = mapInstance);
                    }
                } catch (e) {
                    console.error("The New Routes API was blocked:", e);
                    if (errorModal) errorModal.show();
                }

            },
            (error) => {
                if (errorModal) errorModal.show();
            },
            // The 30s timeout to allow accurate GPS lock
            { enableHighAccuracy: true, timeout: 30000 } 
        );
    } else {
        console.warn("Browser does not support geolocation.");
        if (errorModal) errorModal.show();
    }
}

loadGMap();

function loadGMap() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${gMapApi}&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}