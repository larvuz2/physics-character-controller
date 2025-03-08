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
        
        // Add lights
        this.setupLights();
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(50, 50);
        this.scene.add(gridHelper);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Object mappings
        this.objects = new Map();
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
    }
    
    /**
     * Create a character capsule mesh
     * @param {number} radius - Radius of the capsule
     * @param {number} height - Height of the capsule
     * @returns {THREE.Group} - Character mesh group
     */
    createCharacter(radius = 0.5, height = 1.0) {
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
        
        // Add character to scene
        this.scene.add(group);
        return group;
    }
    
    /**
     * Update the position of a mesh based on a physics body
     * @param {THREE.Object3D} mesh - The mesh to update
     * @param {Object} position - Position as {x, y, z}
     */
    updateMeshPosition(mesh, position) {
        if (!mesh) return;
        
        mesh.position.set(position.x, position.y, position.z);
    }
    
    /**
     * Update the camera to follow a target
     * @param {Object} position - Target position as {x, y, z}
     */
    updateCameraTarget(position) {
        // Update orbit controls target
        this.controls.target.set(position.x, position.y, position.z);
        this.controls.update();
    }
    
    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}