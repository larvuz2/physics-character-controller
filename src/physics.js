import * as RAPIER from '@dimforge/rapier3d';

/**
 * Physics world manager using Rapier
 */
export class PhysicsWorld {
    constructor() {
        this.initialized = false;
        this.world = null;
        this.bodies = new Map();
        this.gravity = { x: 0.0, y: -9.81, z: 0.0 };
    }

    /**
     * Initialize the physics world
     * @returns {Promise<void>}
     */
    async init() {
        // Wait for Rapier to initialize
        await RAPIER.init();
        
        // Create a new physics world
        this.world = new RAPIER.World(this.gravity);
        this.initialized = true;
        
        console.log('Physics world initialized');
    }

    /**
     * Create a ground plane
     * @param {number} size - Size of the ground plane
     * @returns {Object} - Ground body and collider
     */
    createGround(size = 50) {
        if (!this.initialized) {
            console.error('Physics world not initialized');
            return null;
        }

        // Create a static rigid body for the ground
        const groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
        const groundBody = this.world.createRigidBody(groundBodyDesc);

        // Create a collider for the ground (flat box)
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(size, 0.1, size);
        const groundCollider = this.world.createCollider(groundColliderDesc, groundBody);

        // Store the body in our map
        const id = groundBody.handle;
        this.bodies.set(id, { body: groundBody, collider: groundCollider, type: 'ground' });

        return { id, body: groundBody, collider: groundCollider };
    }

    /**
     * Create a character capsule
     * @param {Object} position - Initial position
     * @param {number} radius - Radius of the capsule
     * @param {number} height - Height of the capsule (excluding hemispheres)
     * @returns {Object} - Character body and collider
     */
    createCharacter(position = { x: 0, y: 5, z: 0 }, radius = 0.5, height = 1.0) {
        if (!this.initialized) {
            console.error('Physics world not initialized');
            return null;
        }

        // Create a dynamic rigid body for the character
        const characterBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            // Lock rotations to prevent the character from falling over
            .setCanRotate(false);
        
        const characterBody = this.world.createRigidBody(characterBodyDesc);

        // Create a capsule collider
        const characterColliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius);
        const characterCollider = this.world.createCollider(characterColliderDesc, characterBody);

        // Store the body in our map
        const id = characterBody.handle;
        this.bodies.set(id, { body: characterBody, collider: characterCollider, type: 'character' });

        return { id, body: characterBody, collider: characterCollider };
    }

    /**
     * Check if a body is grounded (in contact with the ground)
     * @param {RAPIER.RigidBody} body - The body to check
     * @param {number} rayLength - Length of the ray to cast downward
     * @returns {boolean} - Whether the body is grounded
     */
    isGrounded(body, rayLength = 0.6) {
        if (!this.initialized || !body) {
            return false;
        }

        const position = body.translation();
        const rayDir = { x: 0, y: -1, z: 0 };

        // Cast a ray downward from the body's position
        const ray = new RAPIER.Ray(
            { x: position.x, y: position.y, z: position.z },
            { x: rayDir.x, y: rayDir.y, z: rayDir.z }
        );

        // Check for intersection with any collider
        const hit = this.world.castRay(
            ray,
            rayLength,
            true,
            undefined,
            undefined,
            undefined,
            body // Exclude the character's own collider
        );

        return hit !== null;
    }

    /**
     * Step the physics simulation forward
     * @param {number} deltaTime - Time step in seconds
     */
    step(deltaTime) {
        if (!this.initialized) return;

        // Step the physics world
        this.world.step();
    }

    /**
     * Get the position of a rigid body
     * @param {RAPIER.RigidBody} body - The rigid body
     * @returns {Object} - Position as {x, y, z}
     */
    getBodyPosition(body) {
        if (!body) return { x: 0, y: 0, z: 0 };
        
        const position = body.translation();
        return { x: position.x, y: position.y, z: position.z };
    }

    /**
     * Set the linear velocity of a rigid body
     * @param {RAPIER.RigidBody} body - The rigid body
     * @param {Object} velocity - Velocity as {x, y, z}
     */
    setBodyVelocity(body, velocity) {
        if (!body) return;
        
        body.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    }

    /**
     * Apply an impulse to a rigid body
     * @param {RAPIER.RigidBody} body - The rigid body
     * @param {Object} impulse - Impulse as {x, y, z}
     */
    applyImpulse(body, impulse) {
        if (!body) return;
        
        body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
    }
}