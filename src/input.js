/**
 * Input handler for keyboard controls
 */
export class InputHandler {
    constructor() {
        // Key states
        this.keys = {
            forward: false,  // W
            backward: false, // S
            left: false,     // A
            right: false,    // D
            jump: false      // Space
        };

        // Bind event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event 
     */
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                break;
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
        }
    }

    /**
     * Get the movement direction based on current key states
     * @returns {Object} x and z components of movement direction
     */
    getMovementDirection() {
        const direction = { x: 0, z: 0 };
        
        if (this.keys.forward) direction.z -= 1;
        if (this.keys.backward) direction.z += 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;

        // Normalize the direction vector if moving diagonally
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }

        return direction;
    }

    /**
     * Check if the jump key is pressed
     * @returns {boolean}
     */
    isJumping() {
        return this.keys.jump;
    }
}