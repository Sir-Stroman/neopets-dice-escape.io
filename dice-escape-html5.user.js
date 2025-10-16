// ==UserScript==
// @name         Dice Escape HTML5
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Replace Shockwave Dice Escape with HTML5 version
// @author       You
// @match        https://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @match        http://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=neopets.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('Dice Escape HTML5 - Initializing...');

    // Extract game parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game_id');
    const hiscore = urlParams.get('hiscore') || '0';
    const age = urlParams.get('age') || '1';
    const sp = urlParams.get('sp') || '0';

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

    // Create iframe to load our HTML5 game
    const iframe = document.createElement('iframe');
    iframe.id = 'html5-game-frame';
    iframe.style.width = '480px';
    iframe.style.height = '460px';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';

    // You can either:
    // 1. Host the game on a local server (e.g., http://localhost:3000)
    // 2. Host the game on GitHub Pages or similar
    // 3. Inject the entire game inline (more complex)

    // Option 1: Local server (recommended for development)
    const gameURL = 'http://localhost:5500/index.html'; // Update this to your local server URL

    // Option 2: GitHub Pages or online hosting
    // const gameURL = 'https://yourusername.github.io/dice-escape/index.html';

    iframe.src = gameURL;

    // Append iframe to container
    gameContainer.appendChild(iframe);

    // Add message handler to communicate with the game
    window.addEventListener('message', function(event) {
        // Verify origin if needed
        // if (event.origin !== 'http://localhost:5500') return;

        const data = event.data;

        if (data.type === 'GAME_LOADED') {
            console.log('HTML5 game loaded successfully');

            // Send game parameters to the iframe
            iframe.contentWindow.postMessage({
                type: 'INIT_GAME',
                params: {
                    gameId: gameId,
                    hiscore: parseInt(hiscore),
                    age: parseInt(age),
                    sp: parseInt(sp),
                    username: getUsername() // Extract from page
                }
            }, '*');
        }

        if (data.type === 'SUBMIT_SCORE') {
            console.log('Score submitted:', data.score);
            // Handle score submission to Neopets here
            handleScoreSubmission(data.score);
        }
    });

    // Helper function to extract username from the page
    function getUsername() {
        // Try to find username in the page
        // Neopets usually has it in various places
        const userLink = document.querySelector('a[href*="/userlookup.phtml"]');
        if (userLink) {
            const match = userLink.href.match(/user=([^&]+)/);
            if (match) {
                return match[1];
            }
        }
        return 'guest';
    }

    // Handle score submission
    function handleScoreSubmission(score) {
        console.log('Submitting score to Neopets:', score);

        // This would need to interact with Neopets' actual score submission system
        // For now, just log it
        alert('Score: ' + score + '\n\nScore submission would happen here.\n(This requires backend integration with Neopets)');

        // In a real implementation, you would:
        // 1. Encrypt the score using the DGS algorithm
        // 2. POST to Neopets' score submission endpoint
        // 3. Handle the response
    }

    // Add a notice to the page
    const notice = document.createElement('div');
    notice.style.cssText = 'background: #4CAF50; color: white; padding: 10px; text-align: center; font-family: Arial, sans-serif; margin: 10px auto; width: 480px; border-radius: 5px;';
    notice.innerHTML = '<strong>✨ HTML5 Version</strong> - Shockwave has been replaced with an HTML5 remake!';
    gameContainer.parentNode.insertBefore(notice, gameContainer);

    console.log('Dice Escape HTML5 - Loaded successfully!');
})();
