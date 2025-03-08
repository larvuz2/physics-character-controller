import { PhysicsWorld } from './physics.js';
import { CharacterController } from './character.js';
import { SceneManager } from './scene.js';
import { InputHandler } from './input.js';

/**
 * Main application class
 */
class Application {
    constructor() {
        // Initialize components
        this.physics = new PhysicsWorld();
        this.scene = new SceneManager();
        this.input = new InputHandler();
        
        // Game state
        this.lastTime = 0;
        this.isRunning = false;
        
        // Character and ground objects
        this.character = null;
        this.characterMesh = null;
        this.ground = null;
        this.groundMesh = null;

        // Error state
        this.hasError = false;
        this.usingFallback = false;
        
        // Debug info
        this.debugElement = null;
        this.setupDebugInfo();
    }
    
    /**
     * Set up debug info display
     */
    setupDebugInfo() {
        this.debugElement = document.createElement('div');
        this.debugElement.style.position = 'absolute';
        this.debugElement.style.bottom = '10px';
        this.debugElement.style.right = '10px';
        this.debugElement.style.color = 'white';
        this.debugElement.style.fontFamily = 'monospace';
        this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.debugElement.style.padding = '10px';
        this.debugElement.style.borderRadius = '5px';
        this.debugElement.style.fontSize = '12px';
        document.body.appendChild(this.debugElement);
    }
    
    /**
     * Update debug info
     */
    updateDebugInfo() {
        if (!this.debugElement || !this.character) return;
        
        const position = this.character.getPosition();
        const state = this.character.getState();
        const direction = this.character.getDirection();
        const rotation = this.character.getRotation();
        
        this.debugElement.innerHTML = `
            Position: X=${position.x.toFixed(2)}, Y=${position.y.toFixed(2)}, Z=${position.z.toFixed(2)}<br>
            Rotation: Y=${(rotation.y * 180 / Math.PI).toFixed(2)}°<br>
            Direction: X=${direction.x.toFixed(2)}, Z=${direction.z.toFixed(2)}<br>
            Grounded: ${state.isGrounded}<br>
            Jumping: ${state.isJumping}<br>
            Mode: ${this.usingFallback ? 'Fallback' : 'Physics'}<br>
            Camera: ${this.scene.cameraMode}<br>
            FPS: ${(1 / (this.deltaTime || 0.016)).toFixed(0)}
        `;
    }
    
    /**
     * Update status display
     * @param {string} message - Status message
     * @param {boolean} isError - Whether this is an error status
     */
    updateStatus(message, isError = false) {
        if (window.updateStatus) {
            window.updateStatus(message, isError);
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing application...');
            this.updateStatus('Initializing...');
            
            // Initialize physics
            await this.physics.init();
            
            // Create ground
            this.ground = this.physics.createGround(50);
            this.groundMesh = this.scene.createGround(50);
            
            // Create character
            this.character = new CharacterController(this.physics);
            this.characterMesh = this.scene.createCharacter(0.5, 1.0);
            
            // Check if we're using fallback mode
            this.usingFallback = this.character.usingFallback;
            
            if (this.usingFallback) {
                console.warn('Using fallback movement system');
                this.scene.showError('Using fallback movement system. Physics simulation disabled.');
                this.updateStatus('Using Fallback Movement', true);
            } else {
                this.updateStatus('Physics Initialized');
            }
            
            // Start the game loop
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
            
            console.log('Application initialized');
            
            // Hide loading screen
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.hasError = true;
            this.usingFallback = true;
            this.scene.showError('Failed to initialize physics. Using fallback movement system.');
            this.updateStatus('Using Fallback Movement', true);
            
            // Still create visual elements for display
            this.groundMesh = this.scene.createGround(50);
            this.character = new CharacterController(this.physics);
            this.characterMesh = this.scene.createCharacter(0.5, 1.0);
            
            // Start a simplified game loop
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
            
            // Hide loading screen
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }
    }
    
    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        try {
            // Calculate delta time in seconds
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Limit delta time to prevent large jumps
            if (this.deltaTime > 0.1) this.deltaTime = 0.1;
            
            // Update physics if not using fallback
            if (!this.usingFallback) {
                this.physics.step(this.deltaTime);
            }
            
            // Update character
            if (this.character) {
                // Check if fallback status changed
                if (this.usingFallback !== this.character.usingFallback) {
                    this.usingFallback = this.character.usingFallback;
                    if (this.usingFallback) {
                        console.warn('Switched to fallback movement system');
                        this.scene.showError('Switched to fallback movement system');
                        this.updateStatus('Using Fallback Movement', true);
                    }
                }
                
                this.character.update(this.input, this.deltaTime);
                
                // Update character mesh position and rotation
                const characterPosition = this.character.getPosition();
                const characterRotation = this.character.getRotation();
                this.scene.updateMeshPosition(
                    this.characterMesh, 
                    characterPosition,
                    characterRotation
                );
                
                // Update camera to follow character
                const characterDirection = this.character.getDirection();
                this.scene.updateCameraTarget(characterPosition, characterDirection);
            }
            
            // Update debug info
            this.updateDebugInfo();
            
            // Render the scene
            this.scene.render();
            
            // Continue the game loop
            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (error) {
            console.error('Error in game loop:', error);
            this.hasError = true;
            this.usingFallback = true;
            this.scene.showError('An error occurred during the game loop. Using fallback movement system.');
            this.updateStatus('Error - Using Fallback', true);
            
            // Switch to simplified game loop
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}

// Create and initialize the application
const app = new Application();
app.init().catch(error => {
    console.error('Unhandled error during initialization:', error);
    
    if (window.updateStatus) {
        window.updateStatus('Critical Error', true);
    }
    
    document.body.innerHTML += `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background-color: rgba(255, 0, 0, 0.8); color: white; padding: 20px; 
                    border-radius: 10px; font-family: sans-serif; text-align: center;">
            <h2>Application Error</h2>
            <p>Failed to initialize the application. This may be due to WebAssembly support issues in your browser.</p>
            <p>Error: ${error.message || 'Unknown error'}</p>
            <p>You can still try to use the application with reduced functionality.</p>
            <button onclick="this.parentElement.style.display='none';" style="padding: 10px; margin-top: 10px; cursor: pointer;">Continue Anyway</button>
        </div>
    `;
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
});

// Display controls info in console
console.log('Controls:');
console.log('W, A, S, D - Move');
console.log('Space - Jump');
console.log('C - Toggle camera mode');
console.log('Mouse - Rotate camera (in orbit mode)');