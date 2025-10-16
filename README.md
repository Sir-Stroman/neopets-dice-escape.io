# Project Plan: Dice Escape HTML5 Port

This document outlines the plan to port the classic Shockwave 3D game "Dice Escape" to a modern HTML5 version using JavaScript and the Three.js library. This port aims to preserve **100% of the original game's functionality** including the Neopets DGS BIOS integration system.

---

## Phase 0: DGS BIOS System Implementation

**CRITICAL:** The DGS BIOS (Director Game System - Basic Input/Output System) is Neopets' proprietary game loading, scoring, and tracking system. This must be ported first as it controls the entire game lifecycle.

### DGS BIOS Components to Port:

**1. Core BIOS Class (`dgsbios_class_bios.ls`):**
*   **Game Initialization System:**
    *   Parse external parameters (`sw1-sw9`) for game configuration
    *   Handle `game_filename`, `gameWidth`, `gameHeight`, `gameQuality`, `domain`
    *   Support `gameworld`, `myHiscore`, `gamePlays`, `verAcc`, `usercave`, `playsAllowed`
    *   Decrypt and validate DGS_ID
*   **Network Communication:**
    *   Game data loading from Neopets servers (`dgs_get_game_data.phtml`)
    *   Score submission with encryption (`confuseScore()` algorithm)
    *   Protocol sending for game events
    *   Game tag tracking (level reached, game started/finished)
*   **Asset Loading Pipeline:**
    *   Preloader management (Flash SWF → HTML5 equivalent)
    *   Multi-stage loading state machine (states 0-15, 666, 999)
    *   Progress tracking and percentage calculation
    *   Cast member loading and media ready checks
*   **Scoring System Integration:**
    *   Score meter initialization
    *   Score encryption using time-based algorithm
    *   Score submission with validation
    *   High score tracking
*   **Translation System:**
    *   Multi-language support (`lang` parameter)
    *   Preloader translation loading

**2. Frame Script (`dgsbios_framescript.ls`):**
*   Main control flow loop that calls `_DGSBIOS.controlFlow()`
*   Frame-based execution model → Convert to `requestAnimationFrame`

**3. Helper Functions (`dgsbios_functions.ls`):**
*   `GetUrl()` function for external navigation
*   JavaScript URL handling

**4. External Parameter System:**
*   `sw1`: Game variables (filename, dimensions, quality, domain, world, hiscore, plays, verification, usercave, plays allowed)
*   `sw4`: nsid (Neopets session ID)
*   `sw5`: nsm (Neopets session modifier)
*   `sw6`: gameVersion
*   `sw7`: game_id (default: 349)
*   `sw8`: nc_referer
*   `sw9`: DGS_ID (encrypted game identifier)

**5. HTML5 Adaptation Strategy:**
*   Replace Flash loader with HTML5 preloader
*   Convert Lingo network calls (`getNetText`, `preloadNetThing`) to `fetch()` API
*   Implement state machine with async/await patterns
*   Create mock/stub endpoints for local testing
*   Preserve all scoring encryption algorithms exactly as-is

---

## Phase 1: Project Setup & Foundation

1.  **Create Basic HTML Structure:**
    *   `index.html` as entry point (480x460 game viewport)
    *   Support for external parameters via URL query string
    *   Preloader overlay system
2.  **Integrate 3D Library:**
    *   Three.js for 3D rendering (replacing Shockwave 3D)
    *   OrbitControls for camera debugging (optional)
3.  **Establish File Structure:**
    ```
    /js
      /dgsbios      - DGS BIOS system
      /core         - Core game classes
      /tiles        - Tile classes
      /ui           - UI and menu systems
      /utils        - Helper functions
    /assets
      /textures     - PNG/BMP images
      /maps         - Level data (RTF files)
      /sounds       - Audio files
    ```
4.  **Asset Consolidation:**
    *   Organize all textures by type (die faces, tiles, UI)
    *   Extract level maps from RTF files
    *   Convert audio to web formats (MP3/OGG)

---

## Phase 2: Core Game Logic Porting

### Key Components to Port:

**1. Core Game Management (`GameClass.ls`):**
*   **Game State:**
    *   `pLevel`, `pMaxLevels` - Level progression
    *   `pScore`, `pRoundScore`, `pTimeBonus` - Scoring system
    *   `plives` - Life management (default: 3)
    *   `pBoard[z][x]` - 2D tile grid
*   **Map Management:**
    *   Load map data from `pMapList`
    *   Support for all tile types (1-9, "P")
    *   Random map flipping (`pFlipX`, `pFlipZ`)
*   **Game Loop:**
    *   Actor system for updating all game objects
    *   `pActors` array for timed updates
*   **Cheat Code System:**
    *   `topdown` - Toggle camera view
    *   `moretimeruki` - Reset timer (once)
    *   `helpmeplease` - Reset timer (once)
    *   `flybywire` - Toggle wireframe rendering
*   **Three.js World Setup:**
    *   Orthographic camera (isometric view)
    *   Dual directional lights
    *   Camera backdrop with level-specific backgrounds
    *   Particle systems (warp, lava, goal sparkles)
*   **Score Deduction:**
    *   -4 points per move
    *   Time bonus calculation (seconds left / 3)
*   **End Game Conditions:**
    *   No lives left
    *   All levels beaten
    *   User quit

**2. Player Class (`PlayerClass.ls`):**
*   **Die Rolling Mechanics:**
    *   Physical die rotation (90° increments)
    *   Face tracking based on rotation
    *   Ray casting to determine face-up side
*   **Movement System:**
    *   Arrow key input (123-126 keycodes)
    *   Tile walkability checking
    *   90° rotation animation around edge pivot
    *   Reference node for rotation calculation
*   **State Management:**
    *   `pRotating` - Animation state
    *   `pdead` - Death animation
    *   Death scale-down effect
*   **Sound Effects:**
    *   Movement sound per step
    *   Death sound

**3. Timer System (`TimerClass.ls`):**
*   60-second countdown per level (60000ms)
*   Real-time display updates
*   `timeOver()` callback to GameClass
*   Reset functionality for cheats

**4. Camera System:**
*   **Isometric View (Default):**
    *   Orthographic projection
    *   45° angle view
    *   Camera parent: `cameraNull` object
*   **Top-Down View (Cheat):**
    *   Perspective projection
    *   90° overhead view
*   **Spin Camera (`SpinCameraClass.ls`):**
    *   Victory spin animation
    *   Camera rotation around goal tile

**5. Game Loop (`game frame loop.ls`):**
*   Convert `exitFrame` loop to `requestAnimationFrame`
*   `callStepFrame()` - Update all actors
*   `onscoreboardclicked()` - UI interaction
*   `goNextRound()` - Level progression
*   Handle `ggameover` and `grounddone` states

---

## Phase 3: Tile & Game Object System

### Base Tile Class (`Tile3D.ls`):
*   Position (x, y, z)
*   Walkability flag
*   Tile type identifier
*   `dieOnGridLoc(player)` callback

### Tile Types:

**1. PlainTile3D (Type 1):**
*   Standard walkable floor
*   Can have variable height walls (Type 2)
*   Ground texture shader

**2. SpikeTile3D (Type 5):**
*   Retractable spike obstacles
*   Linked to switch groups
*   Animated extend/retract
*   Kills player on contact

**3. FallingTile3D (Type 7):**
*   Falls after player steps on it
*   Delay before falling
*   Animated descent
*   Becomes unwalkable

**4. SwitchTile3D (Type 4):**
*   Pressure plate trigger
*   Displays die face requirement
*   Linked to spike group (`s` property)
*   Retracts matching spikes

**5. GoalTile3D (Type 3):**
*   Level exit
*   Requires specific die face
*   Particle effect (stars)
*   Victory condition

**6. WarpTile3D (Type 8):**
*   Teleportation tile
*   Green particle effect
*   Links to target coordinates (`w` property)
*   Instant transport

**7. DeathTile3D (Type 6):**
*   Lava/instant death
*   Red-yellow particle effect
*   Kills player immediately

**8. Coin3DClass (Type 9):**
*   Collectible coins (5, 10, 25 points)
*   Weighted random values (60%=5, 30%=10, 10%=25)
*   Cylinder mesh with coin texture
*   Rotation animation
*   Sound effect on collect

---

## Phase 4: UI & Menu System

**1. MenuClass (`MenuClass.ls`):**
*   Main menu screen
*   Start game button
*   Instructions display

**2. ScoreboardClass (`ScoreboardClass.ls`):**
*   HUD overlay (sprite channel 2)
*   Score display
*   Lives display
*   Round score display
*   Retry button (if lives > 1)
*   End game button
*   Rendered on top of 3D world

**3. PromptClass (`PromptClass.ls`):**
*   Level complete overlay
*   Camera texture overlay
*   "Press any key" prompt
*   Transition to next level

**4. Event Handlers:**
*   Mouse up scripts → `addEventListener('click')`
*   Keyboard input → `addEventListener('keydown')`
*   Scoreboard button clicks

---

## Phase 5: Asset & Level Data Integration

**1. Map File Parsing:**
*   Parse RTF files from `assets/05_maps/`
*   Map format: 2D array with tile objects
*   Tile properties:
    *   `t` - Tile type (1-9, "P")
    *   `f` - Die face requirement (1-6)
    *   `s` - Switch group ID
    *   `w` - Warp destination [x, z]
    *   `h` - Wall height
*   Level order and progression

**2. Texture Loading:**
*   Load all die face textures (6 faces)
*   Tile textures (ground, trigger, falling, wood, death)
*   Coin textures (3 denominations)
*   UI textures (buttons, overlays, backgrounds)
*   Camera backdrops (3 variations based on level range)

**3. Audio System:**
*   Player move sound
*   Death sound
*   Goal sound
*   Button click sound
*   Background music (if present)

---

## Phase 6: Final Implementation & Polish

**1. Game Loop Integration:**
*   `requestAnimationFrame` main loop
*   Update all actors (player, timer, coins, spikes, falling tiles)
*   Render 3D world
*   Update UI overlays

**2. Input Handling:**
*   Arrow keys (123-126) for movement
*   Keyboard cheat code detection
*   Mouse clicks for UI buttons

**3. Game State Machine:**
*   `_BIOS` frame - DGS loading
*   `introframe` - Main menu
*   Game frame - Active gameplay
*   `gameoverframe` - End screen with score submission

**4. Score Submission:**
*   Encrypt score using `confuseScore()` algorithm
*   Send to DGS system via `_DGSBIOS.sendScore()`
*   Handle score sent flag
*   Return to menu or restart

**5. Original Functionality Preservation:**
*   All 9 tile types + player spawn
*   Exact physics and rotation mechanics
*   Original scoring system (-4 per move, time bonus)
*   Cheat codes
*   Lives system
*   Multiple camera modes
*   Particle effects
*   Sound effects
*   Multi-language support framework

**6. Testing & Debugging:**
*   Test all tile interactions
*   Verify scoring encryption
*   Test level progression
*   Validate DGS BIOS integration
*   Cross-browser compatibility
*   Performance optimization

---

## Current Progress

### ✅ Completed Features:
- [x] Three.js 3D rendering system with orthographic camera
- [x] All 9 tile types implemented and functional:
  - PlainTile3D (Type 1)
  - SwitchTile3D (Type 4) with die face requirements
  - FloatingBlockTile3D (Type 5) - switch-controlled blocks
  - DeathTile3D (Type 6) - red lava tiles with death animation
  - FallingTile3D (Type 7) - tiles that fall after stepping
  - WarpTile3D (Type 8) - teleportation tiles
  - Coin3D (Types 9, 10, 11) - 5, 10, 25 point coins
  - GoalTile3D (Type 3) - level completion with face requirements
- [x] Player die rolling physics with accurate face tracking
- [x] Die rotation animation around pivot edge
- [x] Movement system with WASD/arrow keys
- [x] Tile walkability and collision detection
- [x] Switch/spike group system (switches control floating blocks)
- [x] Death animation (sinking into tiles)
- [x] Player respawn at starting position after death
- [x] Lives system (3 lives, lose 1 per death)
- [x] Timer system (60 second countdown per level)
- [x] Scoring system:
  - Score display
  - Round score with -4 deduction per move
  - Coin collection points
- [x] Map file parsing from RTF format
- [x] Level loading system (24 levels)
- [x] Texture loading and application
- [x] All cheat codes functional:
  - `topdown` - Camera view toggle
  - `moretimeruki` / `helpmeplease` - Timer reset
  - `flybywire` - Wireframe mode
- [x] Basic UI overlay (score, lives, level, timer, round score)
- [x] UI buttons (Retry Level, End Game) - placeholders

### 🚧 In Progress / Remaining Work:

**Phase 0: DGS BIOS System** ⚠️ NOT STARTED
- [ ] DGS BIOS initialization and parameter parsing
- [ ] External parameter system (sw1-sw9)
- [ ] Network communication with Neopets servers
- [ ] Score encryption (`confuseScore()` algorithm)
- [ ] Score submission to DGS system
- [ ] Game tag tracking (level reached, started/finished)
- [ ] Multi-language translation system
- [ ] Preloader/loading screen integration with BIOS

**Phase 4: UI & Menu System** ⚠️ PARTIAL
- [ ] Splash screen / main menu
- [ ] Instructions screen
- [ ] Level complete screen with "Press any key" prompt
- [ ] Game over screen
- [ ] Victory screen (all levels complete)
- [ ] Functional "Retry Level" button (currently placeholder)
- [ ] Functional "End Game" button (currently placeholder)
- [ ] Camera spin animation on level complete

**Phase 5: Audio System** ⚠️ NOT STARTED
- [ ] Player movement sound
- [ ] Death sound
- [ ] Coin collection sound
- [ ] Goal/victory sound
- [ ] Button click sound
- [ ] Background music (if present)
- [ ] Warp sound
- [ ] Switch activation sound

**Phase 6: Level Progression & Win Conditions** ⚠️ PARTIAL
- [ ] Automatic level progression after goal reached
- [ ] Time bonus calculation and score addition
- [ ] Round score carry-over between levels
- [ ] Victory condition (all 24 levels complete)
- [ ] Game over condition properly handled
- [ ] Score submission after game end

**Phase 7: Visual Effects** ⚠️ NOT STARTED
- [ ] Particle effects:
  - Warp tile particles (green)
  - Death/lava tile particles (red-yellow)
  - Goal tile particles (stars/sparkles)
- [ ] Camera backdrop system (3 level-based backgrounds)

**Phase 8: Polish & Testing**
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Mobile/touch input support (if desired)
- [ ] Final DGS integration testing

---

## Success Criteria

✅ All tile types function identically to original
✅ Player die rolling physics match original
✅ All cheats functional
✅ Lives system correct
✅ Level progression from map files
✅ Timer system functional
⚠️ Game loads through DGS BIOS system - **NOT IMPLEMENTED**
⚠️ Scoring system with encryption - **PARTIAL** (display works, encryption missing)
⚠️ UI and menus replicated - **PARTIAL** (HUD works, menus missing)
⚠️ Score submission to DGS system - **NOT IMPLEMENTED**
⚠️ Multi-language framework support - **NOT IMPLEMENTED**
⚠️ Sound effects and particle effects - **NOT IMPLEMENTED**

---

## Technical Notes

- **Original Resolution:** 480x460 game area + 100px UI
- **Frame Rate:** 18 FPS (Flash fixed rate) → 60 FPS (requestAnimationFrame)
- **Tile Size:** 100 units
- **Camera:** Orthographic, orthoHeight 1000
- **Coordinate System:** Y-up (Three.js compatible)
- **Score Encryption:** Time-based algorithm, MUST be preserved exactly
- **DGS Game ID:** 349 (Dice Escape)
