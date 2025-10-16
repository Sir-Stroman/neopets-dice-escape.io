import * as THREE from 'three';
import { Game } from './core/Game.js';
import { MapParser } from './utils/MapParser.js';
import { DGSBiosCompat } from './utils/DGSBiosCompat.js';

// Global game instance
let game = null;

// Initialize DGS BIOS compatibility layer
const dgsBios = new DGSBiosCompat();
dgsBios.init();

// Initialize the game
async function init() {
    try {
        const canvas = document.getElementById('game-canvas');
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');

        // Update loading progress
        function updateLoadingProgress(percent) {
            loadingBar.style.width = percent + '%';
            loadingText.textContent = Math.floor(percent) + '%';
        }

        updateLoadingProgress(10);

        // Create game instance
        game = new Game(canvas);

        updateLoadingProgress(20);

        // Initialize game systems
        await game.init();

        updateLoadingProgress(30);

        // Load assets (textures)
        await game.loadAssets((progress) => {
            updateLoadingProgress(30 + (progress * 30));
        });

        updateLoadingProgress(60);

        // Load level cache from JSON (instant!)
        await MapParser.loadLevelCache((progress) => {
            updateLoadingProgress(60 + (progress * 30));
        });

        updateLoadingProgress(90);

        // Load sounds
        await game.soundManager.loadSounds();

        updateLoadingProgress(100);

        // Hide loading screen and show menu
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            showMenuScreen();
        }, 500);

    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.getElementById('loading-text').textContent = 'Error loading game!';
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.handleResize();
    }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            game.pause();
        } else {
            game.resume();
        }
    }
});

// Menu system
function showMenuScreen() {
    const menuScreen = document.getElementById('menu-screen');
    const instructionsScreen = document.getElementById('instructions-screen');

    menuScreen.classList.remove('hidden');
    instructionsScreen.classList.add('hidden');
}

function showInstructionsScreen() {
    const menuScreen = document.getElementById('menu-screen');
    const instructionsScreen = document.getElementById('instructions-screen');

    menuScreen.classList.add('hidden');
    instructionsScreen.classList.remove('hidden');
}

function hideAllMenus() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('instructions-screen').classList.add('hidden');
}

// Button event handlers
document.getElementById('start-game-button').addEventListener('click', () => {
    game.soundManager.play('button');
    hideAllMenus();
    game.start();
});

document.getElementById('instructions-button').addEventListener('click', () => {
    game.soundManager.play('button');
    showInstructionsScreen();
});

document.getElementById('back-button').addEventListener('click', () => {
    game.soundManager.play('button');
    showMenuScreen();
});

// End game button handlers
document.getElementById('send-score-button').addEventListener('click', (e) => {
    if (game) {
        game.soundManager.play('button');
        const finalScore = game.score;
        game.sendScore(finalScore);
    }
});

document.getElementById('restart-button').addEventListener('click', (e) => {
    if (game) {
        game.soundManager.play('button');
        game.restartGame();
    }
});

// Retry and End Game buttons
document.getElementById('retry-button').addEventListener('click', () => {
    if (game) {
        game.soundManager.play('button');
    }
});

document.getElementById('end-game-button').addEventListener('click', () => {
    if (game) {
        game.soundManager.play('button');
    }
});

// Userscript integration - communicate with parent window if embedded
const isInIframe = window !== window.parent;

if (isInIframe) {
    console.log('Running inside userscript iframe');

    // Notify parent that game is loaded
    window.addEventListener('load', () => {
        window.parent.postMessage({
            type: 'GAME_LOADED'
        }, '*');
    });

    // Listen for init parameters from userscript
    dgsBios.listenForParams((params) => {
        console.log('DGS BIOS received parameters:', params);

        // Store parameters in game instance
        if (game) {
            game.neopetsUsername = params.username || 'guest';
            game.neopetsHiscore = params.hiscore || 0;
            game.neopetsGameId = params.gameId || '356';

            console.log(`Initialized with username: ${game.neopetsUsername}, high score: ${game.neopetsHiscore}`);
        }
    });
}

// Start the game
init().then(() => {
    // After game loads, override sendScore to use DGS BIOS
    if (game) {
        const originalSendScore = game.sendScore.bind(game);
        game.sendScore = function(score) {
            console.log('Sending score via DGS BIOS:', score);

            // Use DGS BIOS sendScore (which handles encryption)
            if (window.BiosLoader && window.BiosLoader.bios) {
                window.BiosLoader.bios.sendScore(score);
            }

            // Still call original for local logging
            originalSendScore(score);
        };
    }
});
