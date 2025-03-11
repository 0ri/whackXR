// Register A-Frame primitives
AFRAME.registerPrimitive('a-grid', {
    defaultComponents: {
        geometry: {
            primitive: 'plane',
            width: 3,  // Updated to 3m
            height: 3, // Updated to 3m
            segmentsWidth: 15, // Increased segments for larger grid
            segmentsHeight: 15
        },
        material: {
            color: '#8B4513', // Changed to brown
            opacity: 0.5,
            transparent: true,
            wireframe: true
        }
    },
    mappings: {
        width: 'geometry.width',
        height: 'geometry.height',
        color: 'material.color'
    }
});

// Gopher Spawner Component
AFRAME.registerComponent('gopher-spawner', {
    schema: {
        spawnInterval: {type: 'number', default: 2}, // Time between spawns in seconds
        maxGophers: {type: 'number', default: 5}, // Maximum number of gophers at once
        spawnRadius: {type: 'number', default: 1.2} // Radius around center to spawn gophers
    },
    
    init: function() {
        try {
            Debug.log('spawner', 'init', {});
            this.gophers = [];
            this.isSpawning = false;
            this.spawnTimer = null;
            this.spawnPositions = [];
            
            // Generate spawn positions in a grid
            this.generateSpawnPositions();
        } catch (error) {
            Debug.error('spawner', 'init', error);
        }
    },
    
    generateSpawnPositions: function() {
        try {
            // Create a grid of spawn positions
            const gridSize = 3; // 3x3 grid
            const spacing = this.data.spawnRadius * 2 / gridSize;
            
            for (let x = 0; x < gridSize; x++) {
                for (let z = 0; z < gridSize; z++) {
                    // Calculate position with some randomness
                    const posX = (x - gridSize/2 + 0.5) * spacing + (Math.random() * 0.1 - 0.05);
                    const posZ = (z - gridSize/2 + 0.5) * spacing + (Math.random() * 0.1 - 0.05);
                    
                    // Skip the center position (too close to player)
                    if (Math.abs(posX) < 0.2 && Math.abs(posZ) < 0.2) continue;
                    
                    this.spawnPositions.push({x: posX, y: 0, z: posZ});
                }
            }
            
            Debug.log('spawner', 'generateSpawnPositions', { count: this.spawnPositions.length });
        } catch (error) {
            Debug.error('spawner', 'generateSpawnPositions', error);
        }
    },
    
    startSpawning: function() {
        try {
            Debug.log('spawner', 'startSpawning', {});
            this.isSpawning = true;
            this.spawnGopher();
        } catch (error) {
            Debug.error('spawner', 'startSpawning', error);
        }
    },
    
    stopSpawning: function() {
        try {
            Debug.log('spawner', 'stopSpawning', {});
            this.isSpawning = false;
            
            if (this.spawnTimer) {
                clearTimeout(this.spawnTimer);
                this.spawnTimer = null;
            }
        } catch (error) {
            Debug.error('spawner', 'stopSpawning', error);
        }
    },
    
    spawnGopher: function() {
        try {
            if (!this.isSpawning) return;
            
            // Check if we've reached the maximum number of gophers
            if (this.gophers.length >= this.data.maxGophers) {
                // Try again later
                this.spawnTimer = setTimeout(() => this.spawnGopher(), 500);
                return;
            }
            
            // Create gopher entity
            const gopher = document.createElement('a-entity');
            
            // Determine gopher type (10% chance for bonus, 20% chance for fast)
            const rand = Math.random();
            let gopherType = 'standard';
            if (rand < 0.1) {
                gopherType = 'bonus';
            } else if (rand < 0.3) {
                gopherType = 'fast';
            }
            
            // Set gopher component
            gopher.setAttribute('gopher', {type: gopherType});
            
            // Set position
            const position = this.getRandomSpawnPosition();
            gopher.setAttribute('position', position);
            
            // Add to scene
            this.el.appendChild(gopher);
            
            // Add to tracking array
            this.gophers.push(gopher);
            
            // Make gopher emerge
            setTimeout(() => {
                if (gopher.components && gopher.components.gopher) {
                    gopher.components.gopher.emerge();
                }
            }, 100);
            
            // Schedule next spawn
            const nextSpawnTime = this.data.spawnInterval * 1000 * (0.8 + Math.random() * 0.4); // +/- 20% randomness
            this.spawnTimer = setTimeout(() => this.spawnGopher(), nextSpawnTime);
            
            Debug.log('spawner', 'spawnGopher', { 
                type: gopherType, 
                position, 
                nextSpawn: nextSpawnTime,
                totalGophers: this.gophers.length
            });
        } catch (error) {
            Debug.error('spawner', 'spawnGopher', error);
            
            // Try to recover by scheduling next spawn
            this.spawnTimer = setTimeout(() => this.spawnGopher(), this.data.spawnInterval * 1000);
        }
    },
    
    getRandomSpawnPosition: function() {
        // Get a random position from our pre-generated positions
        if (this.spawnPositions.length === 0) {
            // Fallback if no positions are available
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.data.spawnRadius;
            return {
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius
            };
        }
        
        const index = Math.floor(Math.random() * this.spawnPositions.length);
        return this.spawnPositions[index];
    },
    
    removeGopher: function(gopher) {
        try {
            const index = this.gophers.indexOf(gopher);
            if (index !== -1) {
                this.gophers.splice(index, 1);
                Debug.log('spawner', 'removeGopher', { 
                    id: gopher.id, 
                    remainingGophers: this.gophers.length 
                });
            }
        } catch (error) {
            Debug.error('spawner', 'removeGopher', error);
        }
    }
});

// Floor Detector Component
AFRAME.registerComponent('floor-detector', {
    init: function() {
        try {
            Debug.log('floor', 'init', {});
            
            // Listen for controller connected event
            this.el.sceneEl.addEventListener('controllerconnected', this.onControllerConnected.bind(this));
            
            // Set up hit testing
            this.hitTestSource = null;
            this.hitTestSourceRequested = false;
            
            // Reference space
            this.referenceSpace = null;
            
            // Floor position
            this.floorPosition = new THREE.Vector3(0, 0, 0);
            
            // Listen for session start
            this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR.bind(this));
        } catch (error) {
            Debug.error('floor', 'init', error);
        }
    },
    
    onEnterVR: function() {
        try {
            const session = this.el.sceneEl.xrSession;
            if (!session) return;
            
            session.addEventListener('select', this.onSelect.bind(this));
            
            session.requestReferenceSpace('local-floor').then(referenceSpace => {
                this.referenceSpace = referenceSpace;
                
                // Request hit test source
                session.requestHitTestSource({space: referenceSpace})
                    .then(source => {
                        this.hitTestSource = source;
                        Debug.log('floor', 'hit-test-source-created', {});
                    })
                    .catch(error => {
                        Debug.error('floor', 'hit-test-source-request', error);
                    });
            }).catch(error => {
                Debug.error('floor', 'reference-space-request', error);
            });
        } catch (error) {
            Debug.error('floor', 'onEnterVR', error);
        }
    },
    
    onControllerConnected: function(evt) {
        try {
            Debug.log('floor', 'controller-connected', { id: evt.detail.id });
            
            // Create gun controller on right hand
            if (evt.detail.component.data.hand === 'right') {
                const controller = evt.detail.target;
                controller.setAttribute('gun-controller', '');
                Debug.log('floor', 'gun-controller-created', { id: controller.id });
            }
        } catch (error) {
            Debug.error('floor', 'onControllerConnected', error);
        }
    },
    
    onSelect: function(evt) {
        try {
            if (!this.hitTestSource) return;
            
            const frame = evt.frame;
            const referenceSpace = this.referenceSpace;
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                
                // Update floor position
                this.floorPosition.set(
                    pose.transform.position.x,
                    pose.transform.position.y,
                    pose.transform.position.z
                );
                
                Debug.log('floor', 'hit-test-result', { 
                    position: {
                        x: this.floorPosition.x,
                        y: this.floorPosition.y,
                        z: this.floorPosition.z
                    }
                });
                
                // Update floor container position
                const floorContainer = document.querySelector('#floor-container');
                floorContainer.setAttribute('position', this.floorPosition);
                
                // Update gopher container position
                const gopherContainer = document.querySelector('#gopher-container');
                gopherContainer.setAttribute('position', this.floorPosition);
                
                // Hide splash screen if still visible
                const splashScreen = document.getElementById('splash-screen');
                if (splashScreen) {
                    splashScreen.style.display = 'none';
                }
            }
        } catch (error) {
            Debug.error('floor', 'onSelect', error);
        }
    }
});

// Gun Controller Component
AFRAME.registerComponent('gun-controller', {
    init: function() {
        try {
            Debug.log('gun', 'init', {});
            
            // Create gun model
            this.createGunModel();
            
            // Add event listener for trigger press
            this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
            
            // Cooldown to prevent rapid firing
            this.lastFireTime = 0;
            this.cooldown = 250; // ms
        } catch (error) {
            Debug.error('gun', 'init', error);
        }
    },
    
    createGunModel: function() {
        try {
            // Create gun body
            const gunBody = document.createElement('a-box');
            gunBody.setAttribute('width', '0.03');
            gunBody.setAttribute('height', '0.03');
            gunBody.setAttribute('depth', '0.15');
            gunBody.setAttribute('position', '0 0 -0.075');
            gunBody.setAttribute('color', '#333');
            
            // Create gun barrel
            const gunBarrel = document.createElement('a-cylinder');
            gunBarrel.setAttribute('radius', '0.01');
            gunBarrel.setAttribute('height', '0.2');
            gunBarrel.setAttribute('position', '0 0 -0.2');
            gunBarrel.setAttribute('rotation', '90 0 0');
            gunBarrel.setAttribute('color', '#222');
            
            // Create gun handle
            const gunHandle = document.createElement('a-box');
            gunHandle.setAttribute('width', '0.025');
            gunHandle.setAttribute('height', '0.08');
            gunHandle.setAttribute('depth', '0.03');
            gunHandle.setAttribute('position', '0 -0.05 -0.05');
            gunHandle.setAttribute('rotation', '30 0 0');
            gunHandle.setAttribute('color', '#222');
            
            // Add to gun
            this.el.appendChild(gunBody);
            this.el.appendChild(gunBarrel);
            this.el.appendChild(gunHandle);
        } catch (error) {
            Debug.error('gun', 'createGunModel', error);
        }
    },
    
    onTriggerDown: function() {
        try {
            // Check cooldown
            const now = Date.now();
            if (now - this.lastFireTime < this.cooldown) return;
            this.lastFireTime = now;
            
            this.fire();
        } catch (error) {
            Debug.error('gun', 'onTriggerDown', error);
        }
    },
    
    fire: function() {
        try {
            // Create projectile
            const projectile = document.createElement('a-sphere');
            projectile.setAttribute('color', '#00FFFF');
            projectile.setAttribute('radius', '0.03');
            
            // Get gun position and direction
            const gunWorldPosition = new THREE.Vector3();
            const gunWorldDirection = new THREE.Vector3();
            
            this.el.object3D.getWorldPosition(gunWorldPosition);
            this.el.object3D.getWorldDirection(gunWorldDirection);
            gunWorldDirection.multiplyScalar(-1); // Flip direction
            
            // Set projectile position at gun tip
            const projectilePosition = gunWorldPosition.clone();
            projectilePosition.add(gunWorldDirection.clone().multiplyScalar(0.3));
            
            projectile.setAttribute('position', projectilePosition);
            
            // Add to scene
            this.el.sceneEl.appendChild(projectile);
            
            // Add projectile component with direction
            projectile.setAttribute('projectile', {
                direction: {
                    x: gunWorldDirection.x,
                    y: gunWorldDirection.y,
                    z: gunWorldDirection.z
                }
            });
            
            // Play shoot sound
            this.el.sceneEl.emit('shoot');
            
            // Add recoil animation
            this.el.setAttribute('animation__recoil', {
                property: 'position',
                from: '0 0 0',
                to: '0 0 0.05',
                dur: 50,
                easing: 'easeOutQuad',
                dir: 'alternate',
                loop: 1
            });
        } catch (error) {
            Debug.error('gun', 'fire', error);
        }
    }
});

// Projectile Component
AFRAME.registerComponent('projectile', {
    schema: {
        speed: {type: 'number', default: 8},
        direction: {type: 'vec3', default: {x: 0, y: 0, z: -1}},
        maxDistance: {type: 'number', default: 10},
        lifespan: {type: 'number', default: 2000} // ms
    },
    
    init: function() {
        try {
            Debug.log('projectile', 'init', {});
            
            // Normalize direction
            const direction = new THREE.Vector3(
                this.data.direction.x,
                this.data.direction.y,
                this.data.direction.z
            );
            direction.normalize();
            this.direction = direction;
            
            // Starting position
            this.startPosition = this.el.object3D.position.clone();
            
            // Add trail effect
            this.addTrail();
            
            // Set lifespan timer
            setTimeout(() => {
                if (this.el.parentNode) {
                    this.el.parentNode.removeChild(this.el);
                }
            }, this.data.lifespan);
        } catch (error) {
            Debug.error('projectile', 'init', error);
        }
    },
    
    addTrail: function() {
        try {
            // Create trail
            const trail = document.createElement('a-entity');
            
            // Add trail segments
            for (let i = 0; i < 5; i++) {
                const segment = document.createElement('a-sphere');
                segment.setAttribute('radius', 0.015 - i * 0.002);
                segment.setAttribute('opacity', 0.8 - i * 0.15);
                segment.setAttribute('color', '#00FFFF');
                segment.setAttribute('position', {
                    x: 0,
                    y: 0,
                    z: i * 0.05
                });
                trail.appendChild(segment);
            }
            
            this.el.appendChild(trail);
        } catch (error) {
            Debug.error('projectile', 'addTrail', error);
        }
    },
    
    tick: function(time, deltaTime) {
        try {
            // Move projectile
            const distance = this.data.speed * (deltaTime / 1000);
            this.el.object3D.position.x += this.direction.x * distance;
            this.el.object3D.position.y += this.direction.y * distance;
            this.el.object3D.position.z += this.direction.z * distance;
            
            // Check if we've gone too far
            const currentPos = this.el.object3D.position;
            const distanceTraveled = currentPos.distanceTo(this.startPosition);
            if (distanceTraveled > this.data.maxDistance) {
                if (this.el.parentNode) {
                    this.el.parentNode.removeChild(this.el);
                }
                return;
            }
            
            // Check for collisions with gophers
            const gophers = document.querySelectorAll('.gopher-target');
            const projectilePosition = new THREE.Vector3();
            this.el.object3D.getWorldPosition(projectilePosition);
            
            for (let i = 0; i < gophers.length; i++) {
                const gopher = gophers[i];
                
                // Skip if gopher doesn't have a position yet
                if (!gopher.object3D) continue;
                
                const gopherPosition = new THREE.Vector3();
                gopher.object3D.getWorldPosition(gopherPosition);
                
                // Skip if gopher is below ground
                if (gopherPosition.y < -0.1) continue;
                
                // Check distance
                const distance = projectilePosition.distanceTo(gopherPosition);
                if (distance < 0.15) { // Hit radius
                    // Hit gopher
                    if (gopher.components && gopher.components.gopher) {
                        gopher.components.gopher.hit();
                    }
                    
                    // Remove projectile
                    if (this.el.parentNode) {
                        this.el.parentNode.removeChild(this.el);
                    }
                    break;
                }
            }
        } catch (error) {
            Debug.error('projectile', 'tick', error);
            // Remove projectile on error
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }
    }
});