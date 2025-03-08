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
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing application...');
            
            // Initialize physics
            await this.physics.init();
            
            // Create ground
            this.ground = this.physics.createGround(50);
            this.groundMesh = this.scene.createGround(50);
            
            // Create character
            this.character = new CharacterController(this.physics);
            this.characterMesh = this.scene.createCharacter(0.5, 1.0);
            
            // Start the game loop
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
            
            console.log('Application initialized');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.hasError = true;
            this.scene.showError('Failed to initialize physics. This may be due to WebAssembly support issues in your browser. Check console for details.');
            
            // Still create visual elements for display
            this.groundMesh = this.scene.createGround(50);
            this.characterMesh = this.scene.createCharacter(0.5, 1.0);
            
            // Start a simplified render loop
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.renderLoop.bind(this));
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
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Update physics
            this.physics.step(deltaTime);
            
            // Update character
            this.character.update(this.input, deltaTime);
            
            // Update character mesh position
            const characterPosition = this.character.getPosition();
            this.scene.updateMeshPosition(this.characterMesh, characterPosition);
            
            // Update camera to follow character
            this.scene.updateCameraTarget(characterPosition);
            
            // Render the scene
            this.scene.render();
            
            // Continue the game loop
            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (error) {
            console.error('Error in game loop:', error);
            this.hasError = true;
            this.scene.showError('An error occurred during the game loop. Switching to simplified rendering.');
            
            // Switch to simplified render loop
            requestAnimationFrame(this.renderLoop.bind(this));
        }
    }

    /**
     * Simplified render loop for when physics fails
     * @param {number} currentTime - Current timestamp
     */
    renderLoop(currentTime) {
        if (!this.isRunning) return;
        
        try {
            // Calculate delta time in seconds
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Simple camera rotation
            if (this.scene.controls) {
                this.scene.controls.update();
            }
            
            // Render the scene
            this.scene.render();
            
            // Continue the render loop
            requestAnimationFrame(this.renderLoop.bind(this));
        } catch (error) {
            console.error('Error in render loop:', error);
        }
    }
}

// Create and initialize the application
const app = new Application();
app.init().catch(error => {
    console.error('Unhandled error during initialization:', error);
    document.body.innerHTML += `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background-color: rgba(255, 0, 0, 0.8); color: white; padding: 20px; 
                    border-radius: 10px; font-family: sans-serif; text-align: center;">
            <h2>Application Error</h2>
            <p>Failed to initialize the application. This may be due to WebAssembly support issues in your browser.</p>
            <p>Error: ${error.message || 'Unknown error'}</p>
        </div>
    `;
});

// Display controls info in console
console.log('Controls:');
console.log('W, A, S, D - Move');
console.log('Space - Jump');
console.log('Mouse - Rotate camera');