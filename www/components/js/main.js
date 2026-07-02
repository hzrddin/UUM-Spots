
/* Map Zoom */
const mapElement = document.getElementById('uum-Map');
    const mapHint = document.getElementById('map-Hint'); 
    let scale = 1;
    let position = { x: 0, y: 0 };

    // stop the map from dragging off-screen
    const restrictPosition = () => {
        // Get the container's base width and height
        const rect = mapElement.parentElement.getBoundingClientRect();
        
        // Calculate the maximum allowed drag distance based on the current zoom scale
        const maxX = (rect.width * (scale - 1)) / (2 * scale);
        const maxY = (rect.height * (scale - 1)) / (2 * scale);

        // Force the position to stay within the boundaries
        position.x = Math.max(-maxX, Math.min(position.x, maxX));
        position.y = Math.max(-maxY, Math.min(position.y, maxY));
    };

    const updateTransform = () => {
        restrictPosition(); // Enforce limits before moving the map
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
        .on('doubletap', function (event) {
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