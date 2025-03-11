// Debug and Error Handling System
const Debug = {
    enabled: true,
    errors: [],
    startupStages: [
        'scene-setup',
        'component-registration',
        'asset-loading',
        'audio-setup',
        'game-initialization'
    ],
    currentStage: '',
    
    log: function(component, action, details) {
        if (!this.enabled) return;
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}][${component}] ${action}:`, details);
    },
    
    error: function(component, action, error) {
        if (!this.enabled) return;
        const timestamp = new Date().toISOString();
        const errorDetails = {
            timestamp,
            component,
            action,
            error: error instanceof Error ? error : new Error(error),
            stage: this.currentStage
        };
        
        console.error(
            `[${timestamp}][${component}] ${action} ERROR:`,
            error instanceof Error ? error : error.toString()
        );
        
        this.errors.push(errorDetails);
        this.showError(errorDetails);
    },
    
    startStage: function(stage) {
        if (!this.startupStages.includes(stage)) {
            throw new Error(`Invalid startup stage: ${stage}`);
        }
        this.currentStage = stage;
        this.log('startup', 'stage-start', { stage });
    },
    
    completeStage: function(stage) {
        if (this.currentStage !== stage) {
            throw new Error(`Completing wrong stage: ${stage}, current: ${this.currentStage}`);
        }
        this.log('startup', 'stage-complete', { stage });
        this.currentStage = '';
    },
    
    showError: function(errorDetails) {
        const errorDisplay = document.getElementById('error-display');
        const errorMessage = document.getElementById('error-message');
        const errorDetailsElement = document.getElementById('error-details');
        
        if (!errorDisplay || !errorMessage || !errorDetailsElement) {
            console.error('Error display elements not found');
            return;
        }
        
        // Format error message
        errorMessage.textContent = `Error in ${errorDetails.component} during ${errorDetails.action}`;
        
        // Format detailed error information
        const details = [
            `Time: ${errorDetails.timestamp}`,
            `Component: ${errorDetails.component}`,
            `Action: ${errorDetails.action}`,
            `Stage: ${errorDetails.stage || 'none'}`,
            `Error: ${errorDetails.error.message}`,
            `Stack: ${errorDetails.error.stack || 'No stack trace'}`
        ].join('\n');
        
        errorDetailsElement.textContent = details;
        
        // Show error display
        errorDisplay.style.display = 'flex';
        
        // Setup dismiss button
        const dismissButton = document.getElementById('error-dismiss');
        if (dismissButton) {
            dismissButton.onclick = () => {
                errorDisplay.style.display = 'none';
            };
        }
    },
    
    clearErrors: function() {
        this.errors = [];
    }
};

// Testing Framework with Error Reporting
const TestFramework = {
    tests: [],
    results: [],
    
    addTest: function(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    runTests: function() {
        Debug.log('testing', 'start', { totalTests: this.tests.length });
        this.results = [];
        
        this.tests.forEach(test => {
            try {
                test.testFn();
                this.results.push({
                    name: test.name,
                    passed: true
                });
                Debug.log('testing', 'test-passed', { name: test.name });
            } catch (error) {
                this.results.push({
                    name: test.name,
                    passed: false,
                    error: error
                });
                Debug.error('testing', `test-failed: ${test.name}`, error);
            }
        });
        
        const summary = {
            total: this.tests.length,
            passed: this.results.filter(r => r.passed).length,
            failed: this.results.filter(r => !r.passed).length
        };
        
        Debug.log('testing', 'complete', summary);
        return summary;
    }
};