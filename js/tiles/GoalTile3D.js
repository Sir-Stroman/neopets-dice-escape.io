import { Tile3D } from './Tile3D.js';

// Goal/Exit tile (Type 3)
// Player must have correct die face to complete level
export class GoalTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable, requiredFace, game) {
        super(x, y, z, model, tileType, walkable);
        this.requiredFace = requiredFace; // Which die face is required (1-6)
        this.game = game;
        this.goalDie = null; // Reference to the white die cube (set by Game.js)
    }

    dieOnGridLoc(player) {
        const playerFace = player.getFace();

        if (playerFace === this.requiredFace) {
            // Player has correct face - level complete!
            console.log(`Level complete! Face ${playerFace} matches required face ${this.requiredFace}`);

            // Remove the goal die cube from the scene
            if (this.goalDie) {
                this.game.scene.remove(this.goalDie);
                // Dispose of geometry and materials
                if (this.goalDie.geometry) {
                    this.goalDie.geometry.dispose();
                }
                if (this.goalDie.material) {
                    if (Array.isArray(this.goalDie.material)) {
                        this.goalDie.material.forEach(mat => mat.dispose());
                    } else {
                        this.goalDie.material.dispose();
                    }
                }
                this.goalDie = null;
            }

            this.game.reachedGoal();
        } else {
            console.log(`Need face ${this.requiredFace}, but player has face ${playerFace}`);
        }
    }
}
