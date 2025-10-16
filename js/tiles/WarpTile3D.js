import * as THREE from 'three';
import { Tile3D } from './Tile3D.js';

// Warp/Teleport tile (Type 8)
// Teleports player to another location
export class WarpTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable, warpDestination, game) {
        super(x, y, z, model, tileType, walkable);
        this.warpDestination = warpDestination; // [gridX, gridZ]
        this.game = game;
        this.justWarped = false; // Track if player just warped here to prevent immediate re-warp

        // Particle system
        this.particles = null;
        this.particleCount = 480; // Rising ring particles
        this.perimeterParticleCount = 200; // Perimeter to ring particles
        this.createParticleSystem();
    }

    createParticleSystem() {
        const tileSize = 100; // Match game tile size
        const totalParticles = this.particleCount + this.perimeterParticleCount;

        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(totalParticles * 3);
        const velocities = [];
        const lifetimes = [];
        const particleTypes = []; // 0 = ring rising, 1 = perimeter to ring

        const ringRadius = tileSize * 0.35; // Ring radius (35% of tile size)
        const halfTile = tileSize / 2;

        // Initialize ring particles (rising upward)
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Spawn in a ring pattern
            const angle = (i / this.particleCount) * Math.PI * 2;
            const radiusVariation = ringRadius + (Math.random() - 0.5) * 10;

            positions[i3] = this.x + Math.cos(angle) * radiusVariation;
            positions[i3 + 1] = this.y + halfTile + Math.random() * 5; // Start at top face
            positions[i3 + 2] = this.z + Math.sin(angle) * radiusVariation;

            velocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: 1.2 + Math.random() * 0.8, // Upward velocity
                z: (Math.random() - 0.5) * 0.3
            });

            lifetimes.push(Math.random() * 100);
            particleTypes.push(0); // Ring particle
        }

        // Initialize perimeter particles (flowing from edges/corners to ring)
        // Spawn along the entire perimeter of the tile
        for (let i = 0; i < this.perimeterParticleCount; i++) {
            const i3 = (this.particleCount + i) * 3;

            // Distribute evenly around the perimeter (0 to 1)
            const perimeterPos = i / this.perimeterParticleCount;
            const totalPerimeter = tileSize * 4;
            const distAlongPerimeter = perimeterPos * totalPerimeter;

            let spawnX, spawnZ;

            // Determine which edge we're on and position along it
            if (distAlongPerimeter < tileSize) {
                // Top edge (left to right)
                spawnX = this.x - halfTile + distAlongPerimeter;
                spawnZ = this.z - halfTile;
            } else if (distAlongPerimeter < tileSize * 2) {
                // Right edge (top to bottom)
                spawnX = this.x + halfTile;
                spawnZ = this.z - halfTile + (distAlongPerimeter - tileSize);
            } else if (distAlongPerimeter < tileSize * 3) {
                // Bottom edge (right to left)
                spawnX = this.x + halfTile - (distAlongPerimeter - tileSize * 2);
                spawnZ = this.z + halfTile;
            } else {
                // Left edge (bottom to top)
                spawnX = this.x - halfTile;
                spawnZ = this.z + halfTile - (distAlongPerimeter - tileSize * 3);
            }

            // Add slight random variation
            spawnX += (Math.random() - 0.5) * 5;
            spawnZ += (Math.random() - 0.5) * 5;

            positions[i3] = spawnX;
            positions[i3 + 1] = this.y + halfTile + Math.random() * 3; // Start at top face
            positions[i3 + 2] = spawnZ;

            // Calculate velocity toward the ring (ringRadius from center)
            const angleToCenter = Math.atan2(spawnZ - this.z, spawnX - this.x);
            const targetX = this.x + Math.cos(angleToCenter) * ringRadius;
            const targetZ = this.z + Math.sin(angleToCenter) * ringRadius;

            const dx = targetX - spawnX;
            const dz = targetZ - spawnZ;
            const distance = Math.sqrt(dx * dx + dz * dz);
            const speed = 1.5 + Math.random() * 0.5;

            velocities.push({
                x: (dx / distance) * speed,
                y: 0.3 + Math.random() * 0.2, // Slight upward movement
                z: (dz / distance) * speed
            });

            lifetimes.push(Math.random() * 50);
            particleTypes.push(1); // Perimeter particle
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create particle material - dark green, very small size
        const material = new THREE.PointsMaterial({
            color: 0x006600, // Dark green
            size: 1.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Create particle system
        this.particles = new THREE.Points(geometry, material);
        this.game.scene.add(this.particles);

        // Store particle data
        this.particleVelocities = velocities;
        this.particleLifetimes = lifetimes;
        this.particleTypes = particleTypes;
        this.maxLifetime = 100;
        this.perimeterMaxLifetime = 50;
    }

    dieOnGridLoc(player) {
        // Only warp if player didn't just warp here
        if (!this.justWarped) {
            console.log(`Warping player to ${this.warpDestination}`);
            this.game.playerOnWarp(this.warpDestination, this);
            this.justWarped = true;
        }
    }

    // Reset warp state when player leaves this tile
    resetWarp() {
        this.justWarped = false;
    }

    update(deltaTime, currentTime) {
        if (!this.particles) return;

        const positions = this.particles.geometry.attributes.position.array;
        const tileSize = 100;
        const ringRadius = tileSize * 0.35;
        const halfTile = tileSize / 2;
        const totalParticles = this.particleCount + this.perimeterParticleCount;

        // Update each particle
        for (let i = 0; i < totalParticles; i++) {
            const i3 = i * 3;

            // Update lifetime
            this.particleLifetimes[i] += 1;

            // Update position based on velocity
            positions[i3] += this.particleVelocities[i].x;
            positions[i3 + 1] += this.particleVelocities[i].y;
            positions[i3 + 2] += this.particleVelocities[i].z;

            const particleType = this.particleTypes[i];

            if (particleType === 0) {
                // Ring particle - respawn if too old or too high
                if (this.particleLifetimes[i] > this.maxLifetime || positions[i3 + 1] > this.y + 150) {
                    const angle = (i / this.particleCount) * Math.PI * 2;
                    const radiusVariation = ringRadius + (Math.random() - 0.5) * 10;

                    positions[i3] = this.x + Math.cos(angle) * radiusVariation;
                    positions[i3 + 1] = this.y + halfTile + Math.random() * 5;
                    positions[i3 + 2] = this.z + Math.sin(angle) * radiusVariation;

                    this.particleVelocities[i].x = (Math.random() - 0.5) * 0.3;
                    this.particleVelocities[i].y = 1.2 + Math.random() * 0.8;
                    this.particleVelocities[i].z = (Math.random() - 0.5) * 0.3;

                    this.particleLifetimes[i] = 0;
                }
            } else if (particleType === 1) {
                // Perimeter particle - respawn if reached ring or too old
                const distToCenter = Math.sqrt(
                    Math.pow(positions[i3] - this.x, 2) +
                    Math.pow(positions[i3 + 2] - this.z, 2)
                );

                if (this.particleLifetimes[i] > this.perimeterMaxLifetime || distToCenter <= ringRadius + 5) {
                    // Respawn along perimeter
                    const particleIndex = i - this.particleCount;
                    const perimeterPos = particleIndex / this.perimeterParticleCount;
                    const totalPerimeter = tileSize * 4;
                    const distAlongPerimeter = perimeterPos * totalPerimeter;

                    let spawnX, spawnZ;

                    if (distAlongPerimeter < tileSize) {
                        spawnX = this.x - halfTile + distAlongPerimeter;
                        spawnZ = this.z - halfTile;
                    } else if (distAlongPerimeter < tileSize * 2) {
                        spawnX = this.x + halfTile;
                        spawnZ = this.z - halfTile + (distAlongPerimeter - tileSize);
                    } else if (distAlongPerimeter < tileSize * 3) {
                        spawnX = this.x + halfTile - (distAlongPerimeter - tileSize * 2);
                        spawnZ = this.z + halfTile;
                    } else {
                        spawnX = this.x - halfTile;
                        spawnZ = this.z + halfTile - (distAlongPerimeter - tileSize * 3);
                    }

                    spawnX += (Math.random() - 0.5) * 5;
                    spawnZ += (Math.random() - 0.5) * 5;

                    positions[i3] = spawnX;
                    positions[i3 + 1] = this.y + halfTile + Math.random() * 3;
                    positions[i3 + 2] = spawnZ;

                    // Recalculate velocity toward ring
                    const angleToCenter = Math.atan2(spawnZ - this.z, spawnX - this.x);
                    const targetX = this.x + Math.cos(angleToCenter) * ringRadius;
                    const targetZ = this.z + Math.sin(angleToCenter) * ringRadius;

                    const dx = targetX - spawnX;
                    const dz = targetZ - spawnZ;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    const speed = 1.5 + Math.random() * 0.5;

                    this.particleVelocities[i].x = (dx / distance) * speed;
                    this.particleVelocities[i].y = 0.3 + Math.random() * 0.2;
                    this.particleVelocities[i].z = (dz / distance) * speed;

                    this.particleLifetimes[i] = 0;
                }
            }
        }

        // Mark geometry as needing update
        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    stopStepFrame() {
        // Clean up particle system
        if (this.particles) {
            this.game.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        this.deleteMe = true;
    }
}
