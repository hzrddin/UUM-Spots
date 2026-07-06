function tnc() {
    Swal.fire({
        title: "Terms And Conditions",
        text: "Hi Dr, this is an easter egg implanted, congrats on founding! Happy Marking",
        icon: "info",
        width: "350px"
    });
}

let activeCategory = 'All';

// Listen for search
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', runFilters);
}

// Category
window.filterPlaces = function(category, clickedButton) {
    activeCategory = category;

    const allButtons = document.querySelectorAll('.filter-btn');
    
    // Reset
    allButtons.forEach(btn => {
        btn.classList.remove('btn-primary', 'text-white');
        btn.classList.add('btn-white', 'text-secondary');
    });

    // Active
    if (clickedButton) {
        clickedButton.classList.remove('btn-white', 'text-secondary');
        clickedButton.classList.add('btn-primary', 'text-white');
    }

    // Filter
    runFilters();
};

function runFilters() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    // Grab every card inside the directory container
    const allCards = document.querySelectorAll('.card[data-category]');

    allCards.forEach(card => {
        // Read the data from the HTML
        const title = card.getAttribute('data-title').toLowerCase();
        const category = card.getAttribute('data-category');

        // Check if this card matches the search text
        const matchesSearch = title.includes(searchText);
        
        // Check if this card matches the selected button
        const matchesCategory = (activeCategory === 'All' || category === activeCategory);

        // If it matches BOTH, show it. Otherwise, hide it using Bootstrap's d-none
        if (matchesSearch && matchesCategory) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

const placeCards = document.querySelectorAll('.card[data-title]');

placeCards.forEach(card => {
    card.addEventListener('click', function () {
        // Details 
        const title = this.getAttribute('data-title');
        const category = this.getAttribute('data-category');
        const desc = this.getAttribute('data-desc');
        const img = this.getAttribute('data-img');
        const lat = this.getAttribute('data-lat');
        const lng = this.getAttribute('data-lng');

        // Badge color
        let badgeColor = 'text-bg-success';
        if (category === 'Landmark') badgeColor = 'text-bg-warning';
        if (category === 'Activities') badgeColor = 'text-bg-danger';

        // Save
        localStorage.setItem('destTitle', title);
        localStorage.setItem('destCat', category)
        localStorage.setItem('savedLat', lat);
        localStorage.setItem('savedLng', lng);

        // SweetAlert2 popup
        Swal.fire({
            html: `
                <div class="position-relative">
                    <img src="${img}" class="w-100 object-fit-cover rounded-top" style="height: 200px; border-top-left-radius: 1rem; border-top-right-radius: 1rem;" alt="${title}">
                </div>
                <div class="p-4 text-start">
                    <span class="badge ${badgeColor} rounded-pill mb-2 fw-normal">${category}</span>
                    <h5 class="fw-bold mb-2 text-dark">${title}</h5>
                    <p class="text-muted small mb-0">${desc}</p>
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: 'Go here',
            confirmButtonColor: '#0d6efd',
            padding: '0',
            customClass: {
                popup: 'rounded-4 border-0 shadow',
                confirmButton: 'w-100 mx-4 mb-4 mt-0 rounded-3 py-2 fw-medium shadow-sm',
                closeButton: 'bg-white shadow-sm rounded-circle m-2'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'navigate.html';
            }
        });
    });
});

// Map Zoom
const mapElement = document.getElementById('uum-Map');
const mapHint = document.getElementById('map-Hint');

if (mapElement && typeof interact === 'function') {
    let scale = 1;
    let position = { x: 0, y: 0 };

    const restrictPosition = () => {
        const rect = mapElement.parentElement?.getBoundingClientRect();
        if (!rect) return;

        const maxX = (rect.width * (scale - 1)) / (2 * scale);
        const maxY = (rect.height * (scale - 1)) / (2 * scale);

        position.x = Math.max(-maxX, Math.min(position.x, maxX));
        position.y = Math.max(-maxY, Math.min(position.y, maxY));
    };

    const updateTransform = () => {
        restrictPosition();
        mapElement.style.transform = `scale(${scale}) translate(${position.x}px, ${position.y}px)`;
    };

    interact(mapElement)
        .draggable({
            inertia: true,
            listeners: {
                move(event) {
                    if (scale > 1) {
                        position.x += event.dx / scale;
                        position.y += event.dy / scale;
                        updateTransform();
                    }
                }
            }
        })
        .gesturable({
            listeners: {
                move(event) {
                    if (mapHint) mapHint.style.opacity = '0';

                    scale = scale * (1 + event.ds);
                    scale = Math.max(1, Math.min(scale, 4));
                    if (scale === 1) {
                        position.x = 0;
                        position.y = 0;
                    }
                    updateTransform();
                }
            }
        })
        .on('doubletap', function () {
            if (mapHint) mapHint.style.opacity = '0';

            mapElement.style.transition = 'transform 0.3s ease-in-out';

            if (scale === 1) {
                scale = 2.5;
            } else {
                scale = 1;
                position.x = 0;
                position.y = 0;
            }

            updateTransform();

            setTimeout(() => {
                mapElement.style.transition = 'none';
            }, 300);
        });
}