import { Tile3D } from './Tile3D.js';

// Spike tile (Type 5)
// Retractable obstacle linked to switches
export class SpikeTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable, switchGroup) {
        super(x, y, z, model, tileType, walkable);
        this.switchGroup = switchGroup; // Which switch controls this spike
        this.extended = true; // Spikes start extended
        this.retractSpeed = 5; // Units per frame
        this.targetY = y;
        this.retractedY = y - 100; // Fully retracted position
    }

    dieOnGridLoc(player) {
        if (this.extended) {
            // Spikes are up - kill player
            player.death();
        }
    }

    retract() {
        // Called by switch - start retracting
        this.extended = false;
        this.walkable = true;
        console.log(`Spike ${this.switchGroup} retracting`);
    }

    extend() {
        // Extend spikes back up
        this.extended = true;
        this.walkable = false;
    }

    update(deltaTime, currentTime) {
        // Animate retraction/extension
        if (!this.extended && this.model.position.y > this.retractedY) {
            this.model.position.y -= this.retractSpeed;
            if (this.model.position.y < this.retractedY) {
                this.model.position.y = this.retractedY;
            }
        } else if (this.extended && this.model.position.y < this.targetY) {
            this.model.position.y += this.retractSpeed;
            if (this.model.position.y > this.targetY) {
                this.model.position.y = this.targetY;
            }
        }
    }

    getSwitchGroup() {
        return this.switchGroup;
    }

    reset() {
        // Reset spikes to extended state
        this.extended = true;
        this.walkable = false;

        // Restore visual position
        this.model.position.set(this.x, this.targetY, this.z);
    }
}
