# Building the Embedded Userscript

This guide explains how to build a fully self-contained userscript with all game files embedded.

## Prerequisites

You need Node.js installed. Check by running:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

## Step 1: Install Dependencies

```bash
cd "C:\Users\AJ\Desktop\neopets\shockwave\Dice Escape Claude"
npm install
```

This installs:
- `vite` - Build tool
- `vite-plugin-singlefile` - Bundles everything into one HTML file
- `three` - 3D library

## Step 2: Build the Embedded Userscript

Run the build command:

```bash
npm run build:userscript
```

This does two things:
1. Runs `vite build` - Bundles your game into `dist/index.html` (single file with all assets inline)
2. Runs `create-userscript.js` - Wraps that HTML into a userscript

**Output:** `dice-escape-embedded.user.js`

## Step 3: Install in Tampermonkey

1. Open Tampermonkey in your browser
2. Click "Create a new script"
3. Delete the template
4. Open `dice-escape-embedded.user.js` in a text editor
5. Copy the entire contents
6. Paste into Tampermonkey
7. Save (Ctrl+S)

## Step 4: Test

1. Visit: https://www.neopets.com/games/dgs/play_shockwave.phtml?game_id=356
2. The Shockwave embed should be replaced with your HTML5 version
3. No server needed - everything is embedded!

## How It Works

### Vite Build Process

1. **Entry Point:** `index.html`
2. **Bundling:** Vite processes all `<script type="module">` imports
3. **Asset Inlining:** All images, sounds, and JSON files are converted to base64 data URIs
4. **Single File Output:** Everything is combined into one `dist/index.html`

### Userscript Wrapper

1. **Reads** the built HTML file
2. **Escapes** template literals (backticks and dollar signs)
3. **Embeds** the entire HTML as a string in the userscript
4. **Creates** an iframe with `srcdoc` attribute
5. **Handles** communication between Neopets page and game

## File Sizes

Typical sizes after building:

- `dist/index.html`: 3-8 MB (all game code + assets inline)
- `dice-escape-embedded.user.js`: 3-8 MB (HTML + userscript wrapper)

**Note:** Tampermonkey has a ~10MB limit for userscripts. If your build exceeds this:

### Option A: Optimize Assets
- Use smaller textures (resize images)
- Compress sounds (use MP3 instead of WAV)
- Remove unused assets

### Option B: External Hosting
- Host on GitHub Pages instead
- Use the original `dice-escape-html5.user.js` (loads from URL)

## Development vs Production

### Development (Local Server)
```bash
npm run dev
# Game runs at http://localhost:5173
# Use dice-escape-html5.user.js (not embedded)
```

### Production (Embedded)
```bash
npm run build:userscript
# Creates dice-escape-embedded.user.js
# No server needed!
```

## Troubleshooting

### Build fails
```bash
# Clean and reinstall
rm -rf node_modules dist
npm install
npm run build:userscript
```

### Userscript too large
Check the file size:
```bash
# Windows
dir dice-escape-embedded.user.js
# The file size is shown in bytes
```

If over 10MB, you'll need to optimize or use external hosting.

### Assets not loading
The Vite plugin should inline everything automatically. If assets aren't loading:
1. Check `vite.config.js` - `assetsInlineLimit` should be high
2. Make sure asset paths in code use relative paths (`./assets/...`)
3. Check the browser console for errors

## Advanced: Custom Build

You can modify the build process:

### Change inline threshold
Edit `vite.config.js`:
```javascript
assetsInlineLimit: 100000000, // 100MB - inline everything
```

### Exclude certain assets
To load some assets from CDN instead of inlining:
```javascript
// In your code, use absolute URLs for external assets
const texture = textureLoader.load('https://example.com/texture.png');
```

### Minify further
Vite already minifies in production mode. For extra compression:
```bash
npm install terser --save-dev
```

Then compress the userscript:
```bash
npx terser dice-escape-embedded.user.js -o dice-escape-embedded.min.user.js
```

## Next Steps

Once you have the embedded userscript working:

1. **Share it** on GreasyFork or GitHub
2. **Add DGS encryption** for real score submission
3. **Implement session management** for plays tracking
4. **Add auto-update** URLs in the userscript header

## GitHub Pages Alternative

If the embedded version is too large, host on GitHub Pages:

1. Build the game: `npm run build`
2. Push `dist/` folder to GitHub Pages
3. Use `dice-escape-html5.user.js` with your GitHub Pages URL
4. Much smaller userscript (~5KB) that loads from your hosted game

Example:
```javascript
const gameURL = 'https://yourusername.github.io/dice-escape/';
```
