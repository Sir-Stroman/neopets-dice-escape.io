import { Tile3D } from './Tile3D.js';

// Plain walkable tile (Type 1)
// Can also be a wall if walkable = false (Type 2)
export class PlainTile3D extends Tile3D {
    constructor(x, y, z, model, tileType, walkable) {
        super(x, y, z, model, tileType, walkable);
    }

    dieOnGridLoc(player) {
        // Nothing special happens on plain tiles
    }
}
