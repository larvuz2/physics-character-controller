/**
 * Character controller for physics-based movement
 */
export class CharacterController {
    /**
     * Create a new character controller
     * @param {Object} physics - Physics world instance
     * @param {Object} options - Character options
     */
    constructor(physics, options = {}) {
        this.physics = physics;
        
        // Character options
        this.options = {
            moveSpeed: 5.0,
            jumpForce: 10.0,
            jumpCooldown: 0.3,
            ...options
        };

        // Character state
        this.state = {
            isGrounded: false,
            isJumping: false,
            jumpCooldownTimer: 0,
            velocity: { x: 0, y: 0, z: 0 }
        };

        // Create the character physics body
        this.character = this.physics.createCharacter(
            { x: 0, y: 5, z: 0 },
            0.5,  // radius
            1.0   // height
        );
    }

    /**
     * Update the character controller
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(input, deltaTime) {
        if (!this.character || !this.character.body) return;

        // Check if character is grounded
        this.state.isGrounded = this.physics.isGrounded(this.character.body);

        // Update jump cooldown timer
        if (this.state.jumpCooldownTimer > 0) {
            this.state.jumpCooldownTimer -= deltaTime;
        }

        // Get current velocity
        const currentVelocity = this.character.body.linvel();
        this.state.velocity = {
            x: currentVelocity.x,
            y: currentVelocity.y,
            z: currentVelocity.z
        };

        // Handle movement
        this.handleMovement(input, deltaTime);

        // Handle jumping
        this.handleJump(input, deltaTime);
    }

    /**
     * Handle character movement based on input
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update
     */
    handleMovement(input, deltaTime) {
        // Get movement direction from input
        const direction = input.getMovementDirection();

        // Calculate target velocity
        const targetVelocity = {
            x: direction.x * this.options.moveSpeed,
            y: this.state.velocity.y, // Preserve vertical velocity
            z: direction.z * this.options.moveSpeed
        };

        // Apply the velocity to the character
        this.physics.setBodyVelocity(this.character.body, targetVelocity);
    }

    /**
     * Handle character jumping based on input
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update
     */
    handleJump(input, deltaTime) {
        // Check if jump button is pressed and character is grounded
        if (input.isJumping() && this.state.isGrounded && this.state.jumpCooldownTimer <= 0) {
            // Apply jump impulse
            this.physics.applyImpulse(this.character.body, { x: 0, y: this.options.jumpForce, z: 0 });
            
            // Set jump state
            this.state.isJumping = true;
            this.state.isGrounded = false;
            this.state.jumpCooldownTimer = this.options.jumpCooldown;
        }

        // Reset jump state when landing
        if (this.state.isGrounded && this.state.isJumping) {
            this.state.isJumping = false;
        }
    }

    /**
     * Get the character's current position
     * @returns {Object} - Position as {x, y, z}
     */
    getPosition() {
        if (!this.character || !this.character.body) {
            return { x: 0, y: 0, z: 0 };
        }
        
        return this.physics.getBodyPosition(this.character.body);
    }

    /**
     * Get the character's current state
     * @returns {Object} - Character state
     */
    getState() {
        return { ...this.state };
    }
}