import { Tile3D } from './Tile3D.js';

// Switch/Trigger tile (Type 4)
// Activates when player with correct die face steps on it
// Retracts spike tiles with matching switch group
export class SwitchTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable, requiredFace, switchGroup, game) {
        super(x, y, z, model, tileType, walkable);
        this.requiredFace = requiredFace; // Which die face activates switch
        this.switchGroup = switchGroup; // Which spike group to control
        this.game = game;
        this.activated = false;
    }

    dieOnGridLoc(player) {
        if (this.activated) return; // Already activated

        const playerFace = player.getFace();

        if (playerFace === this.requiredFace) {
            // Correct face - activate switch!
            this.activated = true;
            console.log(`Switch activated! Face ${playerFace} - Retracting spike group ${this.switchGroup}`);
            this.game.playerOnSwitch(this.switchGroup, this.model);
        }
    }

    getSwitchGroup() {
        return this.switchGroup;
    }

    reset() {
        // Reset switch to unactivated state
        this.activated = false;
    }
}
