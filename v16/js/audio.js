// Audio Manager Component
AFRAME.registerComponent('audio-manager', {
    schema: {
        muted: {type: 'boolean', default: false},
        sfxVolume: {type: 'number', default: 0.7},
        musicVolume: {type: 'number', default: 0.3}
    },
    
    init: function() {
        try {
            Debug.log('audio', 'init', {});
            this.sounds = {};
            this.music = null;
            this.setupAudio();
            this.setupEventListeners();
            this.setupMuteButton();
        } catch (error) {
            Debug.error('audio', 'init', error);
        }
    },
    
    setupAudio: function() {
        try {
            // Get all audio elements
            const audioElements = document.querySelectorAll('a-assets audio');
            if (audioElements.length === 0) {
                Debug.error('audio', 'setupAudio', 'No audio elements found in assets');
                return;
            }
            
            audioElements.forEach(audio => {
                const id = audio.id.replace('sound-', '').replace('music-', '');
                if (audio.id.startsWith('sound-')) {
                    this.sounds[id] = audio;
                    audio.volume = this.data.sfxVolume;
                } else if (audio.id.startsWith('music-')) {
                    this.music = audio;
                    audio.volume = this.data.musicVolume;
                    audio.loop = true;
                }
            });
            
            Debug.log('audio', 'setup', { 
                sounds: Object.keys(this.sounds), 
                music: this.music ? this.music.id : null 
            });
        } catch (error) {
            Debug.error('audio', 'setupAudio', error);
        }
    },
    
    setupEventListeners: function() {
        try {
            // Listen for game events
            this.el.addEventListener('gameStateChanged', this.onGameStateChanged.bind(this));
            this.el.addEventListener('gopher-emerge', () => this.playSound('emerge'));
            this.el.addEventListener('gopher-hit', () => this.playSound('hit'));
            this.el.addEventListener('gopher-retreat', () => this.playSound('retreat'));
            this.el.addEventListener('shoot', () => this.playSound('shoot'));
        } catch (error) {
            Debug.error('audio', 'setupEventListeners', error);
        }
    },
    
    setupMuteButton: function() {
        try {
            // Create mute button
            const muteButton = document.createElement('a-entity');
            muteButton.setAttribute('geometry', {
                primitive: 'plane',
                width: 0.15,
                height: 0.15
            });
            muteButton.setAttribute('material', {
                color: '#444',
                opacity: 0.8,
                transparent: true
            });
            muteButton.setAttribute('position', '0.4 0.2 -1');
            muteButton.setAttribute('text', {
                value: '🔊',
                align: 'center',
                width: 0.5,
                color: 'white'
            });
            
            // Add click handler
            muteButton.classList.add('clickable');
            muteButton.addEventListener('click', () => {
                this.toggleMute();
                muteButton.setAttribute('text', 'value', this.data.muted ? '🔇' : '🔊');
            });
            
            // Add to camera
            const camera = document.querySelector('#camera');
            if (camera) {
                camera.appendChild(muteButton);
                this.muteButton = muteButton;
            } else {
                Debug.error('audio', 'setupMuteButton', 'Camera not found');
            }
        } catch (error) {
            Debug.error('audio', 'setupMuteButton', error);
        }
    },
    
    onGameStateChanged: function(e) {
        try {
            Debug.log('audio', 'gameStateChanged', { state: e.detail.state });
            if (e.detail.state === 'playing') {
                this.playSound('start');
                this.playMusic();
            } else if (e.detail.state === 'finished') {
                this.playSound('end');
                this.stopMusic();
            }
        } catch (error) {
            Debug.error('audio', 'onGameStateChanged', error);
        }
    },
    
    playSound: function(id) {
        try {
            if (this.data.muted || !this.sounds[id]) return false;
            
            Debug.log('audio', 'playSound', { id });
            
            // Clone the audio to allow overlapping sounds
            const sound = this.sounds[id].cloneNode();
            sound.volume = this.data.sfxVolume;
            
            // Add error handling for sound playback
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    Debug.error('audio', `playSound:${id}`, error);
                });
            }
            
            // Clean up after playing
            sound.addEventListener('ended', () => {
                sound.remove();
            });
            
            return true;
        } catch (error) {
            Debug.error('audio', `playSound:${id}`, error);
            return false;
        }
    },
    
    playMusic: function() {
        try {
            if (this.data.muted || !this.music) return;
            
            Debug.log('audio', 'playMusic', {});
            this.music.volume = this.data.musicVolume;
            this.music.currentTime = 0;
            
            const playPromise = this.music.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    Debug.error('audio', 'playMusic', error);
                });
            }
        } catch (error) {
            Debug.error('audio', 'playMusic', error);
        }
    },
    
    stopMusic: function() {
        try {
            if (!this.music) return;
            
            Debug.log('audio', 'stopMusic', {});
            // Fade out music
            const fadeInterval = setInterval(() => {
                if (this.music.volume > 0.05) {
                    this.music.volume -= 0.05;
                } else {
                    this.music.pause();
                    this.music.currentTime = 0;
                    clearInterval(fadeInterval);
                }
            }, 100);
        } catch (error) {
            Debug.error('audio', 'stopMusic', error);
            if (this.music) {
                this.music.pause();
                this.music.currentTime = 0;
            }
        }
    },
    
    mute: function() {
        Debug.log('audio', 'mute', {});
        this.data.muted = true;
        if (this.music) this.music.pause();
    },
    
    unmute: function() {
        Debug.log('audio', 'unmute', {});
        this.data.muted = false;
        if (this.music && this.el.sceneEl.is('playing')) {
            this.playMusic();
        }
    },
    
    toggleMute: function() {
        if (this.data.muted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.data.muted;
    }
});