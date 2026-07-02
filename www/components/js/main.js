const mapElement = document.getElementById('uum_Map');
    let scale = 1;
    let position = { x: 0, y: 0 };

    const updateTransform = () => {
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