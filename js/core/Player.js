import * as THREE from 'three';

export class Player {
    constructor(game, world, board, tileSize, startFace, textures) {
        this.game = game;
        this.world = world; // THREE.Scene
        this.board = board; // 2D array of tiles
        this.tileSize = tileSize;
        this.textures = textures;

        // Movement state
        this.rotating = false;
        this.direction = 'nothing'; // 'left', 'right', 'up', 'down', 'nothing'
        this.speed = 6; // Degrees per frame
        this.totalRotation = 0;

        // Position tracking
        this.gridX = 0;
        this.gridZ = 0;

        // Die face tracking
        this.face = startFace; // Which face is up (1-6)

        // State flags
        this.dead = false;
        this.deleteMe = false;
        this.deathComplete = false;
        this.deathPhase = 0; // 0 = shrink, 1 = sink

        // Current tile reference
        this.currentTile = null;

        // Rotation tracking for animation
        this.rotationAxis = new THREE.Vector3();
        this.rotationPivot = new THREE.Vector3();

        // Create the die model
        this.model = null;
        this.referenceNode = null; // Pivot point for rotations

        this.createDieModel(startFace);
    }

    createDieModel(faceUp) {
        // Create die geometry
        const geometry = new THREE.BoxGeometry(this.tileSize, this.tileSize, this.tileSize);

        // Set color space for all die face textures
        Object.keys(this.textures).forEach(key => {
            if (key.startsWith('dieFace') && this.textures[key]) {
                this.textures[key].colorSpace = THREE.SRGBColorSpace;
            }
        });

        // Create materials for each face with the proper die face textures
        // Based on original Lingo code mapping (swapping 3 and 4):
        // Three.js box order: Right, Left, Top, Bottom, Front, Back
        const materials = [
            new THREE.MeshBasicMaterial({ map: this.textures.dieFace4 }), // Right = Face 4
            new THREE.MeshBasicMaterial({ map: this.textures.dieFace3 }), // Left = Face 3
            new THREE.MeshBasicMaterial({ map: this.textures.dieFace1 }), // Top = Face 1
            new THREE.MeshBasicMaterial({ map: this.textures.dieFace6 }), // Bottom = Face 6
            new THREE.MeshBasicMaterial({ map: this.textures.dieFace5 }), // Front = Face 5
            new THREE.MeshBasicMaterial({ map: this.textures.dieFace2 })  // Back = Face 2
        ];

        this.model = new THREE.Mesh(geometry, materials);
        this.model.castShadow = true;
        this.model.receiveShadow = true;

        // Set initial rotation based on starting face
        this.setInitialRotation(faceUp);

        // Create reference node (invisible pivot point)
        this.referenceNode = new THREE.Object3D();
        this.referenceNode.visible = false;
        this.world.add(this.referenceNode);

        // Add model to scene
        this.world.add(this.model);
    }

    setInitialRotation(faceUp) {
        // Set die rotation so specified face is up
        // Our texture mapping: Right=4, Left=3, Top=1, Bottom=6, Front=5, Back=2
        console.log(`Setting initial rotation for face ${faceUp}`);
        let rotation;
        switch (faceUp) {
            case 1:
                // Face 1 on top
                rotation = new THREE.Vector3(0, 0, 0);
                break;
            case 2:
                // Face 2 on top (currently showing at 90,0,0)
                rotation = new THREE.Vector3(90, 0, 0);
                break;
            case 3:
                // Face 3 on top (left side), rotated so 2 faces right and 1 faces back
                rotation = new THREE.Vector3(0, -90, -90);
                break;
            case 4:
                // Face 4 on top (right side)
                rotation = new THREE.Vector3(0, 0, 90);
                break;
            case 5:
                // Face 5 on top (front side)
                rotation = new THREE.Vector3(-90, 0, 0);
                break;
            case 6:
                // Face 6 on top (bottom side)
                rotation = new THREE.Vector3(180, 0, 0);
                break;
            default:
                rotation = new THREE.Vector3(0, 0, 0);
        }

        this.model.rotation.set(
            THREE.MathUtils.degToRad(rotation.x),
            THREE.MathUtils.degToRad(rotation.y),
            THREE.MathUtils.degToRad(rotation.z)
        );

        // Set the face tracking to match
        this.face = faceUp;

        // Verify the rotation worked correctly
        setTimeout(() => {
            const detectedFace = this.determineFacing();
            console.log(`Face ${faceUp} set, detected as face ${detectedFace}`);
        }, 100);
    }

    setPosition(gridZ, gridX) {
        // Set die position on grid
        this.gridZ = gridZ;
        this.gridX = gridX;

        const worldX = gridX * this.tileSize;
        const worldZ = gridZ * this.tileSize;
        const worldY = this.tileSize / 2; // Half tile above ground

        this.model.position.set(worldX, worldY, worldZ);
    }

    getKeys() {
        // Check keyboard input for movement
        // Arrow key codes: 37=left, 38=up, 39=right, 40=down
        if (!this.rotating) {
            let nextDir = 'nothing';

            // Check for arrow key presses
            if (this.game.keys.ArrowLeft || this.game.keys.KeyA) {
                nextDir = 'left';
            } else if (this.game.keys.ArrowRight || this.game.keys.KeyD) {
                nextDir = 'right';
            } else if (this.game.keys.ArrowDown || this.game.keys.KeyS) {
                nextDir = 'down';
            } else if (this.game.keys.ArrowUp || this.game.keys.KeyW) {
                nextDir = 'up';
            }

            if (nextDir !== 'nothing') {
                // Check if we can move in that direction
                const nextGridSpot = this.checkGrid(nextDir);
                // Can move if walkable (not wall=2, not switch=4, and exists)
                if (nextGridSpot !== 2 && nextGridSpot !== 4 &&
                    nextGridSpot !== null && nextGridSpot !== 0) {
                    this.direction = nextDir;
                } else {
                    this.direction = 'nothing';
                }
            } else {
                this.direction = 'nothing';
            }
        }
    }

    checkGrid(dir) {
        // Check if player can move in direction
        const numRows = this.board.length;
        const numCols = this.board[0].length;

        let tileX = this.gridX;
        let tileZ = this.gridZ;

        switch (dir) {
            case 'left':
                tileX -= 1;
                break;
            case 'right':
                tileX += 1;
                break;
            case 'up':
                tileZ -= 1;
                break;
            case 'down':
                tileZ += 1;
                break;
        }

        // Check bounds
        if (tileX < 0 || tileZ < 0 || tileX >= numCols || tileZ >= numRows) {
            return 0; // Out of bounds
        }

        const tile = this.board[tileZ][tileX];
        if (!tile) {
            return null;
        }

        // Return tile walkable status (will implement on tile classes)
        return tile.walkable ? 1 : 2;
    }

    placeNullObj() {
        // Place the reference node (pivot point) at the edge of the die
        // for rolling animation
        const boxPos = this.model.position.clone();
        const halfTile = this.tileSize / 2;

        let xEdge = boxPos.x;
        let zEdge = boxPos.z;

        switch (this.direction) {
            case 'left':
                xEdge = boxPos.x - halfTile;
                zEdge = boxPos.z;
                break;
            case 'right':
                xEdge = boxPos.x + halfTile;
                zEdge = boxPos.z;
                break;
            case 'up':
                xEdge = boxPos.x;
                zEdge = boxPos.z - halfTile;
                break;
            case 'down':
                xEdge = boxPos.x;
                zEdge = boxPos.z + halfTile;
                break;
        }

        const boxBottom = boxPos.y - halfTile;
        this.referenceNode.position.set(xEdge, boxBottom, zEdge);

        // Store the pivot for this movement
        this.rotationPivot.set(xEdge, boxBottom, zEdge);
    }

    setRotationVars() {
        // Set rotation axis based on movement direction
        // The die should roll around the bottom edge
        switch (this.direction) {
            case 'left':
                // Rolling left means rotating around the Z axis (front-back edge)
                this.rotationAxis.set(0, 0, 1);
                break;
            case 'right':
                // Rolling right means rotating around the Z axis (opposite direction)
                this.rotationAxis.set(0, 0, -1);
                break;
            case 'up':
                // Rolling up means rotating around the X axis (left-right edge)
                this.rotationAxis.set(-1, 0, 0);
                break;
            case 'down':
                // Rolling down means rotating around the X axis (opposite direction)
                this.rotationAxis.set(1, 0, 0);
                break;
            default:
                this.rotationAxis.set(0, 0, 0);
        }
    }

    checkCurrentTile() {
        // Update current tile and notify game
        const tileZ = this.gridZ;
        const tileX = this.gridX;

        if (this.board[tileZ] && this.board[tileZ][tileX]) {
            this.currentTile = this.board[tileZ][tileX];
            // Notify game that player is on this tile
            if (this.game.dieOnGridLoc) {
                this.game.dieOnGridLoc(tileZ, tileX);
            }
        }
    }

    determineFacing() {
        // Determine which die face is pointing up based on the die's rotation
        // We use the up vector (0, 1, 0) and see which face normal aligns with it

        const upVector = new THREE.Vector3(0, 1, 0);

        // Face normals in local space (before rotation)
        // Based on our texture mapping: Right=4, Left=3, Top=1, Bottom=6, Front=5, Back=2
        const faceNormals = [
            { face: 4, normal: new THREE.Vector3(1, 0, 0) },   // Right
            { face: 3, normal: new THREE.Vector3(-1, 0, 0) },  // Left
            { face: 1, normal: new THREE.Vector3(0, 1, 0) },   // Top
            { face: 6, normal: new THREE.Vector3(0, -1, 0) },  // Bottom
            { face: 5, normal: new THREE.Vector3(0, 0, 1) },   // Front
            { face: 2, normal: new THREE.Vector3(0, 0, -1) }   // Back
        ];

        // Transform each face normal by the die's rotation and find which one points up
        let maxDot = -1;
        let topFace = 1;

        for (const {face, normal} of faceNormals) {
            const rotatedNormal = normal.clone().applyQuaternion(this.model.quaternion);
            const dot = rotatedNormal.dot(upVector);

            if (dot > maxDot) {
                maxDot = dot;
                topFace = face;
            }
        }

        return topFace;
    }

    death() {
        // Player dies
        this.dead = true;
        // Play death sound
        this.game.soundManager.play('death');
        console.log('Player died!');
    }

    doDeathAnim() {
        if (this.deathPhase === 0) {
            // Phase 0: Shrink to 98% in one frame
            this.model.scale.set(0.98, 0.98, 0.98);
            this.deathPhase = 1;
        } else if (this.deathPhase === 1) {
            // Phase 1: Sink into ground
            const yPos = this.model.position.y - 1;
            this.model.position.y = yPos;

            if (yPos < (-this.tileSize / 2) && !this.deathComplete) {
                // Death animation complete - only call once
                this.deathComplete = true;
                this.game.playerDeath();
            }
        }
    }

    update(deltaTime) {
        if (this.dead) {
            this.doDeathAnim();
            return;
        }

        // Get input
        this.getKeys();

        // Start rotation if not rotating and direction is set
        if (!this.rotating && this.direction !== 'nothing') {
            this.rotating = true;
            this.placeNullObj();
            this.setRotationVars();
            this.totalRotation = 0;

            // Update grid position
            switch (this.direction) {
                case 'left':
                    this.gridX -= 1;
                    break;
                case 'right':
                    this.gridX += 1;
                    break;
                case 'up':
                    this.gridZ -= 1;
                    break;
                case 'down':
                    this.gridZ += 1;
                    break;
            }
        }

        // Perform rotation animation
        if (this.rotating) {
            // Rotate die around the bottom edge pivot point
            const pivot = this.rotationPivot;
            const angle = THREE.MathUtils.degToRad(this.speed);

            // Translate die to pivot point (so pivot is at origin)
            this.model.position.sub(pivot);

            // Apply rotation to position around pivot
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationAxis(this.rotationAxis, angle);
            this.model.position.applyMatrix4(rotationMatrix);

            // Rotate the die itself
            this.model.rotateOnWorldAxis(this.rotationAxis, angle);

            // Translate back from pivot
            this.model.position.add(pivot);

            this.totalRotation += this.speed;

            // Check if rotation is complete (90 degrees)
            if (this.totalRotation >= 90) {
                this.rotating = false;
                this.totalRotation = 0;

                // Play movement sound
                this.game.soundManager.play('playerMove');

                // Deduct round score
                this.game.deductRoundScore();

                // Update face
                this.face = this.determineFacing();

                // Check current tile
                this.checkCurrentTile();

                // Snap to grid position
                this.model.position.set(
                    this.gridX * this.tileSize,
                    this.tileSize / 2,
                    this.gridZ * this.tileSize
                );
            }
        }
    }

    stopStepFrame() {
        this.deleteMe = true;
    }

    getCurrentTile() {
        return this.currentTile;
    }

    getFace() {
        return this.face;
    }
}
