# Dice Escape HTML5 Userscript

This userscript replaces the Shockwave version of Dice Escape on Neopets with our HTML5 remake.

## Installation

### 1. Install a Userscript Manager

Choose one of these browser extensions:
- **Tampermonkey** (Recommended) - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) | [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/)
- **Violentmonkey** - [Chrome](https://chrome.google.com/webstore/detail/violentmonkey/) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
- **Greasemonkey** - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

### 2. Start Local Server

The userscript loads the game from a local server. You need to run one:

**Option A: Using VS Code Live Server** (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` and select "Open with Live Server"
3. Note the URL (usually `http://localhost:5500` or `http://127.0.0.1:5500`)

**Option B: Using Python**
```bash
# Python 3
cd "C:\Users\AJ\Desktop\neopets\shockwave\Dice Escape Claude"
python -m http.server 5500
```

**Option C: Using Node.js**
```bash
npx http-server -p 5500
```

### 3. Update Userscript URL

Edit `dice-escape-html5.user.js` line 46:
```javascript
const gameURL = 'http://localhost:5500/index.html';
```

Change to match your local server URL (check the port number!).

### 4. Install the Userscript

1. Click on your userscript manager icon in the browser
2. Select "Create a new script" or "Add a new script"
3. Delete the template code
4. Copy and paste the entire contents of `dice-escape-html5.user.js`
5. Save (Ctrl+S or File > Save)

## Usage

1. Make sure your local server is running
2. Visit: https://www.neopets.com/games/dgs/play_shockwave.phtml?game_id=356
3. The Shockwave embed should automatically be replaced with the HTML5 version
4. You should see a green banner saying "✨ HTML5 Version"

## Features

### Current Features
- Automatically detects and replaces Shockwave embed
- Extracts game parameters from URL (high score, game ID, etc.)
- Attempts to extract username from the page
- Communicates score back to the parent page
- Shows a notification banner

### Communication Flow

```
Neopets Page (userscript)
    ↓ (loads iframe)
    ↓
HTML5 Game (index.html)
    ↓ (sends GAME_LOADED message)
    ↓
Userscript
    ↓ (sends INIT_GAME with parameters)
    ↓
HTML5 Game
    ↓ (player plays and finishes)
    ↓ (sends SUBMIT_SCORE message)
    ↓
Userscript
    ↓ (handles score submission)
```

## Troubleshooting

### Game doesn't load
- Check that your local server is running
- Verify the URL in the userscript matches your server
- Check the browser console for errors (F12 > Console tab)
- Make sure the userscript is enabled in Tampermonkey

### CORS errors
- Some browsers block iframe content from localhost
- Try using `http://127.0.0.1:5500` instead of `http://localhost:5500`
- Or enable CORS in your browser for development

### Userscript doesn't activate
- Make sure you're on the correct URL (game_id=356)
- Check that Tampermonkey is enabled
- Verify the `@match` pattern in the userscript

## Next Steps

### To fully integrate with Neopets:
1. Implement DGS score encryption algorithm
2. Add session management (username, session hash)
3. POST encrypted score to Neopets' servers
4. Handle score verification responses

### To deploy publicly:
1. Host the game on GitHub Pages, Netlify, or similar
2. Update the `gameURL` in the userscript
3. Share the userscript on GreasyFork or similar

## Development

The userscript provides these parameters to the game:
- `gameId` - Game ID from URL (356 for Dice Escape)
- `hiscore` - Player's current high score
- `age` - Account age restriction
- `sp` - Special parameter
- `username` - Extracted from the page

Access these in the game via:
```javascript
if (game.neopetsUsername) {
    console.log('Username:', game.neopetsUsername);
    console.log('High Score:', game.neopetsHiscore);
}
```

## License

This is a fan remake for preservation and educational purposes.
