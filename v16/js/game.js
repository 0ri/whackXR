// Game Manager Component
AFRAME.registerComponent('game-manager', {
    schema: {
        gameLength: {type: 'number', default: 60}, // Game length in seconds
        spawnInterval: {type: 'number', default: 2}, // Time between spawns in seconds
        maxGophers: {type: 'number', default: 5} // Maximum number of gophers at once
    },
    
    init: function() {
        try {
            Debug.log('game', 'init', {});
            
            this.score = 0;
            this.timeRemaining = this.data.gameLength;
            this.gameState = 'idle'; // idle, playing, finished
            
            // Create UI elements
            this.setupUI();
            
            // Create floor
            this.setupFloor();
            
            // Create gopher spawner
            this.setupGopherSpawner();
            
            // Add event listeners
            this.el.addEventListener('gopher-hit', this.onGopherHit.bind(this));
            
            // Add audio manager if not already present
            if (!this.el.components['audio-manager']) {
                this.el.setAttribute('audio-manager', '');
            }
            
            // Add test for gopher removal
            TestFramework.addTest('Gopher Removal Test', () => {
                const gopher = document.createElement('a-entity');
                gopher.setAttribute('gopher', {type: 'standard'});
                this.el.appendChild(gopher);
                
                // Wait for component initialization
                setTimeout(() => {
                    gopher.components.gopher.hit();
                    
                    // Check after hit animation should complete
                    setTimeout(() => {
                        if (gopher.parentNode) {
                            throw new Error('Gopher should be removed from scene after hit');
                        }
                    }, 600);
                }, 100);
            });
            
            // Add test for audio system
            TestFramework.addTest('Audio System Test', () => {
                const audioManager = this.el.components['audio-manager'];
                if (!audioManager) {
                    throw new Error('Audio manager not found');
                }
                
                // Test sound playback
                const soundPlayed = audioManager.playSound('hit');
                if (soundPlayed === false) {
                    throw new Error('Sound playback failed');
                }
            });
            
            Debug.log('game', 'initialization-complete', {});
        } catch (error) {
            Debug.error('game', 'init', error);
        }
    },
    
    setupUI: function() {
        try {
            // Create UI container
            const uiContainer = document.querySelector('#ui-container');
            
            // Create score display
            this.scoreDisplay = document.createElement('a-text');
            this.scoreDisplay.setAttribute('value', 'Score: 0');
            this.scoreDisplay.setAttribute('color', 'white');
            this.scoreDisplay.setAttribute('position', '0 0.5 -1');
            this.scoreDisplay.setAttribute('scale', '0.5 0.5 0.5');
            this.scoreDisplay.setAttribute('align', 'center');
            
            // Create timer display
            this.timerDisplay = document.createElement('a-text');
            this.timerDisplay.setAttribute('value', `Time: ${this.data.gameLength}`);
            this.timerDisplay.setAttribute('color', 'white');
            this.timerDisplay.setAttribute('position', '0 0.4 -1');
            this.timerDisplay.setAttribute('scale', '0.5 0.5 0.5');
            this.timerDisplay.setAttribute('align', 'center');
            
            // Create start button
            this.startButton = document.createElement('a-entity');
            this.startButton.setAttribute('geometry', {
                primitive: 'plane',
                width: 0.4,
                height: 0.15
            });
            this.startButton.setAttribute('material', {
                color: '#4CAF50',
                opacity: 0.8,
                transparent: true
            });
            this.startButton.setAttribute('position', '0 0.2 -1');
            this.startButton.setAttribute('text', {
                value: 'Start Game',
                align: 'center',
                width: 1,
                color: 'white'
            });
            
            // Add click handler
            this.startButton.classList.add('clickable');
            this.startButton.addEventListener('click', () => {
                this.startGame();
            });
            
            // Add to UI container
            uiContainer.appendChild(this.scoreDisplay);
            uiContainer.appendChild(this.timerDisplay);
            uiContainer.appendChild(this.startButton);
            
            // Create game over display (hidden initially)
            this.gameOverDisplay = document.createElement('a-entity');
            this.gameOverDisplay.setAttribute('visible', false);
            
            const gameOverBackground = document.createElement('a-plane');
            gameOverBackground.setAttribute('color', '#333');
            gameOverBackground.setAttribute('opacity', '0.8');
            gameOverBackground.setAttribute('width', '1');
            gameOverBackground.setAttribute('height', '0.5');
            
            const gameOverText = document.createElement('a-text');
            gameOverText.setAttribute('value', 'Game Over');
            gameOverText.setAttribute('color', 'white');
            gameOverText.setAttribute('position', '0 0.1 0.01');
            gameOverText.setAttribute('align', 'center');
            
            this.finalScoreText = document.createElement('a-text');
            this.finalScoreText.setAttribute('value', 'Score: 0');
            this.finalScoreText.setAttribute('color', 'white');
            this.finalScoreText.setAttribute('position', '0 0 0.01');
            this.finalScoreText.setAttribute('align', 'center');
            this.finalScoreText.setAttribute('scale', '0.5 0.5 0.5');
            
            const restartButton = document.createElement('a-entity');
            restartButton.setAttribute('geometry', {
                primitive: 'plane',
                width: 0.3,
                height: 0.1
            });
            restartButton.setAttribute('material', {
                color: '#4CAF50',
                opacity: 0.8,
                transparent: true
            });
            restartButton.setAttribute('position', '0 -0.15 0.01');
            restartButton.setAttribute('text', {
                value: 'Restart',
                align: 'center',
                width: 1,
                color: 'white'
            });
            
            // Add click handler
            restartButton.classList.add('clickable');
            restartButton.addEventListener('click', () => {
                this.resetGame();
            });
            
            this.gameOverDisplay.appendChild(gameOverBackground);
            this.gameOverDisplay.appendChild(gameOverText);
            this.gameOverDisplay.appendChild(this.finalScoreText);
            this.gameOverDisplay.appendChild(restartButton);
            
            this.gameOverDisplay.setAttribute('position', '0 1.5 -1');
            
            uiContainer.appendChild(this.gameOverDisplay);
        } catch (error) {
            Debug.error('game', 'setupUI', error);
        }
    },
    
    setupFloor: function() {
        try {
            // Create floor container
            const floorContainer = document.querySelector('#floor-container');
            
            // Create floor grid
            const grid = document.createElement('a-grid');
            grid.setAttribute('rotation', '-90 0 0');
            grid.setAttribute('position', '0 0 0');
            
            // Add floor detector
            grid.setAttribute('floor-detector', '');
            
            floorContainer.appendChild(grid);
        } catch (error) {
            Debug.error('game', 'setupFloor', error);
        }
    },
    
    setupGopherSpawner: function() {
        try {
            // Create gopher spawner
            const gopherContainer = document.querySelector('#gopher-container');
            gopherContainer.setAttribute('gopher-spawner', {
                spawnInterval: this.data.spawnInterval,
                maxGophers: this.data.maxGophers
            });
            
            this.gopherSpawner = gopherContainer;
        } catch (error) {
            Debug.error('game', 'setupGopherSpawner', error);
        }
    },
    
    startGame: function() {
        try {
            Debug.log('game', 'startGame', {});
            
            // Hide start button
            this.startButton.setAttribute('visible', false);
            
            // Reset score and timer
            this.score = 0;
            this.timeRemaining = this.data.gameLength;
            this.updateScore();
            this.updateTimer();
            
            // Start spawning gophers
            this.gopherSpawner.components['gopher-spawner'].startSpawning();
            
            // Start timer
            this.gameTimer = setInterval(() => {
                this.timeRemaining--;
                this.updateTimer();
                
                if (this.timeRemaining <= 0) {
                    this.endGame();
                }
            }, 1000);
            
            // Update game state
            this.gameState = 'playing';
            this.el.emit('gameStateChanged', {state: 'playing'});
        } catch (error) {
            Debug.error('game', 'startGame', error);
        }
    },
    
    endGame: function() {
        try {
            Debug.log('game', 'endGame', { finalScore: this.score });
            
            // Stop timer
            clearInterval(this.gameTimer);
            
            // Stop spawning gophers
            this.gopherSpawner.components['gopher-spawner'].stopSpawning();
            
            // Remove all existing gophers
            const gophers = document.querySelectorAll('.gopher-target');
            gophers.forEach(gopher => {
                if (gopher.parentNode) {
                    gopher.parentNode.removeChild(gopher);
                }
            });
            
            // Show game over display
            this.gameOverDisplay.setAttribute('visible', true);
            this.finalScoreText.setAttribute('value', `Score: ${this.score}`);
            
            // Update game state
            this.gameState = 'finished';
            this.el.emit('gameStateChanged', {state: 'finished'});
        } catch (error) {
            Debug.error('game', 'endGame', error);
        }
    },
    
    resetGame: function() {
        try {
            Debug.log('game', 'resetGame', {});
            
            // Hide game over display
            this.gameOverDisplay.setAttribute('visible', false);
            
            // Show start button
            this.startButton.setAttribute('visible', true);
            
            // Reset score and timer display
            this.score = 0;
            this.timeRemaining = this.data.gameLength;
            this.updateScore();
            this.updateTimer();
            
            // Update game state
            this.gameState = 'idle';
            this.el.emit('gameStateChanged', {state: 'idle'});
        } catch (error) {
            Debug.error('game', 'resetGame', error);
        }
    },
    
    onGopherHit: function(event) {
        try {
            const points = event.detail.points || 10;
            this.score += points;
            this.updateScore();
        } catch (error) {
            Debug.error('game', 'onGopherHit', error);
        }
    },
    
    updateScore: function() {
        this.scoreDisplay.setAttribute('value', `Score: ${this.score}`);
    },
    
    updateTimer: function() {
        this.timerDisplay.setAttribute('value', `Time: ${this.timeRemaining}`);
    }
});