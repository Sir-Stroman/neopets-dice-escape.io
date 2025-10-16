import * as THREE from 'three';

// Coin collectible (Type 9)
// Rotating coin that adds points when collected
export class Coin3D {
    constructor(x, y, z, model, tileType, walkable, game, coinValue) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.model = model; // THREE.Mesh (cylinder)
        this.tileType = tileType;
        this.walkable = walkable;
        this.game = game;
        this.coinValue = coinValue; // 5, 10, or 25 points
        this.collected = false;
        this.deleteMe = false;
        this.rotationSpeed = 2; // Degrees per frame

        // Set position
        if (this.model) {
            this.model.position.set(x, y, z);
        }

        // Start with slight offset Y for bobbing animation
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
        this.bobAmount = 10;
    }

    dieOnGridLoc(player) {
        if (!this.collected) {
            // Collect the coin
            this.collected = true;
            this.game.playerGetCoin(this.coinValue);

            // Play collection sound (TODO)
            console.log(`Collected ${this.coinValue} point coin!`);

            // Remove from world
            this.removeFromWorld();
        }
    }

    update(deltaTime, currentTime) {
        if (this.collected) return;

        // Rotate coin - since coin is laying flat (rotated 90° on X),
        // we rotate on Z axis to flip it and show both sides
        if (this.model) {
            this.model.rotation.z += THREE.MathUtils.degToRad(this.rotationSpeed);
        }
    }

    removeFromWorld() {
        if (this.model && this.model.parent) {
            this.model.parent.remove(this.model);
        }
        this.deleteMe = true;
    }

    stopStepFrame() {
        this.deleteMe = true;
    }

    getWalkable() {
        return this.walkable;
    }
}
