import * as THREE from 'three';
import { Player } from './Player.js';
import { Timer } from './Timer.js';
import { PlainTile3D } from '../tiles/PlainTile3D.js';
import { DeathTile3D } from '../tiles/DeathTile3D.js';
import { GoalTile3D } from '../tiles/GoalTile3D.js';
import { SwitchTile3D } from '../tiles/SwitchTile3D.js';
import { SpikeTile3D } from '../tiles/SpikeTile3D.js';
import { FallingTile3D } from '../tiles/FallingTile3D.js';
import { FloatingBlockTile3D } from '../tiles/FloatingBlockTile3D.js';
import { WarpTile3D } from '../tiles/WarpTile3D.js';
import { Coin3D } from '../tiles/Coin3D.js';
import { MapParser } from '../utils/MapParser.js';
import { SoundManager } from '../utils/SoundManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRunning = false;
        this.isPaused = false;

        // Game constants (from original Lingo code)
        this.TILE_SIZE = 100;
        this.MOVIE_WIDTH = 480;
        this.MOVIE_HEIGHT = 460;
        this.TIME_LIMIT = 60000; // 60 seconds in milliseconds

        // Game state
        this.level = 0;
        this.maxLevels = 24; // Based on map files found
        this.score = 0;
        this.roundScore = 100;
        this.lives = 3;
        this.timeBonus = 0;

        // Level state for reset
        this.playerStartZ = 0;
        this.playerStartX = 0;
        this.playerStartFace = 1;

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cameraNull = null; // Camera parent for rotation

        // Game objects
        this.board = []; // 2D array of tiles
        this.actors = []; // Objects that need updates (player, coins, etc)
        this.player = null;
        this.timer = null;
        this.soundManager = new SoundManager();

        // Textures
        this.textures = {
            plainTile: null,
            triggerTile: null,
            fallingTile: null,
            redTile: null,
            wood: null,
            goalTile: null,
            floormap: null,
            dieFace1: null,
            dieFace2: null,
            dieFace3: null,
            dieFace4: null,
            dieFace5: null,
            dieFace6: null,
            coin5: null,
            coin10: null,
            coin25: null,
            coin25bump: null,
            background1: null,
            background2: null,
            background3: null
        };

        // Timing
        this.clock = new THREE.Clock();
        this.lastTime = 0;

        // Cheat code tracking
        this.cheatBuffer = '';
        this.cheats = {
            'topdown': () => this.toggleCameraView(),
            'moretimeruki': () => this.resetTimer(),
            'helpmeplease': () => this.resetTimer(),
            'flybywire': () => this.toggleWireframe()
        };
        this.timerCheated = false;
        this.helpMe = false;

        // Camera mode
        this.cameraMode = 'iso'; // 'iso' or 'topdown'
        this.wireframeMode = false;

        // Camera spin state for level complete
        this.cameraSpinning = false;
        this.cameraSpinSpeed = 2.4; // Degrees per frame (8x faster)

        // Keyboard state
        this.keys = {};
    }

    async init() {
        console.log('Initializing game...');

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.MOVIE_WIDTH, this.MOVIE_HEIGHT);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create scene
        this.scene = new THREE.Scene();
        // Background will be set after textures load
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue (temporary)

        // Create camera (orthographic for isometric view)
        // Increased bounds to zoom out
        // Offset vertically to center as if 100px blue bar exists at top
        const verticalOffset = 150; // Pixels to shift down
        this.camera = new THREE.OrthographicCamera(
            -650, 650,  // left, right (was -500, 500)
            650 + verticalOffset, -650 + verticalOffset,  // top, bottom (shifted down)
            1,          // near
            12000       // far
        );

        // Create camera parent (null object for rotation)
        // Center it on the grid (3.5 tiles * 100 = 350 for a 7x7 grid)
        this.cameraNull = new THREE.Object3D();
        this.cameraNull.position.set(300, 0, 300); // Center of 7x7 grid
        this.scene.add(this.cameraNull);

        // Position camera for isometric view
        // Camera looks down more overhead (steeper angle than 45°)
        const distance = 1000; // Distance from center (was 800)
        const heightMultiplier = 1.3; // Increase Y to make camera more overhead
        this.camera.position.set(distance, distance * heightMultiplier, distance);
        this.camera.lookAt(0, 0, 0);
        this.cameraNull.add(this.camera);

        // Create lights (matching original dual directional setup)
        this.createLights();

        // Set up input handlers
        this.setupInput();

        console.log('Game initialized successfully');
    }

    createLights() {
        // Directional light 1 (from original: position -442, 800, 444, rotation -45, -45, 0)
        const light1 = new THREE.DirectionalLight(0xffffff, 0.6);
        light1.position.set(-442, 800, 444);
        light1.castShadow = true;
        light1.shadow.camera.left = -500;
        light1.shadow.camera.right = 500;
        light1.shadow.camera.top = 500;
        light1.shadow.camera.bottom = -500;
        this.scene.add(light1);

        // Directional light 2 (from original: position 431, 800, 429, rotation -45, 45, 0)
        const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
        light2.position.set(431, 800, 429);
        light2.castShadow = true;
        light2.shadow.camera.left = -500;
        light2.shadow.camera.right = 500;
        light2.shadow.camera.top = 500;
        light2.shadow.camera.bottom = -500;
        this.scene.add(light2);

        // Ambient light for fill
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);
    }

    setupInput() {
        // Track keyboard state for player movement
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (!this.isRunning || this.isPaused) return;

            // Cheat code detection
            this.cheatBuffer += e.key.toLowerCase();

            // Check if buffer matches any cheat code
            let foundMatch = false;
            for (const [cheatCode, callback] of Object.entries(this.cheats)) {
                if (this.cheatBuffer.endsWith(cheatCode)) {
                    callback();
                    this.cheatBuffer = '';
                    return;
                }
                // Check if current buffer is a partial match
                if (cheatCode.startsWith(this.cheatBuffer)) {
                    foundMatch = true;
                }
            }

            // Reset buffer if no partial matches
            if (!foundMatch) {
                this.cheatBuffer = e.key.toLowerCase();
            }

            // Limit buffer size
            if (this.cheatBuffer.length > 15) {
                this.cheatBuffer = this.cheatBuffer.slice(-15);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // UI button handlers
        document.getElementById('retry-button').addEventListener('click', () => {
            this.retryLevel();
        });

        document.getElementById('end-game-button').addEventListener('click', () => {
            this.endGame();
        });
    }

    async loadAssets(progressCallback) {
        console.log('Loading assets...');

        const textureLoader = new THREE.TextureLoader();
        const texturesToLoad = [
            { key: 'plainTile', path: './assets/textures/3d Cast_2_plainTile.png' },
            { key: 'triggerTile', path: './assets/textures/3d Cast_3_triggerTile.png' },
            { key: 'fallingTile', path: './assets/textures/3d Cast_4_falling_tile.png' },
            { key: 'redTile', path: './assets/textures/3d Cast_5_redTile.png' },
            { key: 'wood', path: './assets/textures/3d Cast_22_wood.png' },
            { key: 'goalTile', path: './assets/textures/3d Cast_23_goal_tile.png' },
            { key: 'floormap', path: './assets/textures/3d Cast_20_floormap.png' },
            { key: 'dieFace1', path: './assets/textures/3d Cast_6_die_1.png' },
            { key: 'dieFace2', path: './assets/textures/3d Cast_7_die_2.png' },
            { key: 'dieFace3', path: './assets/textures/3d Cast_8_die_3.png' },
            { key: 'dieFace4', path: './assets/textures/3d Cast_9_die_4.png' },
            { key: 'dieFace5', path: './assets/textures/3d Cast_10_die_5.png' },
            { key: 'dieFace6', path: './assets/textures/3d Cast_11_die_6.png' },
            { key: 'coin5', path: './assets/textures/3d Cast_15_coin_5.png' },
            { key: 'coin10', path: './assets/textures/3d Cast_16_coin_10.png' },
            { key: 'coin25', path: './assets/textures/coin25.png' },
            { key: 'coin25bump', path: './assets/textures/coin25_bumpmap.png' },
            { key: 'background1', path: './assets/textures/art_16_camera_bg1.png' },
            { key: 'background2', path: './assets/textures/art_17_camera_bg2.png' },
            { key: 'background3', path: './assets/textures/art_18_camera_bg3.png' }
        ];

        const totalTextures = texturesToLoad.length;
        let loadedCount = 0;

        // Load all textures
        for (const tex of texturesToLoad) {
            try {
                this.textures[tex.key] = await new Promise((resolve, reject) => {
                    textureLoader.load(
                        tex.path,
                        (texture) => {
                            // Use ClampToEdge for coin textures to prevent stretching
                            if (tex.key.startsWith('coin')) {
                                texture.wrapS = THREE.ClampToEdgeWrapping;
                                texture.wrapT = THREE.ClampToEdgeWrapping;
                            } else {
                                texture.wrapS = THREE.RepeatWrapping;
                                texture.wrapT = THREE.RepeatWrapping;
                            }

                            // Set color space for all textures once during loading
                            texture.colorSpace = THREE.SRGBColorSpace;

                            resolve(texture);
                        },
                        undefined,
                        reject
                    );
                });
                loadedCount++;
                progressCallback(loadedCount / totalTextures);
            } catch (error) {
                console.error(`Failed to load texture ${tex.key}:`, error);
            }
        }

        console.log('Assets loaded');
    }

    async start() {
        console.log('Starting game...');
        this.isRunning = true;
        this.isPaused = false;

        // Update retry button visibility
        this.updateRetryButtonVisibility();

        // Load level 1 (index 0 in array)
        await this.loadLevel(0);

        // Start game loop
        this.animate();
    }

    async loadLevel(levelIndex) {
        console.log(`Loading level ${levelIndex + 1}...`);

        // Clear existing board and actors
        this.clearLevel();

        // Reset camera rotation to initial view
        this.cameraNull.rotation.y = 0;

        // Get cached level data (instant - no parsing needed!)
        const mapData = MapParser.getCachedLevel(levelIndex);
        if (!mapData) {
            console.error(`Failed to load level ${levelIndex + 1} from cache`);
            return;
        }

        // Build the level from map data
        await this.buildLevelFromData(mapData);

        this.level = levelIndex + 1; // Display level as 1-indexed
        document.getElementById('level-display').textContent = `Level: ${this.level}`;

        // Set background based on level number
        // Levels 1-7: background1, Levels 8-15: background2, Levels 16-24: background3
        let backgroundTexture;
        if (this.level >= 1 && this.level <= 7) {
            backgroundTexture = this.textures.background1;
        } else if (this.level >= 8 && this.level <= 15) {
            backgroundTexture = this.textures.background2;
        } else if (this.level >= 16 && this.level <= 24) {
            backgroundTexture = this.textures.background3;
        } else {
            backgroundTexture = this.textures.background1; // Default to first background
        }

        if (backgroundTexture) {
            // Color space already set during initial texture load
            this.scene.background = backgroundTexture;
            console.log(`Background texture applied for level ${this.level}`);
        }

        console.log(`Level ${this.level} loaded successfully`);
    }

    clearLevel() {
        // Remove all actors
        for (const actor of this.actors) {
            if (actor.stopStepFrame) {
                actor.stopStepFrame();
            }
        }
        this.actors = [];

        // Remove all meshes from the scene (except lights and camera)
        // This will clean up tiles, goal dice, coins, etc.
        const objectsToRemove = [];
        this.scene.traverse((object) => {
            if (object.isMesh || (object.isPoints && object !== this.cameraNull)) {
                objectsToRemove.push(object);
            }
        });

        for (const object of objectsToRemove) {
            if (object.parent) {
                object.parent.remove(object);
            }
            // Dispose geometry and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }

        this.board = [];
        this.player = null;
        this.timer = null;
    }

    async buildLevelFromData(mapData) {
        // mapData is a 2D array of tile definitions like [{t:1}, {t:9}, {t:"P",f:1}, etc.]

        const numRows = mapData.length;
        const numCols = mapData[0].length;

        const geometry = new THREE.BoxGeometry(this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);

        // Create materials
        if (this.textures.plainTile) {
            this.textures.plainTile.colorSpace = THREE.SRGBColorSpace;
        }
        const plainMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.plainTile
        });

        if (this.textures.triggerTile) {
            this.textures.triggerTile.colorSpace = THREE.SRGBColorSpace;
        }
        const triggerMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.triggerTile
        });

        if (this.textures.fallingTile) {
            this.textures.fallingTile.colorSpace = THREE.SRGBColorSpace;
        }
        const fallingMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.fallingTile
        });

        if (this.textures.redTile) {
            this.textures.redTile.colorSpace = THREE.SRGBColorSpace;
        }
        const redMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.redTile
        });

        const spikeMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.5,
            metalness: 0.5
        });

        const warpMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.plainTile,
            roughness: 0.7,
            metalness: 0.3,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });

        const goalMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.goalTile,
            roughness: 0.5,
            metalness: 0.4,
            emissive: 0xffff00,
            emissiveIntensity: 0.4
        });

        // Create coin geometry
        const coinGeometry = new THREE.CylinderGeometry(42, 42, 7, 64, 1, false);
        coinGeometry.setAttribute('uv2', new THREE.BufferAttribute(coinGeometry.attributes.uv.array, 2));

        // Player start position and face
        let playerStartZ = 0;
        let playerStartX = 0;
        let playerStartFace = 1;

        // Build the level
        for (let z = 0; z < numRows; z++) {
            this.board[z] = [];
            for (let x = 0; x < numCols; x++) {
                const tileData = mapData[z][x];
                if (!tileData || tileData.t === 0 || tileData.t === null) {
                    // Empty space
                    this.board[z][x] = null;
                    continue;
                }

                let tileType = tileData.t;
                let material;
                let mesh;
                let usesCoinGeometry = false;

                // Randomize type 9 coins at the start
                if (tileType === 9) {
                    const rand = Math.random();
                    if (rand < 0.6) {
                        tileType = 9; // 5 points
                    } else if (rand < 0.9) {
                        tileType = 10; // 10 points
                    } else {
                        tileType = 11; // 25 points
                    }
                }

                // Determine material and geometry based on tile type
                // Tile types: 1=Plain, 3=Goal, 4=Switch/Trigger (with pip), 5=Floating Block, 6=Red, 7=Falling, 8=Warp, 9/10/11=Coins
                if (tileType === 1) {
                    material = plainMaterial;
                } else if (tileType === 3) {
                    material = plainMaterial; // Goal tile uses plain tile texture underneath
                } else if (tileType === 4) {
                    // Switch/Trigger tile - will create custom material with pip on top face
                    material = null; // Will be handled below
                } else if (tileType === 5) {
                    // Floating block - semi-transparent trigger tile material
                    const floatingMaterial = new THREE.MeshBasicMaterial({
                        map: this.textures.triggerTile,
                        transparent: true,
                        opacity: 0.6
                    });
                    material = floatingMaterial;
                } else if (tileType === 6) {
                    material = redMaterial; // Red tile
                } else if (tileType === 7) {
                    material = fallingMaterial; // Falling tile
                } else if (tileType === 8) {
                    material = plainMaterial; // Warp tile uses plain texture (particles show it's a warp)
                } else if (tileType === 9 || tileType === 10 || tileType === 11) {
                    // Coins (type already randomized if it was originally 9)
                    usesCoinGeometry = true;
                    const coinValue = tileType === 9 ? 5 : (tileType === 10 ? 10 : 25);
                    const coinTexture = tileType === 9 ? this.textures.coin5 :
                                        (tileType === 10 ? this.textures.coin10 : this.textures.coin25);

                    // Sample rim color
                    let rimColor = 0xffaa00;
                    if (coinTexture && coinTexture.image) {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = coinTexture.image;
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const pixelData = ctx.getImageData(img.width / 2, 0, 1, 1).data;
                        rimColor = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                    }

                    const rimMat = new THREE.MeshStandardMaterial({
                        color: rimColor,
                        roughness: 0.3,
                        metalness: 0.8
                    });
                    const faceMat = new THREE.MeshBasicMaterial({ map: coinTexture });

                    if (coinTexture) {
                        coinTexture.colorSpace = THREE.SRGBColorSpace;
                        coinTexture.center.set(0.5, 0.5);
                        coinTexture.rotation = Math.PI / 2;
                        coinTexture.minFilter = THREE.LinearMipMapLinearFilter;
                        coinTexture.magFilter = THREE.LinearFilter;
                        coinTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                    }
                    material = [rimMat, faceMat, faceMat];
                } else if (tileType === 'P') {
                    // Player start position
                    playerStartZ = z;
                    playerStartX = x;
                    playerStartFace = tileData.f || 1;
                    material = plainMaterial; // Place a plain tile where player starts
                } else {
                    // Default to plain
                    material = plainMaterial;
                }

                // Create mesh
                if (usesCoinGeometry) {
                    mesh = new THREE.Mesh(coinGeometry, material);
                    mesh.rotation.x = Math.PI / 2;
                } else if (tileType === 4) {
                    // Switch tile - create material array with pip on top face
                    const switchFace = tileData.f || 1;
                    const pipTexture = this.textures[`dieFace${switchFace}`];
                    if (pipTexture) {
                        pipTexture.colorSpace = THREE.SRGBColorSpace;
                    }

                    const pipMaterial = new THREE.MeshBasicMaterial({
                        map: pipTexture,
                        transparent: true,
                        opacity: 0.7
                    });

                    // Box faces: Right, Left, Top, Bottom, Front, Back
                    const switchMaterials = [
                        plainMaterial, // Right
                        plainMaterial, // Left
                        pipMaterial,   // Top (shows pip)
                        plainMaterial, // Bottom
                        plainMaterial, // Front
                        plainMaterial  // Back
                    ];

                    mesh = new THREE.Mesh(geometry, switchMaterials);
                } else {
                    mesh = new THREE.Mesh(geometry, material);
                }

                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.scene.add(mesh);

                // Create tile object
                const worldX = x * this.TILE_SIZE;
                const worldY = -this.TILE_SIZE / 2;
                const worldZ = z * this.TILE_SIZE;

                let tile;
                if (tileType === 1 || tileType === 'P') {
                    tile = new PlainTile3D(worldX, worldY, worldZ, mesh, 1, true);
                } else if (tileType === 3) {
                    // Goal tile (level end) - requires specific face
                    const goalFace = tileData.f || 1;
                    tile = new GoalTile3D(worldX, worldY, worldZ, mesh, 3, true, goalFace, this);

                    // Create semi-transparent die cube on goal tile showing required face
                    const dieSize = this.TILE_SIZE; // Same size as player die and tile
                    const dieGeometry = new THREE.BoxGeometry(dieSize, dieSize, dieSize);

                    // Create materials for the goal die - white sides except top shows required face
                    const whiteMaterial = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.5
                    });

                    // Get the die face texture for the required face
                    const requiredFaceTexture = this.textures[`dieFace${goalFace}`];
                    const topFaceMaterial = new THREE.MeshBasicMaterial({
                        map: requiredFaceTexture,
                        transparent: true,
                        opacity: 0.7
                    });

                    if (requiredFaceTexture) {
                        requiredFaceTexture.colorSpace = THREE.SRGBColorSpace;
                    }

                    // Box material order: Right, Left, Top, Bottom, Front, Back
                    const goalDieMaterials = [
                        whiteMaterial.clone(), // Right
                        whiteMaterial.clone(), // Left
                        topFaceMaterial,       // Top (shows required face)
                        whiteMaterial.clone(), // Bottom
                        whiteMaterial.clone(), // Front
                        whiteMaterial.clone()  // Back
                    ];

                    const goalDie = new THREE.Mesh(dieGeometry, goalDieMaterials);
                    goalDie.position.set(worldX, this.TILE_SIZE / 2, worldZ); // Sits on tile (same height as player)
                    this.scene.add(goalDie);

                    // Store reference to goal die in the tile so it can be removed on goal reached
                    tile.goalDie = goalDie;
                } else if (tileType === 4) {
                    // Switch/Trigger tile - pip is on the top face of the tile itself
                    const switchFace = tileData.f || 1;
                    const switchGroup = tileData.s || 1;
                    tile = new SwitchTile3D(worldX, worldY, worldZ, mesh, 4, true, switchFace, switchGroup, this);
                } else if (tileType === 5) {
                    // Floating block - controlled by switch group
                    const floatingGroup = tileData.s || 1;
                    // Pass baseY (worldY) so blocks lower to match the base stage level
                    tile = new FloatingBlockTile3D(worldX, worldY + this.TILE_SIZE, worldZ, mesh, 5, false, floatingGroup, worldY);
                    this.actors.push(tile);
                } else if (tileType === 6) {
                    // Red death tile - walkable so player can roll onto it
                    tile = new DeathTile3D(worldX, worldY, worldZ, mesh, 6, true);
                } else if (tileType === 7) {
                    // Falling tile
                    tile = new FallingTile3D(worldX, worldY, worldZ, mesh, 7, true, this);
                    this.actors.push(tile);
                } else if (tileType === 8) {
                    // Warp tile
                    let warpDest = [1, 1]; // Default destination
                    if (tileData.w) {
                        // Parse warp destination string like "[4,6]"
                        try {
                            warpDest = JSON.parse(tileData.w);
                        } catch (e) {
                            console.warn('Failed to parse warp destination:', tileData.w);
                        }
                    }
                    tile = new WarpTile3D(worldX, worldY, worldZ, mesh, 8, true, warpDest, this);
                    this.actors.push(tile); // Add to actors so particles update
                } else if (tileType === 9 || tileType === 10 || tileType === 11) {
                    // Coin (type already randomized if it was originally 9)
                    const coinValue = tileType === 9 ? 5 : (tileType === 10 ? 10 : 25);
                    tile = new Coin3D(worldX, this.TILE_SIZE / 2, worldZ, mesh, tileType, true, this, coinValue);
                    this.actors.push(tile);
                    // Add floor tile underneath
                    const floorMesh = new THREE.Mesh(geometry, plainMaterial);
                    floorMesh.position.set(worldX, worldY, worldZ);
                    floorMesh.castShadow = true;
                    floorMesh.receiveShadow = true;
                    this.scene.add(floorMesh);
                } else {
                    tile = new PlainTile3D(worldX, worldY, worldZ, mesh, tileType, true);
                }

                this.board[z][x] = tile;
            }
        }

        // Store player start position for resets
        this.playerStartZ = playerStartZ;
        this.playerStartX = playerStartX;
        this.playerStartFace = playerStartFace;

        // Create player
        this.player = new Player(this, this.scene, this.board, this.TILE_SIZE, playerStartFace, this.textures);
        this.player.setPosition(playerStartZ, playerStartX);
        this.actors.push(this.player);

        // Create timer
        this.timer = new Timer(this.TIME_LIMIT, this);
        this.actors.push(this.timer);
    }

    createTestLevel() {
        // Create a simple test level with basic tiles
        // This will be replaced with actual level loading

        const geometry = new THREE.BoxGeometry(this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);

        // Create materials for different tile types
        // Ensure texture is in correct color space
        if (this.textures.plainTile) {
            this.textures.plainTile.colorSpace = THREE.SRGBColorSpace;
        }
        const plainMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.plainTile
        });

        if (this.textures.triggerTile) {
            this.textures.triggerTile.colorSpace = THREE.SRGBColorSpace;
        }
        const triggerMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.triggerTile
        });

        if (this.textures.fallingTile) {
            this.textures.fallingTile.colorSpace = THREE.SRGBColorSpace;
        }
        const fallingMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.fallingTile
        });

        if (this.textures.redTile) {
            this.textures.redTile.colorSpace = THREE.SRGBColorSpace;
        }
        const redMaterial = new THREE.MeshBasicMaterial({
            map: this.textures.redTile
        });

        const spikeMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.5,
            metalness: 0.5
        });

        const warpMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.plainTile,
            roughness: 0.7,
            metalness: 0.3,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });

        const goalMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.goalTile,
            roughness: 0.5,
            metalness: 0.4,
            emissive: 0xffff00,
            emissiveIntensity: 0.4
        });

        // Create a 7x7 grid with one of each tile type
        // Types: 1=Plain, 2=Switch, 3=Falling, 4=Death, 5=Spike, 6=Warp, 7=Goal, 9/10/11=Coins
        const tilePattern = [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 2, 5, 1, 1, 1],   // Switch (face 1) and Spike (group 1)
            [1, 3, 1, 9, 6, 1, 1],   // Falling, Coin(5), and Warp
            [1, 1, 10, 1, 11, 1, 1], // Coin(10) and Coin(25)
            [1, 4, 1, 1, 7, 1, 1],   // Death and Goal (face 1)
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ];

        // Create coin geometry - CylinderGeometry with material array [side, topCap, bottomCap]
        const coinGeometry = new THREE.CylinderGeometry(42, 42, 7, 64, 1, false); // thickness = 7
        // Add uv2 for aoMap support (duplicate uv into uv2)
        coinGeometry.setAttribute('uv2', new THREE.BufferAttribute(coinGeometry.attributes.uv.array, 2));

        for (let z = 0; z < 7; z++) {
            this.board[z] = [];
            for (let x = 0; x < 7; x++) {
                const tileType = tilePattern[z][x];
                let material;
                let mesh;
                let usesCoinGeometry = false;

                switch(tileType) {
                    case 1: material = plainMaterial; break;
                    case 2: material = triggerMaterial; break;
                    case 3: material = fallingMaterial; break;
                    case 4: material = redMaterial; break;
                    case 5: material = spikeMaterial; break;
                    case 6: material = plainMaterial; break; // Warp tile uses plain texture
                    case 7: material = goalMaterial; break;
                    case 9:
                        // Coin 5 points - material array [rim, topCap, bottomCap]
                        usesCoinGeometry = true;

                        // Sample edge color from texture (top center pixel)
                        let rimColor5 = 0xffaa00; // Default fallback
                        if (this.textures.coin5 && this.textures.coin5.image) {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = this.textures.coin5.image;
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            // Sample pixel at top center (x = width/2, y = 0)
                            const pixelData = ctx.getImageData(img.width / 2, 0, 1, 1).data;
                            rimColor5 = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                            console.log('Coin5 rim color sampled:', '#' + rimColor5.toString(16));
                        }

                        const rimMat5 = new THREE.MeshStandardMaterial({
                            color: rimColor5,
                            roughness: 0.3,
                            metalness: 0.8
                        });
                        const faceMat5 = new THREE.MeshBasicMaterial({
                            map: this.textures.coin5
                        });

                        if (this.textures.coin5) {
                            this.textures.coin5.colorSpace = THREE.SRGBColorSpace;
                            // Rotate texture 90° counter-clockwise
                            this.textures.coin5.center.set(0.5, 0.5);
                            this.textures.coin5.rotation = Math.PI / 2; // 90 degrees CCW
                            // Add sharpness - use nearest filter for crisp edges
                            this.textures.coin5.minFilter = THREE.LinearMipMapLinearFilter;
                            this.textures.coin5.magFilter = THREE.LinearFilter;
                            this.textures.coin5.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                        }
                        material = [rimMat5, faceMat5, faceMat5]; // [side, top, bottom]
                        break;
                    case 10:
                        // Coin 10 points
                        usesCoinGeometry = true;

                        // Sample edge color from texture (top center pixel)
                        let rimColor10 = 0xffaa00; // Default fallback
                        if (this.textures.coin10 && this.textures.coin10.image) {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = this.textures.coin10.image;
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            const pixelData = ctx.getImageData(img.width / 2, 0, 1, 1).data;
                            rimColor10 = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                            console.log('Coin10 rim color sampled:', '#' + rimColor10.toString(16));
                        }

                        const rimMat10 = new THREE.MeshStandardMaterial({
                            color: rimColor10,
                            roughness: 0.3,
                            metalness: 0.8
                        });
                        const faceMat10 = new THREE.MeshBasicMaterial({
                            map: this.textures.coin10
                        });
                        if (this.textures.coin10) {
                            this.textures.coin10.colorSpace = THREE.SRGBColorSpace;
                            // Rotate texture 90° counter-clockwise
                            this.textures.coin10.center.set(0.5, 0.5);
                            this.textures.coin10.rotation = Math.PI / 2;
                            // Add sharpness
                            this.textures.coin10.minFilter = THREE.LinearMipMapLinearFilter;
                            this.textures.coin10.magFilter = THREE.LinearFilter;
                            this.textures.coin10.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                        }
                        material = [rimMat10, faceMat10, faceMat10];
                        break;
                    case 11:
                        // Coin 25 points
                        usesCoinGeometry = true;

                        // Sample edge color from texture (top center pixel)
                        let rimColor25 = 0xffaa00; // Default fallback
                        if (this.textures.coin25 && this.textures.coin25.image) {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = this.textures.coin25.image;
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            const pixelData = ctx.getImageData(img.width / 2, 0, 1, 1).data;
                            rimColor25 = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                            console.log('Coin25 rim color sampled:', '#' + rimColor25.toString(16));
                        }

                        const rimMat25 = new THREE.MeshStandardMaterial({
                            color: rimColor25,
                            roughness: 0.3,
                            metalness: 0.8
                        });
                        const faceMat25 = new THREE.MeshBasicMaterial({
                            map: this.textures.coin25
                        });
                        if (this.textures.coin25) {
                            this.textures.coin25.colorSpace = THREE.SRGBColorSpace;
                            // Rotate texture 90° counter-clockwise
                            this.textures.coin25.center.set(0.5, 0.5);
                            this.textures.coin25.rotation = Math.PI / 2;
                            // Add sharpness
                            this.textures.coin25.minFilter = THREE.LinearMipMapLinearFilter;
                            this.textures.coin25.magFilter = THREE.LinearFilter;
                            this.textures.coin25.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                        }
                        // Note: MeshBasicMaterial doesn't support bump maps
                        // Use the test coin page to experiment with bump maps
                        material = [rimMat25, faceMat25, faceMat25];
                        break;
                    default: material = plainMaterial;
                }

                if (usesCoinGeometry) {
                    // Create coin with material array [rim, topCap, bottomCap]
                    mesh = new THREE.Mesh(coinGeometry, material);
                    mesh.rotation.x = Math.PI / 2; // Lay it flat
                } else {
                    mesh = new THREE.Mesh(geometry, material);
                }

                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.scene.add(mesh);

                // Create proper tile object based on type
                let tile;
                const worldX = x * this.TILE_SIZE;
                const worldY = -this.TILE_SIZE / 2;
                const worldZ = z * this.TILE_SIZE;

                switch(tileType) {
                    case 1: // Plain tile
                        tile = new PlainTile3D(worldX, worldY, worldZ, mesh, tileType, true);
                        break;
                    case 2: // Switch tile - requires die face 1 to activate
                        tile = new SwitchTile3D(worldX, worldY, worldZ, mesh, tileType, true, 1, 1, this);
                        break;
                    case 3: // Falling tile
                        tile = new FallingTile3D(worldX, worldY, worldZ, mesh, tileType, true, this);
                        this.actors.push(tile);
                        break;
                    case 4: // Death tile
                        tile = new DeathTile3D(worldX, worldY, worldZ, mesh, tileType, false);
                        break;
                    case 5: // Spike tile - group 1 (controlled by switch 1)
                        tile = new SpikeTile3D(worldX, worldY + this.TILE_SIZE / 2, worldZ, mesh, tileType, false, 1);
                        this.actors.push(tile);
                        break;
                    case 6: // Warp tile - teleports to position [1, 1]
                        tile = new WarpTile3D(worldX, worldY, worldZ, mesh, tileType, true, [1, 1], this);
                        this.actors.push(tile); // Add to actors so particles update
                        break;
                    case 7: // Goal tile - requires die face 1 to complete
                        tile = new GoalTile3D(worldX, worldY, worldZ, mesh, tileType, true, 1, this);
                        break;
                    case 9: // Coin - 5 points
                        // Coin should be at tile height (y = tileSize/2 = 50)
                        tile = new Coin3D(worldX, this.TILE_SIZE / 2, worldZ, mesh, tileType, true, this, 5);
                        this.actors.push(tile);
                        // Also need a floor tile underneath
                        const floorMesh9 = new THREE.Mesh(geometry, plainMaterial);
                        floorMesh9.position.set(worldX, worldY, worldZ);
                        floorMesh9.castShadow = true;
                        floorMesh9.receiveShadow = true;
                        this.scene.add(floorMesh9);
                        break;
                    case 10: // Coin - 10 points
                        tile = new Coin3D(worldX, this.TILE_SIZE / 2, worldZ, mesh, tileType, true, this, 10);
                        this.actors.push(tile);
                        const floorMesh10 = new THREE.Mesh(geometry, plainMaterial);
                        floorMesh10.position.set(worldX, worldY, worldZ);
                        floorMesh10.castShadow = true;
                        floorMesh10.receiveShadow = true;
                        this.scene.add(floorMesh10);
                        break;
                    case 11: // Coin - 25 points
                        tile = new Coin3D(worldX, this.TILE_SIZE / 2, worldZ, mesh, tileType, true, this, 25);
                        this.actors.push(tile);
                        const floorMesh11 = new THREE.Mesh(geometry, plainMaterial);
                        floorMesh11.position.set(worldX, worldY, worldZ);
                        floorMesh11.castShadow = true;
                        floorMesh11.receiveShadow = true;
                        this.scene.add(floorMesh11);
                        break;
                    default:
                        tile = new PlainTile3D(worldX, worldY, worldZ, mesh, tileType, true);
                }

                this.board[z][x] = tile;
            }
        }

        // Create player at grid position (0, 0) with face 5 up
        this.player = new Player(this, this.scene, this.board, this.TILE_SIZE, 5, this.textures);
        this.player.setPosition(0, 0);
        this.actors.push(this.player);

        // Create timer
        this.timer = new Timer(this.TIME_LIMIT, this);
        this.actors.push(this.timer);

        console.log('Test level created with textured tiles, player, and timer');
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        if (this.isPaused) return;

        const deltaTime = this.clock.getDelta();
        const currentTime = this.clock.getElapsedTime();

        // Update all actors
        for (const actor of this.actors) {
            if (actor.update) {
                actor.update(deltaTime, currentTime);
            }
        }

        // Rotate camera if spinning (during level complete screen)
        if (this.cameraSpinning) {
            this.cameraNull.rotation.y += THREE.MathUtils.degToRad(this.cameraSpinSpeed);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    // Cheat code functions
    toggleCameraView() {
        console.log('Toggle camera view cheat activated!');
        this.cameraMode = this.cameraMode === 'iso' ? 'topdown' : 'iso';
        this.setCameraView();
    }

    resetTimer() {
        console.log('Reset timer cheat activated!');
        if (this.timer) {
            this.timer.resetTimer();
        }
    }

    timeOver() {
        // Timer ran out
        console.log('Time over!');
        if (this.player) {
            this.player.death();
        }
    }

    toggleWireframe() {
        console.log('Toggle wireframe cheat activated!');
        this.wireframeMode = !this.wireframeMode;
        this.scene.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                obj.material.wireframe = this.wireframeMode;
            }
        });
    }

    setCameraView() {
        if (this.cameraMode === 'iso') {
            // Isometric view (default) - slightly more overhead
            const distance = 1000;
            const heightMultiplier = 1.3;
            this.camera.position.set(distance, distance * heightMultiplier, distance);
            this.camera.lookAt(0, 0, 0);
        } else {
            // Top-down view
            this.camera.position.set(0, 1200, 0);
            this.camera.lookAt(0, 0, 0);
        }
    }

    retryLevel() {
        if (this.lives > 1) {
            console.log('Retrying level - killing player and resetting position');

            // Kill the player at current position (trigger death animation)
            if (this.player && !this.player.dead) {
                this.player.death();
            }

            // The player death will be handled by the normal death flow
            // which will decrement lives and call resetPlayer()
        }
    }

    endGame() {
        console.log('Ending game...');
        this.isRunning = false;

        // Stop the timer
        if (this.timer) {
            this.timer.pause();
        }

        // Calculate final score (includes total score + any collected coins, but NOT round score since level wasn't completed)
        const finalScore = this.score;
        console.log(`Game Over! Final Score: ${finalScore}`);

        // Show end game screen
        this.showEndGameScreen(finalScore);
    }

    showEndGameScreen(finalScore) {
        const endGameScreen = document.getElementById('end-game-screen');
        const finalScoreValue = document.getElementById('final-score-value');
        const finalLevelValue = document.getElementById('final-level-value');

        if (finalScoreValue) {
            finalScoreValue.textContent = finalScore;
        }

        if (finalLevelValue) {
            finalLevelValue.textContent = this.level;
        }

        if (endGameScreen) {
            endGameScreen.classList.remove('hidden');
        }
    }

    hideEndGameScreen() {
        const endGameScreen = document.getElementById('end-game-screen');
        if (endGameScreen) {
            endGameScreen.classList.add('hidden');
        }
    }

    sendScore(score) {
        // Placeholder for score submission
        console.log(`Sending score to server: ${score}`);
        alert(`Score submitted: ${score}\n(This is a placeholder - implement server integration here)`);
    }

    restartGame() {
        console.log('Restarting game...');

        // Hide end game screen
        this.hideEndGameScreen();

        // Reset game state
        this.score = 0;
        this.roundScore = 100;
        this.lives = 3;
        this.level = 0;
        this.isRunning = false;

        // Update UI
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
        document.getElementById('lives-display').textContent = `Lives: ${this.lives}`;
        document.getElementById('round-score-display').textContent = `Round Pts ${this.roundScore}`;

        // Clear current level
        this.clearLevel();

        // Show menu screen
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) {
            menuScreen.classList.remove('hidden');
        }
    }

    pause() {
        this.isPaused = true;
        console.log('Game paused');
    }

    resume() {
        this.isPaused = false;
        console.log('Game resumed');
    }

    handleResize() {
        // Game has fixed size, so no resize needed
        // But we keep this for potential future enhancements
    }

    // Game event handlers called by player/tiles
    dieOnGridLoc(z, x) {
        // Called when player moves to a tile
        // Reset all warp tiles so they can warp again
        this.resetAllWarpTiles();

        const tile = this.board[z][x];
        if (tile && tile.dieOnGridLoc) {
            tile.dieOnGridLoc(this.player);
        }
    }

    resetAllWarpTiles() {
        // Reset warp state on all warp tiles when player moves
        for (let z = 0; z < this.board.length; z++) {
            for (let x = 0; x < this.board[z].length; x++) {
                const tile = this.board[z][x];
                if (tile && tile.resetWarp) {
                    tile.resetWarp();
                }
            }
        }
    }

    playerOnWarp(warpDestination, sourceTile) {
        // Teleport player to destination
        // warpDestination is [x, z] in 1-indexed grid coordinates (from the original game)
        // Convert to 0-indexed for our array: subtract 1 from each
        // setPosition expects (gridZ, gridX) parameters in 0-indexed coordinates
        if (this.player && warpDestination) {
            // Play warp sound
            this.soundManager.play('warp');

            const [destX1, destZ1] = warpDestination; // 1-indexed from map data
            const destX = destX1 - 1; // Convert to 0-indexed
            const destZ = destZ1 - 1; // Convert to 0-indexed

            console.log(`Warping to [${destX1},${destZ1}] (1-indexed) = board[${destZ}][${destX}] (0-indexed)`);
            this.player.setPosition(destZ, destX); // Note: setPosition takes (z, x) not (x, z)

            // Mark the destination warp tile as already warped so it doesn't trigger again
            if (this.board[destZ] && this.board[destZ][destX]) {
                const destTile = this.board[destZ][destX];
                if (destTile && destTile.justWarped !== undefined) {
                    destTile.justWarped = true;
                }
            }
        }
    }

    playerOnSwitch(switchGroup, switchModel) {
        // Activate switch - retract spikes and lower floating blocks in the group
        console.log(`Switch group ${switchGroup} activated`);

        // Play trigger sound
        this.soundManager.play('trigger');

        // Find all tiles with matching switch group (spikes, floating blocks, etc.)
        for (let z = 0; z < this.board.length; z++) {
            for (let x = 0; x < this.board[z].length; x++) {
                const tile = this.board[z][x];
                if (tile && tile.getSwitchGroup && tile.getSwitchGroup() === switchGroup) {
                    // Retract spikes
                    if (tile.retract) {
                        tile.retract();
                    }
                    // Lower floating blocks
                    if (tile.lower) {
                        tile.lower();
                    }
                }
            }
        }
    }

    playerGetCoin(coinValue) {
        // Player collected a coin
        this.soundManager.play('coin');
        this.changeScoreBy(coinValue);
        console.log(`+${coinValue} points!`);
    }

    async reachedGoal() {
        // Level complete!
        console.log('Level complete!');

        // Play goal sound
        this.soundManager.play('goal');

        // Stop the timer
        if (this.timer) {
            this.timer.pause();
        }

        // Calculate time bonus (seconds remaining / 3)
        const timeRemaining = this.timer ? this.timer.getTimeRemaining() : 0;
        const secondsRemaining = Math.floor(timeRemaining / 1000);
        this.timeBonus = Math.floor(secondsRemaining / 3);

        // Add round score + time bonus to total score
        const levelScore = this.roundScore + this.timeBonus;
        this.changeScoreBy(levelScore);
        console.log(`Level complete! Round score: ${this.roundScore}, Time bonus: ${this.timeBonus}, Total added: ${levelScore}`);

        // Start camera spinning
        this.cameraSpinning = true;

        // Show level complete screen
        this.showLevelCompleteScreen(secondsRemaining);

        // Wait for keypress
        await this.waitForKeyPress();

        // Stop camera spinning
        this.cameraSpinning = false;

        // Hide level complete screen
        this.hideLevelCompleteScreen();

        // Check if all levels completed
        if (this.level >= this.maxLevels) {
            console.log('All levels completed! Game won!');
            alert(`Congratulations! You beat all ${this.maxLevels} levels!\nFinal Score: ${this.score}`);
            this.endGame();
            return;
        }

        // Load next level
        const nextLevelIndex = this.level; // this.level is 1-indexed, but we need the next index (0-indexed)
        console.log(`Loading next level: ${nextLevelIndex + 1}`);

        // Reset round score for next level
        this.roundScore = 100;
        document.getElementById('round-score-display').textContent = `Round Pts ${this.roundScore}`;

        // Load next level
        await this.loadLevel(nextLevelIndex);
    }

    showLevelCompleteScreen(secondsRemaining) {
        const screen = document.getElementById('level-complete-screen');
        const title = document.getElementById('level-complete-title');
        const roundScoreText = document.getElementById('round-score-text');
        const timeRemainingText = document.getElementById('time-remaining-text');
        const timeBonusText = document.getElementById('time-bonus-text');
        const yourScoreText = document.getElementById('your-score-text');

        title.textContent = `LEVEL ${this.level} CLEAR!!!`;
        roundScoreText.textContent = `ROUND SCORE: ${this.roundScore}`;
        timeRemainingText.textContent = `TIME REMAINING: ${secondsRemaining}`;
        timeBonusText.textContent = `TIME BONUS: ${this.timeBonus}`;
        yourScoreText.textContent = `YOUR SCORE: ${this.score}`;

        screen.classList.remove('hidden');
    }

    hideLevelCompleteScreen() {
        const screen = document.getElementById('level-complete-screen');
        screen.classList.add('hidden');
    }

    waitForKeyPress() {
        return new Promise((resolve) => {
            const handler = (e) => {
                document.removeEventListener('keydown', handler);
                resolve();
            };
            document.addEventListener('keydown', handler);
        });
    }

    changeScoreBy(points) {
        // Add or remove points from total score
        this.score += points;
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }

    deductRoundScore() {
        // Deduct 4 points per move
        this.roundScore -= 4;
        if (this.roundScore < 0) {
            this.roundScore = 0;
        }
        // Update UI
        document.getElementById('round-score-display').textContent =
            `Round Pts ${this.roundScore}`;
    }

    playerDeath() {
        // Handle player death
        console.log('Player death - restarting level');
        this.lives--;
        document.getElementById('lives-display').textContent = `Lives: ${this.lives}`;

        // Update retry button visibility
        this.updateRetryButtonVisibility();

        if (this.lives <= 0) {
            this.endGame();
        } else {
            // Reset player to starting position
            this.resetPlayer();
        }
    }

    updateRetryButtonVisibility() {
        // Hide retry button if player only has 1 life (retry would be game over)
        const retryButton = document.getElementById('retry-button');
        if (this.lives <= 1) {
            retryButton.classList.add('hidden');
        } else {
            retryButton.classList.remove('hidden');
        }
    }

    resetPlayer() {
        // Reset player to initial position and state
        if (!this.player) return;

        // Reset all tiles to their initial state
        for (let z = 0; z < this.board.length; z++) {
            for (let x = 0; x < this.board[z].length; x++) {
                const tile = this.board[z][x];
                if (tile && tile.reset) {
                    tile.reset();
                }
            }
        }

        // Reset player state flags
        this.player.dead = false;
        this.player.deathComplete = false;
        this.player.deathPhase = 0;
        this.player.rotating = false;
        this.player.direction = 'nothing';

        // Reset player model scale and position
        this.player.model.scale.set(1, 1, 1);

        // Reset player to starting position with starting face
        this.player.setInitialRotation(this.playerStartFace);
        this.player.setPosition(this.playerStartZ, this.playerStartX);
        this.player.face = this.playerStartFace;

        console.log(`Player reset to position [${this.playerStartZ}, ${this.playerStartX}] with face ${this.playerStartFace}`);
    }
}

