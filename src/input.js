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

        // Key codes for different browsers
        this.keyCodes = {
            // Modern browsers use KeyboardEvent.code
            KeyW: 'forward',
            KeyS: 'backward',
            KeyA: 'left',
            KeyD: 'right',
            Space: 'jump',
            
            // Fallbacks for older browsers
            87: 'forward',  // W
            83: 'backward', // S
            65: 'left',     // A
            68: 'right',    // D
            32: 'jump'      // Space
        };

        // Bind event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Touch controls for mobile
        this.setupTouchControls();
        
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
        this.debugElement.style.top = '50px';
        this.debugElement.style.left = '10px';
        this.debugElement.style.color = 'white';
        this.debugElement.style.fontFamily = 'monospace';
        this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.debugElement.style.padding = '10px';
        this.debugElement.style.borderRadius = '5px';
        this.debugElement.style.fontSize = '12px';
        this.debugElement.style.display = 'none'; // Hidden by default
        document.body.appendChild(this.debugElement);
        
        // Show debug info on double click
        document.addEventListener('dblclick', () => {
            this.debugElement.style.display = this.debugElement.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    /**
     * Update debug info
     */
    updateDebugInfo() {
        if (!this.debugElement) return;
        
        this.debugElement.innerHTML = `
            Forward: ${this.keys.forward}<br>
            Backward: ${this.keys.backward}<br>
            Left: ${this.keys.left}<br>
            Right: ${this.keys.right}<br>
            Jump: ${this.keys.jump}
        `;
    }
    
    /**
     * Set up touch controls for mobile devices
     */
    setupTouchControls() {
        // Create touch controls container
        const touchControls = document.createElement('div');
        touchControls.style.position = 'absolute';
        touchControls.style.bottom = '20px';
        touchControls.style.left = '20px';
        touchControls.style.display = 'flex';
        touchControls.style.flexDirection = 'column';
        touchControls.style.gap = '10px';
        
        // Only show on touch devices
        if ('ontouchstart' in window) {
            touchControls.style.display = 'flex';
        } else {
            touchControls.style.display = 'none';
        }
        
        // Create direction pad
        const dpad = document.createElement('div');
        dpad.style.display = 'grid';
        dpad.style.gridTemplateColumns = 'repeat(3, 50px)';
        dpad.style.gridTemplateRows = 'repeat(3, 50px)';
        dpad.style.gap = '5px';
        
        // Create buttons
        const createButton = (text, key, gridArea) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.width = '50px';
            button.style.height = '50px';
            button.style.borderRadius = '5px';
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            button.style.border = 'none';
            button.style.color = 'white';
            button.style.fontSize = '20px';
            button.style.fontWeight = 'bold';
            button.style.gridArea = gridArea;
            button.style.touchAction = 'manipulation';
            
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                this.updateDebugInfo();
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                this.updateDebugInfo();
            });
            
            return button;
        };
        
        // Add direction buttons
        const upButton = createButton('W', 'forward', '1 / 2 / 2 / 3');
        const leftButton = createButton('A', 'left', '2 / 1 / 3 / 2');
        const downButton = createButton('S', 'backward', '2 / 2 / 3 / 3');
        const rightButton = createButton('D', 'right', '2 / 3 / 3 / 4');
        
        dpad.appendChild(upButton);
        dpad.appendChild(leftButton);
        dpad.appendChild(downButton);
        dpad.appendChild(rightButton);
        
        // Create jump button
        const jumpButton = document.createElement('button');
        jumpButton.textContent = 'JUMP';
        jumpButton.style.width = '100px';
        jumpButton.style.height = '50px';
        jumpButton.style.borderRadius = '5px';
        jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        jumpButton.style.border = 'none';
        jumpButton.style.color = 'white';
        jumpButton.style.fontSize = '16px';
        jumpButton.style.fontWeight = 'bold';
        jumpButton.style.marginTop = '10px';
        jumpButton.style.alignSelf = 'center';
        jumpButton.style.touchAction = 'manipulation';
        
        // Touch events for jump
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.jump = true;
            jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            this.updateDebugInfo();
        });
        
        jumpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.jump = false;
            jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            this.updateDebugInfo();
        });
        
        // Add controls to the page
        touchControls.appendChild(dpad);
        touchControls.appendChild(jumpButton);
        document.body.appendChild(touchControls);
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event 
     */
    onKeyDown(event) {
        // Try to use event.code (modern browsers)
        let keyName = event.code;
        
        // Fallback to event.keyCode for older browsers
        if (!this.keyCodes[keyName] && event.keyCode) {
            keyName = event.keyCode;
        }
        
        // Update key state if we recognize this key
        if (this.keyCodes[keyName]) {
            this.keys[this.keyCodes[keyName]] = true;
            this.updateDebugInfo();
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event) {
        // Try to use event.code (modern browsers)
        let keyName = event.code;
        
        // Fallback to event.keyCode for older browsers
        if (!this.keyCodes[keyName] && event.keyCode) {
            keyName = event.keyCode;
        }
        
        // Update key state if we recognize this key
        if (this.keyCodes[keyName]) {
            this.keys[this.keyCodes[keyName]] = false;
            this.updateDebugInfo();
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