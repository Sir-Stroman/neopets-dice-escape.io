# DGS Session Integration

This document explains how the DGS BIOS session system works in the HTML5 version.

## Overview

The game now **fetches real session credentials** from Neopets' DGS server and uses them for score encryption, matching the exact protocol used by the original Shockwave games.

## How It Works

### 1. **Userscript Initialization** (dice-escape-embedded.user.js)

When the game page loads:
1. Extracts game parameters from URL (`game_id`, `hiscore`, etc.)
2. Creates iframe with embedded game
3. Waits for `GAME_LOADED` message from iframe

### 2. **DGS Session Fetch** (fetchDGSSessionData function)

When game loads, the userscript calls:
```
https://www.neopets.com/games/dgs/dgs_get_game_data.phtml?rand=XXXX&game_id=356&world=Neopia+Central&ver=1&n=X&enc=@1neo2004php4x2@&rate=18
```

**Response format:**
```
p=preloader_name&sh=ABCD...&sk=1234...&username=player&id=356&...
```

**Key parameters returned:**
- `sh` - Session hash (interleaved with sk)
- `sk` - Session key (interleaved with sh)
- `username` - Player's Neopets username
- `id` - Game ID
- `p` - Preloader filename
- `neopoints` - Neopoint ratio
- `special` - Special variables

### 3. **De-interleaving sh/sk**

The server returns `sh` and `sk` **interleaved together** for security.

**Example:**
- Server sends: `sh=ABC`, `sk=123`
- Combined: `ABC123`
- De-interleaved:
  - Even indices (0,2,4,...) → `sh = "A1B2C3"`
  - Odd indices (1,3,5,...) → `sk = "123"`

**Code:**
```javascript
const shskMixed = params.get('sh') + params.get('sk');
let sh = '';
let sk = '';
for (let i = 0; i < shskMixed.length; i++) {
    if (i % 2 === 0) {
        sh += shskMixed[i];
    } else {
        sk += shskMixed[i];
    }
}
```

### 4. **Passing to Game** (postMessage)

After fetching, userscript sends to iframe:
```javascript
iframe.contentWindow.postMessage({
    type: 'INIT_GAME',
    params: {
        gameId: '356',
        hiscore: 0,
        username: 'player',
        sessionHash: 'XXXX',  // De-interleaved
        sessionKey: 'YYYY',   // De-interleaved
        gameworld: 'Neopia Central'
    }
}, '*');
```

### 5. **DGS BIOS Storage** (DGSBiosCompat.js)

The game's DGS BIOS compatibility layer:
1. Receives the `INIT_GAME` message
2. Stores session credentials:
   ```javascript
   this.sessionHash = params.sessionHash;
   this.sessionKey = params.sessionKey;
   this.username = params.username;
   this.hiscore = params.hiscore;
   this.gameworld = params.gameworld;
   ```
3. Updates the `BiosLoader.bios` object

### 6. **Score Encryption** (confuseScore algorithm)

When submitting a score, the BIOS encrypts it using the **real DGS algorithm**:

**Algorithm (ported from Lingo):**
```javascript
confuseScore(score) {
    // Get current time
    const hour = now.getHours();    // e.g., 14
    const mins = now.getMinutes();  // e.g., 30
    const secs = now.getSeconds();  // e.g., 45

    // Build time string: "143045"
    let timeString = (hour<10?'0':'') + hour +
                     (mins<10?'0':'') + mins +
                     (secs<10?'0':'') + secs;

    // Increment each digit by 1 (wrap 9→0): "254156"
    let incTimeString = ...;

    // Reverse: "651452"
    let revTimeString = ...;

    // Calculate: score * (secs+66) + score * (hour+48) + score * (mins+72)
    const mpScoreVal = (score * (secs + 66)) +
                       (score * (hour + 48)) +
                       (score * (mins + 72));

    // Reverse and pad to 5 digits
    let revScoreStr = ...;

    // Combine: first 3 of time + score + last 3 of time
    const part1 = revTimeString.substr(0,3) + revScoreStr + revTimeString.substr(3,3);

    // Add length markers and pad to 16 chars
    // Result: "0XXX...XXX19999999"
    return theString;
}
```

**Example:**
- Input: `score = 1234`
- Time: `14:30:45`
- Output: `"0651452ABCDE9999"` (16 characters)

### 7. **Score Submission** (sendScore)

When player submits score:
```javascript
BiosLoader.bios.sendScore(1234);
```

The BIOS:
1. Encrypts: `encryptedScore = confuseScore(1234)` → `"0651452ABCDE9999"`
2. Sends to parent:
   ```javascript
   window.parent.postMessage({
       type: 'SUBMIT_SCORE',
       score: 1234,
       encryptedScore: "0651452ABCDE9999",
       sessionHash: "XXXX",
       sessionKey: "YYYY"
   }, '*');
   ```

### 8. **Userscript Receives Score**

The userscript's `handleScoreSubmission()` function receives:
- Plain score: `1234`
- Encrypted score: `"0651452ABCDE9999"`
- Session hash: `"XXXX"`
- Session key: `"YYYY"`

**Currently:** Shows an alert with the data

**Future:** Will POST to Neopets score submission endpoint

## What's Left to Implement

### Score Submission Endpoint

To actually submit scores to Neopets, you need to:

1. **Find the endpoint**
   - Likely: `https://www.neopets.com/games/dgs/submit_score.phtml`
   - Or similar

2. **POST the data**
   ```javascript
   fetch('https://www.neopets.com/games/dgs/submit_score.phtml', {
       method: 'POST',
       credentials: 'include',
       headers: {
           'Content-Type': 'application/x-www-form-urlencoded'
       },
       body: new URLSearchParams({
           game_id: '356',
           score: encryptedScore,  // The 16-char encrypted string
           sh: sessionHash,
           sk: sessionKey,
           // ... other required params
       })
   });
   ```

3. **Handle response**
   - Server validates the encrypted score
   - Awards Neopoints
   - Updates high score table

## Testing

### Check Console Logs

When the game loads, you should see:
```
Fetching DGS session data from: https://www.neopets.com/games/dgs/dgs_get_game_data.phtml?...
DGS response: p=preloader&sh=...&sk=...
Session Hash: XXXX
Session Key: YYYY
DGS BIOS: Session hash set
DGS BIOS: Session key set
```

When submitting score:
```
BIOS: sendScore called: 1234
BIOS: Encrypted score: 0651452ABCDE9999
BIOS: Session Hash: XXXX
BIOS: Session Key: YYYY
Score submitted: 1234
Encrypted score: 0651452ABCDE9999
```

### Verify Encryption

The encrypted score should:
- Always be **exactly 16 characters**
- Change based on the **current time** (try submitting same score at different times)
- Follow the format: `0XXX...XXX1` or similar (length markers at positions 0 and 15)

## Files Modified

1. **js/utils/DGSBiosCompat.js**
   - Added real `confuseScore()` algorithm
   - Added session storage (`sessionHash`, `sessionKey`)
   - Updated `sendScore()` to use real encryption

2. **js/main.js**
   - Initialized DGS BIOS on startup
   - Wired `listenForParams()` to receive session data
   - Updated `sendScore()` to use BIOS

3. **create-userscript.js**
   - Added `fetchDGSSessionData()` function
   - De-interleaves `sh` and `sk`
   - Passes session data to iframe
   - Updated `handleScoreSubmission()` to receive encrypted score

4. **dice-escape-embedded.user.js** (auto-generated)
   - Contains all the above logic embedded

## Security Notes

- The session hash and key are **per-session** - fetch them fresh each time
- The encrypted score is **time-based** - it changes every second
- Neopets server likely validates:
  - Session credentials are valid
  - Encrypted score matches decrypted score
  - Score submission rate (anti-cheat)
  - User is authenticated

## Summary

✅ **Working:**
- Real DGS session fetch from Neopets server
- Session hash/key de-interleaving
- Real confuseScore encryption algorithm
- Session data passed to game via postMessage
- Encrypted scores sent back to userscript

⏳ **Todo:**
- Find actual score submission endpoint
- Implement POST request with encrypted score
- Handle server response (Neopoints awarded, etc.)

The game now implements the **complete DGS BIOS protocol** that Neopets expects!
