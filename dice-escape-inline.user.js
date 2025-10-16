// ==UserScript==
// @name         Dice Escape HTML5 (Inline)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Replace Shockwave Dice Escape with HTML5 version (self-contained, no external files!)
// @author       You
// @match        https://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @match        http://www.neopets.com/games/dgs/play_shockwave.phtml?*game_id=356*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=neopets.com
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js
// ==/UserScript==

/*
 * HOW TO USE THIS:
 *
 * This is a template for creating a fully self-contained userscript.
 * To complete it, you need to:
 *
 * 1. Build your game into a single bundled file using a tool like Vite, Webpack, or Rollup
 * 2. Copy the bundled HTML/JS/CSS here as template literals
 * 3. Embed assets as base64 data URIs
 *
 * For now, this version creates an iframe with the game injected inline.
 */

(function() {
    'use strict';

    console.log('Dice Escape HTML5 (Inline) - Initializing...');

    // Get game container
    const gameContainer = document.getElementById('game_container');
    if (!gameContainer) {
        console.error('Game container not found!');
        return;
    }

    // Clear existing content
    gameContainer.innerHTML = '';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'html5-game-frame';
    iframe.style.cssText = 'width: 480px; height: 460px; border: none; display: block; margin: 0 auto;';

    // Create the game HTML inline
    const gameHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dice Escape</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #cccccc;
            overflow: hidden;
        }

        #game-container {
            position: relative;
            width: 480px;
            height: 460px;
            margin: 0 auto;
            background: #cccccc;
        }

        canvas {
            display: block;
        }

        .hidden {
            display: none !important;
        }

        #loading-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        #loading-bar-container {
            width: 300px;
            height: 30px;
            border: 2px solid #fff;
            margin: 20px 0;
        }

        #loading-bar {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <div id="loading-screen">
            <h1>Loading Dice Escape...</h1>
            <div id="loading-bar-container">
                <div id="loading-bar"></div>
            </div>
            <div id="loading-text">0%</div>
        </div>

        <canvas id="game-canvas" width="480" height="460"></canvas>
    </div>

    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
        }
    }
    </script>

    <script type="module">
        import * as THREE from 'three';

        // PLACEHOLDER: Your game code would go here
        // This would include all your JavaScript modules bundled together

        console.log('Game initializing...');
        const canvas = document.getElementById('game-canvas');
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');

        // Simulate loading
        let progress = 0;
        const loadInterval = setInterval(() => {
            progress += 10;
            loadingBar.style.width = progress + '%';
            loadingText.textContent = progress + '%';

            if (progress >= 100) {
                clearInterval(loadInterval);
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    initGame();
                }, 500);
            }
        }, 100);

        function initGame() {
            // Create a simple Three.js scene as placeholder
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, 480/460, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas: canvas });
            renderer.setSize(480, 460);

            // Add a simple rotating cube
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            camera.position.z = 5;

            // Add text
            const textDiv = document.createElement('div');
            textDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px; text-align: center; pointer-events: none; z-index: 10;';
            textDiv.innerHTML = '<h2>Dice Escape HTML5</h2><p style="font-size: 14px;">Game code would be injected here</p><p style="font-size: 12px; margin-top: 10px;">See build instructions in userscript</p>';
            document.getElementById('game-container').appendChild(textDiv);

            function animate() {
                requestAnimationFrame(animate);
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
            animate();

            // Notify parent
            if (window !== window.parent) {
                window.parent.postMessage({
                    type: 'GAME_LOADED'
                }, '*');
            }
        }
    </script>
</body>
</html>
    `;

    // Write HTML to iframe using srcdoc
    iframe.srcdoc = gameHTML;

    // Append to container
    gameContainer.appendChild(iframe);

    // Add notification
    const notice = document.createElement('div');
    notice.style.cssText = 'background: #4CAF50; color: white; padding: 10px; text-align: center; font-family: Arial, sans-serif; margin: 10px auto; width: 480px; border-radius: 5px;';
    notice.innerHTML = '<strong>✨ HTML5 Version (Inline)</strong> - Self-contained userscript!<br><small>To complete: Add your bundled game code to the script</small>';
    gameContainer.parentNode.insertBefore(notice, gameContainer);

    // Message handling
    window.addEventListener('message', (event) => {
        if (event.data.type === 'GAME_LOADED') {
            console.log('Game loaded successfully');

            // Send game parameters
            iframe.contentWindow.postMessage({
                type: 'INIT_GAME',
                params: {
                    gameId: '356',
                    hiscore: parseInt(new URLSearchParams(window.location.search).get('hiscore')) || 0,
                    username: getUsername()
                }
            }, '*');
        }

        if (event.data.type === 'SUBMIT_SCORE') {
            console.log('Score submitted:', event.data.score);
            alert('Score: ' + event.data.score + '\\n\\n(Score submission would happen here)');
        }
    });

    function getUsername() {
        const userLink = document.querySelector('a[href*="/userlookup.phtml"]');
        if (userLink) {
            const match = userLink.href.match(/user=([^&]+)/);
            if (match) return match[1];
        }
        return 'guest';
    }

    console.log('Dice Escape HTML5 (Inline) - Loaded successfully!');
})();
