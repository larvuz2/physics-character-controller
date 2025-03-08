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
    }
    
    /**
     * Initialize the application
     */
    async init() {
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
    }
    
    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
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
    }
}

// Create and initialize the application
const app = new Application();
app.init().catch(console.error);

// Display controls info in console
console.log('Controls:');
console.log('W, A, S, D - Move');
console.log('Space - Jump');
console.log('Mouse - Rotate camera');