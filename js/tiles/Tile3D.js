import * as THREE from 'three';

// Base class for all tiles
export class Tile3D {
    constructor(x, y, z, model, tileType, walkable) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.model = model; // THREE.Mesh
        this.tileType = tileType;
        this.walkable = walkable;

        // Set position
        if (this.model) {
            this.model.position.set(x, y, z);
        }
    }

    // Called when player lands on this tile
    dieOnGridLoc(player) {
        // Override in subclasses
    }

    // Update method for animated tiles
    update(deltaTime, currentTime) {
        // Override in subclasses if needed
    }

    // Remove tile from world
    removeFromWorld() {
        if (this.model && this.model.parent) {
            this.model.parent.remove(this.model);
        }
    }

    getWalkable() {
        return this.walkable;
    }

    setWalkable(walkable) {
        this.walkable = walkable;
    }
}
