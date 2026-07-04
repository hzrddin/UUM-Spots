    // Modal
    const dynamicModal = document.getElementById('dynamicModal');

    if (dynamicModal) {
        dynamicModal.addEventListener('show.bs.modal', function (event) {
            const clickedCard = event.relatedTarget;
            if (!clickedCard) return;

            const title = clickedCard.getAttribute('data-title');
            const category = clickedCard.getAttribute('data-category');
            const desc = clickedCard.getAttribute('data-desc');
            const img = clickedCard.getAttribute('data-img');
            const lat = clickedCard.getAttribute('data-lat');
            const lng = clickedCard.getAttribute('data-lng');

            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalCategory').textContent = category;
            document.getElementById('modalDesc').textContent = desc;
            document.getElementById('modalImg').src = img;

            localStorage.setItem('destTitle', title);
            localStorage.setItem('savedLat', lat);
            localStorage.setItem('savedLng', lng);
        });
    }

    function navigate() {
        window.location.href = 'navigate.html';
    }

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