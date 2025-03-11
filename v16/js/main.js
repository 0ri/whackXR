// Hide splash screen when entering VR
document.querySelector('a-scene').addEventListener('enter-vr', function() {
    try {
        Debug.startStage('scene-setup');
        
        // Verify scene is ready
        const scene = this;
        if (!scene) {
            throw new Error('Scene not found');
        }
        
        Debug.log('startup', 'scene-ready', { sceneId: scene.id });
        Debug.completeStage('scene-setup');
        
        // Verify components are registered
        Debug.startStage('component-registration');
        const requiredComponents = [
            'gopher',
            'gopher-spawner',
            'gun-controller',
            'projectile',
            'game-manager',
            'floor-detector',
            'audio-manager'
        ];
        
        for (const component of requiredComponents) {
            if (!AFRAME.components[component]) {
                throw new Error(`Component ${component} not registered`);
            }
        }
        
        Debug.log('startup', 'components-registered', { components: requiredComponents });
        Debug.completeStage('component-registration');
        
        // Verify audio assets
        Debug.startStage('asset-loading');
        const audioAssets = document.querySelectorAll('a-assets audio');
        if (audioAssets.length === 0) {
            throw new Error('No audio assets found');
        }
        
        Debug.log('startup', 'assets-loaded', { audioCount: audioAssets.length });
        Debug.completeStage('asset-loading');
        
        // Initialize audio
        Debug.startStage('audio-setup');
        // Add audio-manager to scene if not already present
        if (!scene.components['audio-manager']) {
            scene.setAttribute('audio-manager', '');
        }
        
        Debug.log('startup', 'audio-setup-complete', {});
        Debug.completeStage('audio-setup');
        
        // Game initialization
        Debug.startStage('game-initialization');
        // Game manager will handle the rest
        Debug.log('startup', 'game-initialization-complete', {});
        Debug.completeStage('game-initialization');
        
        // Hide splash screen
        document.getElementById('splash-screen').style.display = 'none';
        
    } catch (error) {
        Debug.error('startup', 'initialization-failed', error);
    }
});

// Run tests when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add basic tests
    TestFramework.addTest('Document Ready', function() {
        if (!document.querySelector('a-scene')) {
            throw new Error('A-Frame scene not found');
        }
    });
    
    TestFramework.addTest('Audio Assets', function() {
        const audioAssets = document.querySelectorAll('a-assets audio');
        if (audioAssets.length === 0) {
            throw new Error('No audio assets found');
        }
    });
    
    // Run tests
    setTimeout(() => {
        const results = TestFramework.runTests();
        Debug.log('testing', 'initial-tests', results);
    }, 1000);
});