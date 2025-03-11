// Gopher Component - MUST BE REGISTERED FIRST
AFRAME.registerComponent('gopher', {
    schema: {
        type: {type: 'string', default: 'standard'}, // standard, fast, or bonus
        points: {type: 'number', default: 10}
    },

    init: function() {
        try {
            Debug.log('gopher', 'init', { type: this.data.type, id: this.el.id });
            this.isAlive = true;
            this.isRetreating = false;
            this.setupModel();
            this.setupAnimation();
            
            // Add class for collision detection
            this.el.classList.add('gopher-target');
        } catch (error) {
            Debug.error('gopher', 'init', error);
        }
    },

    remove: function() {
        try {
            Debug.log('gopher', 'remove', { id: this.el.id });
            // Clear any pending timers
            if (this.retreatTimer) {
                clearTimeout(this.retreatTimer);
                this.retreatTimer = null;
            }
            
            // Ensure we're removed from any tracking arrays
            const spawner = document.querySelector('[gopher-spawner]');
            if (spawner && spawner.components && spawner.components['gopher-spawner']) {
                spawner.components['gopher-spawner'].removeGopher(this.el);
            }
        } catch (error) {
            Debug.error('gopher', 'remove', error);
        }
    },

    setupModel: function() {
        try {
            // Create gopher geometry
            const head = document.createElement('a-sphere');
            const body = document.createElement('a-cylinder');
            const eyes = document.createElement('a-entity');
            
            // Set properties based on type
            let color;
            switch(this.data.type) {
                case 'fast':
                    color = '#FF4500';
                    this.data.points = 25;
                    break;
                case 'bonus':
                    color = '#FFD700';
                    this.data.points = 50;
                    break;
                default:
                    color = '#8B4513';
                    this.data.points = 10;
            }

            // Head
            head.setAttribute('color', color);
            head.setAttribute('radius', '0.075'); // Reduced from 0.15
            head.setAttribute('position', '0 0.15 0'); // Adjusted position

            // Body
            body.setAttribute('color', color);
            body.setAttribute('radius', '0.06'); // Reduced from 0.12
            body.setAttribute('height', '0.15'); // Reduced from 0.3
            body.setAttribute('position', '0 0 0');
            
            // Eyes (for more character)
            const leftEye = document.createElement('a-sphere');
            leftEye.setAttribute('color', 'black');
            leftEye.setAttribute('radius', '0.015'); // Reduced from 0.03
            leftEye.setAttribute('position', '-0.035 0.175 0.06'); // Adjusted position
            
            const rightEye = document.createElement('a-sphere');
            rightEye.setAttribute('color', 'black');
            rightEye.setAttribute('radius', '0.015'); // Reduced from 0.03
            rightEye.setAttribute('position', '0.035 0.175 0.06'); // Adjusted position
            
            eyes.appendChild(leftEye);
            eyes.appendChild(rightEye);

            this.el.appendChild(head);
            this.el.appendChild(body);
            this.el.appendChild(eyes);
            
            // Add a nose
            const nose = document.createElement('a-sphere');
            nose.setAttribute('color', 'black');
            nose.setAttribute('radius', '0.01'); // Reduced from 0.02
            nose.setAttribute('position', '0 0.15 0.075'); // Adjusted position
            this.el.appendChild(nose);
            
            // Add special effects for bonus gopher
            if (this.data.type === 'bonus') {
                const glow = document.createElement('a-sphere');
                glow.setAttribute('color', '#FFFF00');
                glow.setAttribute('radius', '0.1'); // Reduced from 0.2
                glow.setAttribute('position', '0 0.15 0'); // Adjusted position
                glow.setAttribute('material', 'transparent: true; opacity: 0.3');
                glow.setAttribute('animation', {
                    property: 'scale',
                    from: '0.9 0.9 0.9',
                    to: '1.1 1.1 1.1',
                    dur: 1000,
                    dir: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                });
                this.el.appendChild(glow);
            }
        } catch (error) {
            Debug.error('gopher', 'setupModel', error);
        }
    },

    setupAnimation: function() {
        try {
            // Start position is below ground
            this.el.object3D.position.y = -0.25; // Reduced from -0.5 for smaller gopher
            
            // Emerge animation
            this.el.setAttribute('animation__emerge', {
                property: 'object3D.position.y',
                from: -0.25, // Reduced from -0.5
                to: 0,
                dur: 500,
                easing: 'easeOutCubic',
                startEvents: 'emerge'
            });

            // Retreat animation
            this.el.setAttribute('animation__retreat', {
                property: 'object3D.position.y',
                from: 0,
                to: -0.25, // Reduced from -0.5
                dur: 500,
                easing: 'easeInCubic',
                startEvents: 'retreat'
            });
            
            // Add wiggle animation for more character
            this.el.setAttribute('animation__wiggle', {
                property: 'rotation.y',
                from: -5,
                to: 5,
                dur: 1000,
                dir: 'alternate',
                loop: true,
                easing: 'easeInOutSine',
                startEvents: 'emerge'
            });
        } catch (error) {
            Debug.error('gopher', 'setupAnimation', error);
        }
    },

    emerge: function() {
        try {
            Debug.log('gopher', 'emerge', { id: this.el.id });
            if (!this.isAlive) return;
            
            this.el.emit('emerge');
            this.el.sceneEl.emit('gopher-emerge');
            
            // Set retreat timeout based on type
            const duration = this.data.type === 'fast' ? 1000 : 2000;
            this.retreatTimer = setTimeout(() => this.retreat(), duration);
        } catch (error) {
            Debug.error('gopher', 'emerge', error);
        }
    },

    retreat: function() {
        try {
            Debug.log('gopher', 'retreat', { id: this.el.id });
            if (!this.isAlive || this.isRetreating) return;
            
            this.isRetreating = true;
            this.el.emit('retreat');
            this.el.sceneEl.emit('gopher-retreat');
            
            // Remove after retreat animation
            setTimeout(() => {
                try {
                    Debug.log('gopher', 'removing after retreat', { id: this.el.id });
                    if (this.el.parentNode) {
                        this.el.parentNode.removeChild(this.el);
                    }
                } catch (error) {
                    Debug.error('gopher', 'removing after retreat', error);
                }
            }, 500);
        } catch (error) {
            Debug.error('gopher', 'retreat', error);
        }
    },

    hit: function() {
        try {
            Debug.log('gopher', 'hit', { id: this.el.id, isAlive: this.isAlive });
            if (!this.isAlive) return;
            
            this.isAlive = false;
            
            // Clear retreat timer if it exists
            if (this.retreatTimer) {
                clearTimeout(this.retreatTimer);
                this.retreatTimer = null;
            }
            
            // Create explosion effect
            this.createExplosion();
            
            // Show score popup
            this.showScorePopup();
            
            // Trigger hit effects and score update
            this.el.sceneEl.emit('gopher-hit', {points: this.data.points});
            
            // Play hit sound via scene event
            this.el.sceneEl.emit('gopher-hit');
            
            // Remove gopher after explosion animation
            setTimeout(() => {
                try {
                    Debug.log('gopher', 'removing after hit', { id: this.el.id });
                    if (this.el.parentNode) {
                        this.el.parentNode.removeChild(this.el);
                    }
                } catch (error) {
                    Debug.error('gopher', 'removing after hit', error);
                }
            }, 500);
        } catch (error) {
            Debug.error('gopher', 'hit', error);
            // Ensure gopher is removed even if there's an error
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }
    },
    
    createExplosion: function() {
        try {
            // Create hit effect
            const hitEffect = document.createElement('a-entity');
            hitEffect.setAttribute('position', this.el.getAttribute('position'));
            
            // Create particles for explosion
            for (let i = 0; i < 10; i++) {
                const particle = document.createElement('a-sphere');
                particle.setAttribute('radius', 0.015); // Reduced from 0.03
                particle.setAttribute('color', '#FFD700');
                
                // Random position offset - 50% smaller
                const x = (Math.random() - 0.5) * 0.05; // Reduced from 0.1
                const y = (Math.random() - 0.5) * 0.05; // Reduced from 0.1
                const z = (Math.random() - 0.5) * 0.05; // Reduced from 0.1
                particle.setAttribute('position', `${x} ${y} ${z}`);
                
                // Animation
                particle.setAttribute('animation', {
                    property: 'position',
                    to: `${x*5} ${y*5+0.25} ${z*5}`, // Reduced height from 0.5 to 0.25
                    dur: 500,
                    easing: 'easeOutQuad'
                });
                
                particle.setAttribute('animation__fade', {
                    property: 'opacity',
                    from: 1.0,
                    to: 0.0,
                    dur: 500,
                    easing: 'easeOutQuad'
                });
                
                hitEffect.appendChild(particle);
            }
            
            this.el.sceneEl.appendChild(hitEffect);
            
            // Remove hit effect after animation
            setTimeout(() => {
                try {
                    if (hitEffect.parentNode) {
                        hitEffect.parentNode.removeChild(hitEffect);
                    }
                } catch (error) {
                    Debug.error('gopher', 'removing hit effect', error);
                }
            }, 500);
        } catch (error) {
            Debug.error('gopher', 'createExplosion', error);
        }
    },
    
    showScorePopup: function() {
        try {
            // Create score popup text
            const scorePopup = document.createElement('a-text');
            scorePopup.setAttribute('value', `+${this.data.points}`);
            scorePopup.setAttribute('color', this.data.type === 'bonus' ? '#FFD700' : 'white');
            scorePopup.setAttribute('align', 'center');
            
            // Position above gopher
            const position = this.el.getAttribute('position');
            scorePopup.setAttribute('position', {
                x: position.x,
                y: position.y + 0.25, // Reduced from 0.5
                z: position.z
            });
            
            // Add to scene
            this.el.sceneEl.appendChild(scorePopup);
            
            // Animate upward and fade out
            scorePopup.setAttribute('animation__up', {
                property: 'position.y',
                to: position.y + 0.5, // Reduced from 1.0
                dur: 1000,
                easing: 'easeOutQuad'
            });
            
            scorePopup.setAttribute('animation__fade', {
                property: 'opacity',
                from: 1.0,
                to: 0.0,
                dur: 1000,
                easing: 'easeOutQuad'
            });
            
            // Remove after animation
            setTimeout(() => {
                try {
                    if (scorePopup.parentNode) {
                        scorePopup.parentNode.removeChild(scorePopup);
                    }
                } catch (error) {
                    Debug.error('gopher', 'removing score popup', error);
                }
            }, 1000);
        } catch (error) {
            Debug.error('gopher', 'showScorePopup', error);
        }
    }
});