import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Scene manager for Three.js
 */
export class SceneManager {
    constructor() {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        
        // Create the camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.set(5, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Create orbit controls for camera
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Third-person camera settings
        this.thirdPersonCamera = {
            enabled: true,
            distance: 5,
            height: 2,
            rotationAngle: 0,
            smoothing: 0.1,
            target: new THREE.Vector3(0, 0, 0),
            offset: new THREE.Vector3(0, 2, 0)
        };
        
        // Camera mode (orbit or third-person)
        this.cameraMode = 'third-person'; // 'orbit' or 'third-person'
        
        // Add lights
        this.setupLights();
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(50, 50);
        this.scene.add(gridHelper);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Object mappings
        this.objects = new Map();

        // Add error message display
        this.setupErrorDisplay();
        
        // Add camera mode toggle
        this.setupCameraModeToggle();
    }
    
    /**
     * Set up camera mode toggle
     */
    setupCameraModeToggle() {
        // Add key listener for camera mode toggle
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyC') {
                this.toggleCameraMode();
            }
        });
        
        // Add camera mode info to the UI
        const cameraInfo = document.createElement('div');
        cameraInfo.style.position = 'absolute';
        cameraInfo.style.bottom = '10px';
        cameraInfo.style.left = '10px';
        cameraInfo.style.color = 'white';
        cameraInfo.style.fontFamily = 'monospace';
        cameraInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        cameraInfo.style.padding = '10px';
        cameraInfo.style.borderRadius = '5px';
        cameraInfo.textContent = 'Press C to toggle camera mode';
        document.body.appendChild(cameraInfo);
    }
    
    /**
     * Toggle between orbit and third-person camera modes
     */
    toggleCameraMode() {
        this.cameraMode = this.cameraMode === 'orbit' ? 'third-person' : 'orbit';
        
        // Enable/disable orbit controls based on mode
        if (this.cameraMode === 'orbit') {
            this.controls.enabled = true;
        } else {
            // Save current camera position before switching to third-person
            const currentPos = this.camera.position.clone();
            this.thirdPersonCamera.distance = currentPos.distanceTo(this.controls.target);
            this.thirdPersonCamera.height = currentPos.y - this.controls.target.y;
            this.controls.enabled = false;
        }
        
        console.log(`Camera mode switched to: ${this.cameraMode}`);
    }
    
    /**
     * Set up error display element
     */
    setupErrorDisplay() {
        this.errorDisplay = document.createElement('div');
        this.errorDisplay.style.position = 'absolute';
        this.errorDisplay.style.bottom = '10px';
        this.errorDisplay.style.left = '10px';
        this.errorDisplay.style.color = 'white';
        this.errorDisplay.style.fontFamily = 'monospace';
        this.errorDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        this.errorDisplay.style.padding = '10px';
        this.errorDisplay.style.borderRadius = '5px';
        this.errorDisplay.style.maxWidth = '80%';
        this.errorDisplay.style.display = 'none';
        document.body.appendChild(this.errorDisplay);
    }

    /**
     * Display an error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorDisplay.textContent = message;
        this.errorDisplay.style.display = 'block';
    }

    /**
     * Set up scene lighting
     */
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        
        this.scene.add(directionalLight);
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Create a ground plane mesh
     * @param {number} size - Size of the ground plane
     * @returns {THREE.Mesh} - Ground mesh
     */
    createGround(size = 50) {
        try {
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshStandardMaterial({
                color: 0x999999,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const ground = new THREE.Mesh(geometry, material);
            ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            ground.receiveShadow = true;
            
            this.scene.add(ground);
            return ground;
        } catch (error) {
            console.error('Failed to create ground mesh:', error);
            this.showError('Failed to create ground mesh. Check console for details.');
            return new THREE.Object3D(); // Return empty object as fallback
        }
    }
    
    /**
     * Create a character capsule mesh
     * @param {number} radius - Radius of the capsule
     * @param {number} height - Height of the capsule
     * @returns {THREE.Group} - Character mesh group
     */
    createCharacter(radius = 0.5, height = 1.0) {
        try {
            const group = new THREE.Group();
            
            // Create capsule body
            const geometry = new THREE.CapsuleGeometry(radius, height, 8, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x3498db,
                roughness: 0.7,
                metalness: 0.3
            });
            
            const capsule = new THREE.Mesh(geometry, material);
            capsule.castShadow = true;
            capsule.receiveShadow = true;
            
            group.add(capsule);
            
            // Add direction indicator (front of character)
            const indicatorGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
            const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.position.set(0, 0, -radius - 0.3);
            indicator.rotation.x = Math.PI / 2;
            indicator.castShadow = true;
            
            group.add(indicator);
            
            // Add character to scene
            this.scene.add(group);
            return group;
        } catch (error) {
            console.error('Failed to create character mesh:', error);
            this.showError('Failed to create character mesh. Check console for details.');
            return new THREE.Object3D(); // Return empty object as fallback
        }
    }
    
    /**
     * Update the position of a mesh based on a physics body
     * @param {THREE.Object3D} mesh - The mesh to update
     * @param {Object} position - Position as {x, y, z}
     * @param {Object} rotation - Rotation in radians (optional)
     */
    updateMeshPosition(mesh, position, rotation = null) {
        if (!mesh) return;
        
        try {
            mesh.position.set(position.x, position.y, position.z);
            
            // Update rotation if provided
            if (rotation) {
                mesh.rotation.set(rotation.x, rotation.y, rotation.z);
            }
        } catch (error) {
            console.error('Failed to update mesh position:', error);
        }
    }
    
    /**
     * Update the camera to follow a target
     * @param {Object} position - Target position as {x, y, z}
     * @param {Object} direction - Movement direction (for third-person camera)
     */
    updateCameraTarget(position, direction = { x: 0, z: -1 }) {
        try {
            // Update the target position for third-person camera
            this.thirdPersonCamera.target.set(position.x, position.y, position.z);
            
            if (this.cameraMode === 'orbit') {
                // Update orbit controls target
                this.controls.target.set(position.x, position.y, position.z);
                this.controls.update();
            } else if (this.cameraMode === 'third-person') {
                // Calculate camera position based on character position and direction
                const directionLength = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
                
                // Only update rotation angle if we're actually moving
                if (directionLength > 0.1) {
                    // Calculate the angle from the direction vector
                    this.thirdPersonCamera.rotationAngle = Math.atan2(direction.x, direction.z);
                }
                
                // Calculate camera position based on distance and angle
                const cameraX = position.x - Math.sin(this.thirdPersonCamera.rotationAngle) * this.thirdPersonCamera.distance;
                const cameraZ = position.z - Math.cos(this.thirdPersonCamera.rotationAngle) * this.thirdPersonCamera.distance;
                const cameraY = position.y + this.thirdPersonCamera.height;
                
                // Apply smoothing to camera movement
                this.camera.position.x += (cameraX - this.camera.position.x) * this.thirdPersonCamera.smoothing;
                this.camera.position.y += (cameraY - this.camera.position.y) * this.thirdPersonCamera.smoothing;
                this.camera.position.z += (cameraZ - this.camera.position.z) * this.thirdPersonCamera.smoothing;
                
                // Look at the target (slightly above the character)
                const lookAtTarget = new THREE.Vector3(
                    position.x, 
                    position.y + this.thirdPersonCamera.offset.y, 
                    position.z
                );
                this.camera.lookAt(lookAtTarget);
            }
        } catch (error) {
            console.error('Failed to update camera target:', error);
        }
    }
    
    /**
     * Render the scene
     */
    render() {
        try {
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Failed to render scene:', error);
        }
    }
}