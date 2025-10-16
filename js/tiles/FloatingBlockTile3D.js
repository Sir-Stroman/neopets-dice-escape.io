import { Tile3D } from './Tile3D.js';

// Floating Block tile (Type 5)
// Semi-transparent blocks that lower to form bridges when switch is activated
export class FloatingBlockTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable, switchGroup, baseY) {
        super(x, y, z, model, tileType, walkable);
        this.switchGroup = switchGroup; // Which switch controls this block
        this.raised = true; // Blocks start raised (floating above)
        this.moveSpeed = 5; // Units per frame
        this.raisedY = y; // Floating position (above base layer)
        this.loweredY = baseY; // Lowered position (at base layer, walkable)
    }

    dieOnGridLoc(player) {
        // Can't walk on floating blocks when they're raised
        if (this.raised) {
            // This shouldn't happen as tile is unwalkable, but just in case
            console.warn('Player somehow on raised floating block');
        }
    }

    lower() {
        // Called by switch - start lowering to form bridge
        this.raised = false;
        this.walkable = true;
        console.log(`Floating block ${this.switchGroup} lowering`);
    }

    raise() {
        // Raise blocks back up
        this.raised = true;
        this.walkable = false;
    }

    update(deltaTime, currentTime) {
        // Animate lowering/raising
        if (!this.raised && this.model.position.y > this.loweredY) {
            // Lowering
            this.model.position.y -= this.moveSpeed;
            if (this.model.position.y < this.loweredY) {
                this.model.position.y = this.loweredY;
            }
        } else if (this.raised && this.model.position.y < this.raisedY) {
            // Raising
            this.model.position.y += this.moveSpeed;
            if (this.model.position.y > this.raisedY) {
                this.model.position.y = this.raisedY;
            }
        }
    }

    getSwitchGroup() {
        return this.switchGroup;
    }

    reset() {
        // Reset blocks to raised state
        this.raised = true;
        this.walkable = false;

        // Restore visual position
        this.model.position.set(this.x, this.raisedY, this.z);
    }
}
