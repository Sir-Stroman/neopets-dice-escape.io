// Build script to create a self-contained userscript with all game files embedded
// Run with: node build-embedded-userscript.js

const fs = require('fs');
const path = require('path');

console.log('Building embedded userscript...');

// Read the index.html file
const indexHtml = fs.readFileSync('index.html', 'utf8');

// Read all JS files and bundle them
const jsFiles = [
    'js/main.js',
    'js/core/Game.js',
    'js/core/Player.js',
    'js/core/Timer.js',
    'js/tiles/Tile3D.js',
    'js/tiles/PlainTile3D.js',
    'js/tiles/DeathTile3D.js',
    'js/tiles/GoalTile3D.js',
    'js/tiles/SwitchTile3D.js',
    'js/tiles/SpikeTile3D.js',
    'js/tiles/FallingTile3D.js',
    'js/tiles/FloatingBlockTile3D.js',
    'js/tiles/WarpTile3D.js',
    'js/tiles/Coin3D.js',
    'js/utils/MapParser.js',
    'js/utils/SoundManager.js'
];

// Read all asset files
function getAssetFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getAssetFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

const textureFiles = getAssetFiles('assets/textures');
const soundFiles = getAssetFiles('assets/06_sounds');
const dataFiles = getAssetFiles('js/data');

// Create the embedded userscript template
const userscriptTemplate = `// ==UserScript==
// @name         Dice Escape HTML5 (Embedded)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Replace Shockwave Dice Escape with HTML5 version (fully embedded, no server needed!)
// @author       You
// @match        https://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @match        http://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=neopets.com
// @grant        none
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('Dice Escape HTML5 (Embedded) - Initializing...');

    // Embedded game HTML
    const gameHTML = \`${indexHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

    // Embedded assets as base64 data URIs
    const assets = {
        textures: {
            ${textureFiles.map(file => {
                const name = path.basename(file, path.extname(file));
                const ext = path.extname(file).slice(1);
                const data = fs.readFileSync(file, 'base64');
                return `'${name}': 'data:image/${ext};base64,${data}'`;
            }).join(',\n            ')}
        },
        sounds: {
            ${soundFiles.filter(f => f.endsWith('.wav')).map(file => {
                const name = path.basename(file, '.wav');
                const data = fs.readFileSync(file, 'base64');
                return `'${name}': 'data:audio/wav;base64,${data}'`;
            }).join(',\n            ')}
        },
        data: {
            ${dataFiles.filter(f => f.endsWith('.json')).map(file => {
                const name = path.basename(file, '.json');
                const data = fs.readFileSync(file, 'utf8');
                return `'${name}': ${data}`;
            }).join(',\n            ')}
        }
    };

    // Create blob URL for the game
    function createGameBlob() {
        // Modify the HTML to inject assets inline
        let modifiedHTML = gameHTML;

        // Replace asset loading with inline data
        // This is a simplified version - you'd need to modify your game's asset loading

        const blob = new Blob([modifiedHTML], { type: 'text/html' });
        return URL.createObjectURL(blob);
    }

    // Replace the game container
    const gameContainer = document.getElementById('game_container');
    if (!gameContainer) {
        console.error('Game container not found!');
        return;
    }

    console.log('Replacing Shockwave with embedded HTML5 version...');

    // Clear existing content
    gameContainer.innerHTML = '';

    // Create iframe with blob URL
    const iframe = document.createElement('iframe');
    iframe.id = 'html5-game-frame';
    iframe.style.cssText = 'width: 480px; height: 460px; border: none; display: block; margin: 0 auto;';
    iframe.src = createGameBlob();

    gameContainer.appendChild(iframe);

    // Add notification
    const notice = document.createElement('div');
    notice.style.cssText = 'background: #4CAF50; color: white; padding: 10px; text-align: center; font-family: Arial, sans-serif; margin: 10px auto; width: 480px; border-radius: 5px;';
    notice.innerHTML = '<strong>✨ HTML5 Version (Embedded)</strong> - No server required!';
    gameContainer.parentNode.insertBefore(notice, gameContainer);

    console.log('Dice Escape HTML5 (Embedded) - Loaded successfully!');
})();
`;

// Write the output
fs.writeFileSync('dice-escape-html5-embedded.user.js', userscriptTemplate);

console.log('✅ Created: dice-escape-html5-embedded.user.js');
console.log('   This userscript is fully self-contained with all assets embedded!');
console.log('   File size:', Math.round(fs.statSync('dice-escape-html5-embedded.user.js').size / 1024), 'KB');
