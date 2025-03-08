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
        try {
            // Wait for Rapier to initialize
            if (typeof RAPIER.init === 'function') {
                await RAPIER.init();
            }
            
            // Create a new physics world
            this.world = new RAPIER.World(this.gravity);
            this.initialized = true;
            
            console.log('Physics world initialized');
        } catch (error) {
            console.error('Failed to initialize physics world:', error);
            // Create a fallback world with minimal functionality for testing
            this.createFallbackWorld();
        }
    }

    /**
     * Create a fallback world with minimal functionality
     * Used when Rapier initialization fails
     */
    createFallbackWorld() {
        console.warn('Creating fallback physics world');
        this.initialized = true;
        
        // Create a minimal world implementation
        this.world = {
            step: () => {},
            createRigidBody: () => this.createFallbackBody(),
            createCollider: () => ({}),
            castRay: () => null
        };
    }

    /**
     * Create a fallback body with minimal functionality
     * @returns {Object} - Fallback body
     */
    createFallbackBody() {
        return {
            handle: Math.random().toString(36).substring(2, 15),
            setLinvel: () => {},
            applyImpulse: () => {},
            translation: () => ({ x: 0, y: 0, z: 0 }),
            linvel: () => ({ x: 0, y: 0, z: 0 })
        };
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

        try {
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
        } catch (error) {
            console.error('Failed to create ground:', error);
            const fallbackBody = this.createFallbackBody();
            return { id: fallbackBody.handle, body: fallbackBody, collider: {} };
        }
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

        try {
            // Create a dynamic rigid body for the character
            let characterBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(position.x, position.y, position.z);
            
            // Try to lock rotations - handle API differences between Rapier versions
            try {
                // Try the setCanRotate method (newer versions)
                if (typeof characterBodyDesc.setCanRotate === 'function') {
                    characterBodyDesc = characterBodyDesc.setCanRotate(false);
                } 
                // Try the lockRotations method (some versions)
                else if (typeof characterBodyDesc.lockRotations === 'function') {
                    characterBodyDesc = characterBodyDesc.lockRotations(true);
                }
                // Try setting rotation locked flag directly (older versions)
                else if (characterBodyDesc.rotationsEnabled !== undefined) {
                    characterBodyDesc.rotationsEnabled = false;
                }
            } catch (rotError) {
                console.warn('Could not lock character rotations:', rotError);
            }
            
            const characterBody = this.world.createRigidBody(characterBodyDesc);
            
            // Try to lock rotations directly on the body if descriptor methods failed
            try {
                if (typeof characterBody.lockRotations === 'function') {
                    characterBody.lockRotations(true);
                } else if (characterBody.setRotationLocked && typeof characterBody.setRotationLocked === 'function') {
                    characterBody.setRotationLocked(true);
                }
            } catch (rotError) {
                console.warn('Could not lock character body rotations:', rotError);
            }

            // Create a capsule collider
            let characterColliderDesc;
            try {
                // Try capsule method (newer versions)
                if (typeof RAPIER.ColliderDesc.capsule === 'function') {
                    characterColliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius);
                } 
                // Try capsuleZ method (some versions)
                else if (typeof RAPIER.ColliderDesc.capsuleZ === 'function') {
                    characterColliderDesc = RAPIER.ColliderDesc.capsuleZ(height / 2, radius);
                }
                // Try cylinder as fallback
                else if (typeof RAPIER.ColliderDesc.cylinder === 'function') {
                    characterColliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius);
                }
                // If all else fails, use a cuboid
                else {
                    characterColliderDesc = RAPIER.ColliderDesc.cuboid(radius, height / 2 + radius, radius);
                }
            } catch (colliderError) {
                console.error('Failed to create character collider descriptor:', colliderError);
                // Fallback to cuboid
                characterColliderDesc = RAPIER.ColliderDesc.cuboid(radius, height / 2 + radius, radius);
            }
            
            const characterCollider = this.world.createCollider(characterColliderDesc, characterBody);

            // Store the body in our map
            const id = characterBody.handle;
            this.bodies.set(id, { body: characterBody, collider: characterCollider, type: 'character' });

            return { id, body: characterBody, collider: characterCollider };
        } catch (error) {
            console.error('Failed to create character:', error);
            const fallbackBody = this.createFallbackBody();
            return { id: fallbackBody.handle, body: fallbackBody, collider: {} };
        }
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

        try {
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
        } catch (error) {
            console.error('Failed to check if grounded:', error);
            return true; // Assume grounded in case of error
        }
    }

    /**
     * Step the physics simulation forward
     * @param {number} deltaTime - Time step in seconds
     */
    step(deltaTime) {
        if (!this.initialized) return;

        try {
            // Step the physics world
            this.world.step();
        } catch (error) {
            console.error('Failed to step physics world:', error);
        }
    }

    /**
     * Get the position of a rigid body
     * @param {RAPIER.RigidBody} body - The rigid body
     * @returns {Object} - Position as {x, y, z}
     */
    getBodyPosition(body) {
        if (!body) return { x: 0, y: 0, z: 0 };
        
        try {
            const position = body.translation();
            return { x: position.x, y: position.y, z: position.z };
        } catch (error) {
            console.error('Failed to get body position:', error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    /**
     * Set the linear velocity of a rigid body
     * @param {RAPIER.RigidBody} body - The rigid body
     * @param {Object} velocity - Velocity as {x, y, z}
     */
    setBodyVelocity(body, velocity) {
        if (!body) return;
        
        try {
            body.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
        } catch (error) {
            console.error('Failed to set body velocity:', error);
        }
    }

    /**
     * Apply an impulse to a rigid body
     * @param {RAPIER.RigidBody} body - The rigid body
     * @param {Object} impulse - Impulse as {x, y, z}
     */
    applyImpulse(body, impulse) {
        if (!body) return;
        
        try {
            body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
        } catch (error) {
            console.error('Failed to apply impulse:', error);
        }
    }
}