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
            rotationSpeed: 5.0,
            airControl: 0.3, // Reduced control while in air
            ...options
        };

        // Character state
        this.state = {
            isGrounded: false,
            isJumping: false,
            jumpCooldownTimer: 0,
            velocity: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 1, z: 0 }, // Fallback position
            rotation: { x: 0, y: 0, z: 0 }, // Character rotation
            direction: { x: 0, z: -1 }, // Forward direction
            movementDirection: { x: 0, z: 0 } // Current movement direction
        };

        // Flag to track if we're using fallback movement
        this.usingFallback = true; // Start with fallback, switch if physics works
        
        // Create the character physics body
        try {
            this.character = this.physics.createCharacter(
                { x: 0, y: 5, z: 0 },
                0.5,  // radius
                1.0   // height
            );
            
            // Check if we got a valid character back
            if (this.character && this.character.body && 
                typeof this.character.body.translation === 'function') {
                this.usingFallback = false;
                console.log('Using physics-based character movement');
            } else {
                console.warn('Invalid character body, using fallback movement');
            }
        } catch (error) {
            console.error('Failed to create character physics body:', error);
            this.character = null;
            // We'll use the fallback position system instead
        }
        
        if (this.usingFallback) {
            console.warn('Using fallback character movement system');
        }
    }

    /**
     * Update the character controller
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(input, deltaTime) {
        if (this.usingFallback) {
            // Use fallback movement system
            this.updateFallbackMovement(input, deltaTime);
            return;
        }

        if (!this.character || !this.character.body) {
            this.usingFallback = true;
            this.updateFallbackMovement(input, deltaTime);
            return;
        }

        try {
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

            // Get input direction
            const inputDirection = input.getMovementDirection();
            this.state.movementDirection = { ...inputDirection };
            
            // Update character rotation based on movement direction
            this.updateRotation(inputDirection, deltaTime);

            // Handle movement
            this.handleMovement(input, deltaTime);

            // Handle jumping
            this.handleJump(input, deltaTime);
            
            // Update position from physics
            const position = this.physics.getBodyPosition(this.character.body);
            this.state.position = { ...position };
        } catch (error) {
            console.error('Error in character update, switching to fallback:', error);
            this.usingFallback = true;
            this.updateFallbackMovement(input, deltaTime);
        }
    }

    /**
     * Update character rotation based on movement direction
     * @param {Object} inputDirection - Input movement direction
     * @param {number} deltaTime - Time since last update
     */
    updateRotation(inputDirection, deltaTime) {
        // Only update rotation if we're actually moving
        if (inputDirection.x !== 0 || inputDirection.z !== 0) {
            // Calculate target rotation angle based on movement direction
            const targetAngle = Math.atan2(inputDirection.x, inputDirection.z);
            
            // Current rotation angle
            let currentAngle = this.state.rotation.y;
            
            // Normalize angles to [-PI, PI]
            while (currentAngle > Math.PI) currentAngle -= Math.PI * 2;
            while (currentAngle < -Math.PI) currentAngle += Math.PI * 2;
            
            // Calculate shortest rotation path
            let angleDiff = targetAngle - currentAngle;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Apply rotation with smoothing
            const rotationAmount = angleDiff * this.options.rotationSpeed * deltaTime;
            this.state.rotation.y += rotationAmount;
            
            // Update direction vector based on rotation
            this.state.direction = {
                x: Math.sin(this.state.rotation.y),
                z: Math.cos(this.state.rotation.y)
            };
        }
    }

    /**
     * Update character using fallback movement system
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update
     */
    updateFallbackMovement(input, deltaTime) {
        // Get movement direction from input
        const inputDirection = input.getMovementDirection();
        this.state.movementDirection = { ...inputDirection };
        
        // Update character rotation based on movement direction
        this.updateRotation(inputDirection, deltaTime);
        
        // Simple gravity simulation
        if (!this.state.isGrounded) {
            this.state.velocity.y -= 9.81 * deltaTime;
        } else {
            this.state.velocity.y = 0;
            
            // Reset jump state when landing
            if (this.state.isJumping) {
                this.state.isJumping = false;
            }
        }
        
        // Update jump cooldown timer
        if (this.state.jumpCooldownTimer > 0) {
            this.state.jumpCooldownTimer -= deltaTime;
        }
        
        // Handle jumping with fallback system
        if (input.isJumping() && this.state.isGrounded && this.state.jumpCooldownTimer <= 0) {
            this.state.velocity.y = this.options.jumpForce * 0.1; // Reduced force for fallback
            this.state.isJumping = true;
            this.state.isGrounded = false;
            this.state.jumpCooldownTimer = this.options.jumpCooldown;
        }
        
        // Calculate movement velocity based on character's forward direction
        if (inputDirection.x !== 0 || inputDirection.z !== 0) {
            // Calculate movement in character's local space
            const moveSpeed = this.options.moveSpeed * (this.state.isGrounded ? 1.0 : this.options.airControl);
            
            // Apply movement in the direction the character is facing
            this.state.velocity.x = this.state.direction.x * inputDirection.z * moveSpeed;
            this.state.velocity.z = this.state.direction.z * inputDirection.z * moveSpeed;
            
            // Add strafing (left/right movement perpendicular to forward direction)
            this.state.velocity.x += -this.state.direction.z * inputDirection.x * moveSpeed;
            this.state.velocity.z += this.state.direction.x * inputDirection.x * moveSpeed;
        } else {
            // Slow down when no input
            this.state.velocity.x *= 0.9;
            this.state.velocity.z *= 0.9;
            
            // Stop completely if very slow
            if (Math.abs(this.state.velocity.x) < 0.01) this.state.velocity.x = 0;
            if (Math.abs(this.state.velocity.z) < 0.01) this.state.velocity.z = 0;
        }
        
        // Update position based on velocity
        this.state.position.x += this.state.velocity.x * deltaTime;
        this.state.position.y += this.state.velocity.y * deltaTime;
        this.state.position.z += this.state.velocity.z * deltaTime;
        
        // Simple ground collision
        if (this.state.position.y < 1) {
            this.state.position.y = 1;
            this.state.isGrounded = true;
        } else {
            this.state.isGrounded = false;
        }
    }

    /**
     * Handle character movement based on input
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update
     */
    handleMovement(input, deltaTime) {
        try {
            // Get movement direction from input
            const inputDirection = input.getMovementDirection();
            
            // Calculate movement in character's local space
            const moveSpeed = this.options.moveSpeed * (this.state.isGrounded ? 1.0 : this.options.airControl);
            let targetVelocity = { x: 0, y: this.state.velocity.y, z: 0 };
            
            if (inputDirection.x !== 0 || inputDirection.z !== 0) {
                // Apply movement in the direction the character is facing
                targetVelocity.x = this.state.direction.x * inputDirection.z * moveSpeed;
                targetVelocity.z = this.state.direction.z * inputDirection.z * moveSpeed;
                
                // Add strafing (left/right movement perpendicular to forward direction)
                targetVelocity.x += -this.state.direction.z * inputDirection.x * moveSpeed;
                targetVelocity.z += this.state.direction.x * inputDirection.x * moveSpeed;
            }

            // Apply the velocity to the character
            this.physics.setBodyVelocity(this.character.body, targetVelocity);
        } catch (error) {
            console.error('Error in handleMovement, switching to fallback:', error);
            this.usingFallback = true;
        }
    }

    /**
     * Handle character jumping based on input
     * @param {Object} input - Input handler
     * @param {number} deltaTime - Time since last update
     */
    handleJump(input, deltaTime) {
        try {
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
        } catch (error) {
            console.error('Error in handleJump, switching to fallback:', error);
            this.usingFallback = true;
        }
    }

    /**
     * Get the character's current position
     * @returns {Object} - Position as {x, y, z}
     */
    getPosition() {
        if (this.usingFallback) {
            return { ...this.state.position };
        }
        
        if (!this.character || !this.character.body) {
            this.usingFallback = true;
            return { ...this.state.position };
        }
        
        try {
            const position = this.physics.getBodyPosition(this.character.body);
            // Update our fallback position in case we need to switch
            this.state.position = { ...position };
            return position;
        } catch (error) {
            console.error('Error getting position, using fallback:', error);
            this.usingFallback = true;
            return { ...this.state.position };
        }
    }

    /**
     * Get the character's current rotation
     * @returns {Object} - Rotation as {x, y, z}
     */
    getRotation() {
        return { ...this.state.rotation };
    }

    /**
     * Get the character's current direction
     * @returns {Object} - Direction as {x, z}
     */
    getDirection() {
        return { ...this.state.direction };
    }

    /**
     * Get the character's current movement direction
     * @returns {Object} - Movement direction as {x, z}
     */
    getMovementDirection() {
        return { ...this.state.movementDirection };
    }

    /**
     * Get the character's current state
     * @returns {Object} - Character state
     */
    getState() {
        return { ...this.state };
    }
}