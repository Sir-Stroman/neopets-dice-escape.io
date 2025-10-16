import { Tile3D } from './Tile3D.js';

// Falling tile (Type 7)
// Falls after player steps on it and moves away
export class FallingTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable, game) {
        super(x, y, z, model, tileType, walkable);
        this.game = game;
        this.falling = false;
        this.fallDelay = 500; // ms before falling after player leaves
        this.fallSpeed = 5; // Units per frame
        this.triggerTime = null;
        this.triggered = false;
        this.playerOnTile = false;
    }

    dieOnGridLoc(player) {
        // Mark that player stepped on this tile
        this.triggered = true;
        this.playerOnTile = true;
    }

    update(deltaTime, currentTime) {
        // Check if player has moved off the tile
        if (this.triggered && this.playerOnTile) {
            const playerTile = this.game.player.getCurrentTile();
            if (playerTile !== this) {
                // Player left the tile - start fall timer
                this.playerOnTile = false;
                this.triggerTime = Date.now();
            }
        }

        // Check if should start falling
        if (this.triggerTime !== null && !this.falling) {
            if (Date.now() - this.triggerTime >= this.fallDelay) {
                this.falling = true;
                this.walkable = false;
                console.log('Tile falling!');
            }
        }

        // Animate falling
        if (this.falling) {
            this.model.position.y -= this.fallSpeed;

            // Remove tile when it falls far enough
            if (this.model.position.y < -200) {
                this.removeFromWorld();
            }
        }
    }

    reset() {
        // Reset tile to initial state
        this.falling = false;
        this.triggerTime = null;
        this.triggered = false;
        this.playerOnTile = false;
        this.walkable = true;

        // Restore visual position
        this.model.position.set(this.x, this.y, this.z);

        // Re-add to scene if it was removed
        if (!this.model.parent && this.game.scene) {
            this.game.scene.add(this.model);
        }
    }
}
