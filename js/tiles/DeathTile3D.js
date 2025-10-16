import { Tile3D } from './Tile3D.js';

// Death/Lava tile (Type 6)
// Player can roll onto it but will sink and die
export class DeathTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable) {
        super(x, y, z, model, tileType, walkable);
    }

    dieOnGridLoc(player) {
        // Trigger death animation - player will sink into the red tile
        // The death animation in Player.doDeathAnim() handles:
        // - Shrinking and sinking the player model
        // - Calling game.playerDeath() when animation completes
        player.death();
    }
}
