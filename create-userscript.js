// create-userscript.js
// Converts the Vite build output into a self-contained userscript

import fs from 'fs';
import path from 'path';

console.log('Creating embedded userscript from build...');

// Read the built HTML file
const distPath = './dist/index.html';

if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist/index.html not found. Run "npm run build" first!');
    process.exit(1);
}

const builtHTML = fs.readFileSync(distPath, 'utf8');

// Extract username from Neopets page helper
const getUsernameFunction = `
function getUsername() {
    const userLink = document.querySelector('a[href*="/userlookup.phtml"]');
    if (userLink) {
        const match = userLink.href.match(/user=([^&]+)/);
        if (match) return match[1];
    }
    return 'guest';
}`;

// Create the userscript
const userscript = `// ==UserScript==
// @name         Dice Escape HTML5 (Embedded Build)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Replace Shockwave Dice Escape with HTML5 version (fully embedded, auto-built)
// @author       You
// @match        https://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @match        http://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=neopets.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('Dice Escape HTML5 (Embedded Build) - Initializing...');

    // Extract game parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game_id');
    const hiscore = urlParams.get('hiscore') || '0';
    const age = urlParams.get('age') || '1';
    const sp = urlParams.get('sp') || '0';

    // DGS session data (will be fetched from server)
    let sessionHash = '';
    let sessionKey = '';
    let gameworld = 'Neopia Central';

    // Get the game container
    const gameContainer = document.getElementById('game_container');

    if (!gameContainer) {
        console.error('Game container not found!');
        return;
    }

    console.log('Replacing Shockwave with HTML5 version...');
    console.log('Game ID:', gameId);
    console.log('High Score:', hiscore);

    // Clear the existing Shockwave object
    gameContainer.innerHTML = '';

    // The entire built game (HTML + CSS + JS all inline)
    const gameHTML = \`${builtHTML}\`;

    // Create a Blob URL for the game (better than srcdoc - allows relative paths to work)
    const blob = new Blob([gameHTML], { type: 'text/html' });
    const blobURL = URL.createObjectURL(blob);

    // Create iframe with the game
    const iframe = document.createElement('iframe');
    iframe.id = 'html5-game-frame';
    iframe.style.cssText = 'width: 480px; height: 460px; border: none; display: block; margin: 0 auto;';
    iframe.src = blobURL;

    // Append iframe to container
    gameContainer.appendChild(iframe);

    // Add message handler to communicate with the game
    window.addEventListener('message', async function(event) {
        const data = event.data;

        if (data.type === 'GAME_LOADED') {
            console.log('HTML5 game loaded successfully');

            // Fetch DGS session data from Neopets server
            await fetchDGSSessionData();

            // Send game parameters to the iframe (including session data)
            iframe.contentWindow.postMessage({
                type: 'INIT_GAME',
                params: {
                    gameId: gameId,
                    hiscore: parseInt(hiscore),
                    age: parseInt(age),
                    sp: parseInt(sp),
                    username: getUsername(),
                    sessionHash: sessionHash,
                    sessionKey: sessionKey,
                    gameworld: gameworld
                }
            }, '*');
        }

        if (data.type === 'SUBMIT_SCORE') {
            console.log('Score submitted:', data.score);
            console.log('Encrypted score:', data.encryptedScore);
            console.log('Session hash:', data.sessionHash);
            console.log('Session key:', data.sessionKey);
            handleScoreSubmission(data.score, data.encryptedScore);
        }
    });

    ${getUsernameFunction}

    // Fetch DGS session data from Neopets server
    async function fetchDGSSessionData() {
        try {
            // Extract parameters from existing Shockwave embed on the page
            let randomId = '';
            let sw1Value = '';

            // Try both <object> params and <embed> attributes
            const objectParams = document.querySelectorAll('object param');
            const embedElement = document.querySelector('embed[type="application/x-director"]');

            // Extract sw9 (DGS_ID)
            const sw9Param = Array.from(objectParams).find(p => p.name === 'sw9');
            if (sw9Param) {
                randomId = sw9Param.value;
            } else if (embedElement) {
                randomId = embedElement.getAttribute('sw9');
            }

            // Extract sw1 (game variables including gameworld)
            const sw1Param = Array.from(objectParams).find(p => p.name === 'sw1');
            if (sw1Param) {
                sw1Value = sw1Param.value;
            } else if (embedElement) {
                sw1Value = embedElement.getAttribute('sw1');
            }

            // Parse sw1 to get gameworld
            // Format: "filename;width;height;quality;domain;gameworld;hiscore;gamePlays;verAcc;usercave;playsAllowed"
            if (sw1Value) {
                const parts = sw1Value.split(';');
                if (parts.length >= 6) {
                    gameworld = parts[5]; // gameworld is the 6th element
                    console.log('Extracted gameworld from sw1:', gameworld);
                }
            }

            // Fallback: Generate random ID if not found
            if (!randomId) {
                randomId = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');
                console.log('Generated new DGS_ID:', randomId);
            } else {
                console.log('Using existing DGS_ID from page:', randomId);
            }

            // Build request URL (same as Lingo code)
            const params = new URLSearchParams({
                rand: randomId,
                game_id: gameId,
                world: gameworld,
                ver: '1',
                n: Math.floor(Math.random() * 2).toString(),
                enc: '@1neo2004php4x2@',
                rate: '18'
            });

            const url = \`https://www.neopets.com/games/dgs/dgs_get_game_data.phtml?\${params}\`;
            console.log('Fetching DGS session data from:', url);

            const response = await fetch(url, {
                credentials: 'include' // Include cookies for authentication
            });

            if (!response.ok) {
                console.error('Failed to fetch DGS data:', response.status);
                return false;
            }

            const data = await response.text();
            console.log('DGS response:', data);

            // Parse the response (format: p=preloader&sh=hash&sk=key&username=user&...)
            const params2 = new URLSearchParams(data);

            // Get the interleaved sh/sk value
            const shskMixed = params2.get('sh') + params2.get('sk');

            // De-interleave sh and sk (alternating characters)
            let sh = '';
            let sk = '';
            for (let i = 0; i < shskMixed.length; i++) {
                if (i % 2 === 0) {
                    sh += shskMixed[i];
                } else {
                    sk += shskMixed[i];
                }
            }

            sessionHash = sh;
            sessionKey = sk;

            console.log('Session Hash:', sessionHash);
            console.log('Session Key:', sessionKey);

            return true;
        } catch (error) {
            console.error('Error fetching DGS session data:', error);
            return false;
        }
    }

    // Handle score submission with encrypted score
    function handleScoreSubmission(score, encryptedScore) {
        console.log('Submitting score to Neopets:', score);
        console.log('Encrypted score (DGS format):', encryptedScore);

        // TODO: Actually submit to Neopets server
        // This would require:
        // 1. Valid session hash and key from DGS server
        // 2. POST request to score submission endpoint
        // 3. Proper authentication

        alert('Score: ' + score + '\\nEncrypted: ' + encryptedScore + '\\n\\nScore submission would happen here.\\n(This requires backend integration with Neopets)');
    }

    // Add a notice to the page
    const notice = document.createElement('div');
    notice.style.cssText = 'background: #4CAF50; color: white; padding: 10px; text-align: center; font-family: Arial, sans-serif; margin: 10px auto; width: 480px; border-radius: 5px;';
    notice.innerHTML = '<strong>✨ HTML5 Version (Embedded Build)</strong> - Fully self-contained userscript!';
    gameContainer.parentNode.insertBefore(notice, gameContainer);

    console.log('Dice Escape HTML5 (Embedded Build) - Loaded successfully!');
})();
`;

// Write the userscript
const outputPath = './dice-escape-embedded.user.js';
fs.writeFileSync(outputPath, userscript);

const fileSize = fs.statSync(outputPath).size;
const fileSizeKB = Math.round(fileSize / 1024);
const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

console.log('✅ Successfully created embedded userscript!');
console.log('📄 Output: dice-escape-embedded.user.js');
console.log('📊 Size:', fileSizeKB > 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`);
console.log('');
console.log('To use:');
console.log('1. Install the userscript in Tampermonkey');
console.log('2. Visit https://www.neopets.com/games/dgs/play_shockwave.phtml?game_id=356');
console.log('3. The HTML5 version will automatically replace Shockwave!');
console.log('');
console.log('Note: Tampermonkey has a ~10MB limit for userscripts.');
console.log('If the file is too large, consider using GitHub Pages hosting instead.');
