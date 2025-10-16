// DGS BIOS Compatibility Layer
// Real implementation based on actual DGS BIOS source code

export class DGSBiosCompat {
    constructor() {
        this.initialized = false;

        // Game session data (from URL parameters)
        this.gameId = 356; // Dice Escape
        this.username = 'guest';
        this.hiscore = 0;
        this.gamePlays = 0;
        this.verAcc = 1;
        this.playsAllowed = 3;
        this.gameworld = 'Neopia Central';

        // Session hashes (normally from server)
        this.sessionHash = '';
        this.sessionKey = '';

        // Neopoints settings
        this.neopointRatio = 1;
        this.capOnNeopoints = 1000;
    }

    // Initialize DGS BIOS compatibility
    init() {
        if (this.initialized) return;

        console.log('Initializing DGS BIOS compatibility layer...');

        // Check if we're in an iframe (embedded in Neopets page)
        const isInIframe = window !== window.parent;

        if (isInIframe) {
            this.setupIframeCompat();
        } else {
            this.setupStandaloneCompat();
        }

        this.initialized = true;
    }

    setupIframeCompat() {
        // When embedded in Neopets page via userscript
        console.log('Setting up iframe compatibility mode');

        // Create dummy BiosLoader object that the game might look for
        window.BiosLoader = {
            bios: this.createDummyBios()
        };

        // Notify parent window that we're ready (bypass DGS BIOS)
        this.notifyParentReady();
    }

    setupStandaloneCompat() {
        // When running standalone (not embedded)
        console.log('Setting up standalone mode');

        window.BiosLoader = {
            bios: this.createDummyBios()
        };
    }

    // Port of DGS BIOS confuseScore algorithm from Lingo
    confuseScore(pS) {
        let theString = '';

        if (String(pS).length >= 5) {
            theString = '!' + String(pS) + '!';
        } else {
            const passedScore = parseInt(pS);

            // Get current time (equivalent to "the long time" in Lingo)
            const now = new Date();
            const hour = now.getHours();
            const mins = now.getMinutes();
            const secs = now.getSeconds();

            // Build timeString (HHMMSS format with leading zeros)
            let timeString = '';
            timeString += (hour < 10 ? '0' : '') + hour;
            timeString += (mins < 10 ? '0' : '') + mins;
            timeString += (secs < 10 ? '0' : '') + secs;

            // Increment each digit by 1 (wrap 9 to 0)
            let incTimeString = '';
            for (let i = 0; i < timeString.length; i++) {
                let n = parseInt(timeString[i]);
                if ((n + 1) >= 10) {
                    n = 0;
                } else {
                    n = n + 1;
                }
                incTimeString += n;
            }

            // Reverse the incremented time string
            let revTimeString = '';
            for (let i = incTimeString.length - 1; i >= 0; i--) {
                revTimeString += incTimeString[i];
            }

            // Calculate multiplied score value
            const mpScoreVal = (passedScore * (secs + 66)) + (passedScore * (hour + 48)) + (passedScore * (mins + 72));
            let mpScoreStr = String(mpScoreVal);

            // Pad to 5 digits
            const len = mpScoreStr.length;
            for (let i = 0; i < 5 - len; i++) {
                mpScoreStr = '0' + mpScoreStr;
            }

            // Reverse the score string
            let revScoreStr = '';
            for (let i = mpScoreStr.length - 1; i >= 0; i--) {
                revScoreStr += mpScoreStr[i];
            }

            // Construct part1: first 3 chars of revTimeString + revScoreStr + last 3 chars of revTimeString
            const part1 = revTimeString.substring(0, 3) + revScoreStr + revTimeString.substring(3, 6);

            // Construct part2: length of part1 as 2-digit string
            let part2;
            if (part1.length < 10) {
                part2 = '0' + String(part1.length);
            } else {
                part2 = String(part1.length);
            }

            // Final string: first char of part2 + part1 + second char of part2
            theString = part2[0] + part1 + part2[1];
        }

        // Pad to 16 characters with '9'
        const finalLen = theString.length;
        for (let i = 0; i < 16 - finalLen; i++) {
            theString += '9';
        }

        return theString;
    }

    createDummyBios() {
        // Create a BIOS object with real DGS protocol implementation
        return {
            // Game initialization
            initScoringMeter: (x, y, w, h) => {
                console.log('BIOS: initScoringMeter called', { x, y, w, h });
                return true;
            },

            // Reset game state
            reset: () => {
                console.log('BIOS: reset called');
                return true;
            },

            // Send game tag (analytics/tracking)
            sendGameTag: (tag) => {
                console.log('BIOS: sendGameTag called:', tag);
                return true;
            },

            // Level reached tracking
            reachedLevel: (level) => {
                console.log('BIOS: reachedLevel called:', level);
                return true;
            },

            // Score submission with real encryption
            sendScore: (score) => {
                console.log('BIOS: sendScore called:', score);

                // Encrypt score using real DGS algorithm
                const encryptedScore = this.confuseScore(score);
                console.log('BIOS: Encrypted score:', encryptedScore);
                console.log('BIOS: Session Hash:', this.sessionHash);
                console.log('BIOS: Session Key:', this.sessionKey);

                // If in iframe, notify parent with encrypted score and session data
                if (window !== window.parent) {
                    window.parent.postMessage({
                        type: 'SUBMIT_SCORE',
                        score: score,
                        encryptedScore: encryptedScore,
                        sessionHash: this.sessionHash || '',
                        sessionKey: this.sessionKey || ''
                    }, '*');
                }
                return true;
            },

            // Get dictionary object (for localization)
            getDictionaryObject: () => {
                console.log('BIOS: getDictionaryObject called');
                return {};
            },

            // Get user info object
            getUserInfoObject: () => {
                console.log('BIOS: getUserInfoObject called');
                return {
                    username: this.username,
                    hiscore: this.hiscore
                };
            },

            // Game world/level info
            gameworld: this.gameworld,
            myHiscore: this.hiscore,
            gamePlays: this.gamePlays,
            playsAllowed: this.playsAllowed,

            // Neopoints settings
            neopoints: this.neopointRatio,
            specialVar: 0
        };
    }

    notifyParentReady() {
        // Send a message to parent window that game is ready
        setTimeout(() => {
            window.parent.postMessage({
                type: 'GAME_LOADED'
            }, '*');
            console.log('Notified parent window that game is ready');
        }, 100);
    }

    // Receive parameters from parent window (userscript)
    listenForParams(callback) {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'INIT_GAME') {
                console.log('Received init params from parent:', event.data.params);

                const params = event.data.params;

                // Update session credentials
                if (params.sessionHash) {
                    this.sessionHash = params.sessionHash;
                    console.log('DGS BIOS: Session hash set');
                }

                if (params.sessionKey) {
                    this.sessionKey = params.sessionKey;
                    console.log('DGS BIOS: Session key set');
                }

                if (params.gameworld) {
                    this.gameworld = params.gameworld;
                }

                if (params.username) {
                    this.username = params.username;
                }

                if (params.hiscore) {
                    this.hiscore = params.hiscore;
                }

                // Update BIOS object with real data
                if (window.BiosLoader && window.BiosLoader.bios) {
                    const bios = window.BiosLoader.bios;

                    // Update getUserInfoObject with real data
                    bios.getUserInfoObject = () => ({
                        username: this.username,
                        hiscore: this.hiscore
                    });

                    bios.myHiscore = this.hiscore;
                    bios.gameworld = this.gameworld;

                    // Store session credentials in BIOS for sendScore
                    bios.sessionHash = this.sessionHash;
                    bios.sessionKey = this.sessionKey;
                }

                // Call the callback with params
                if (callback) {
                    callback(event.data.params);
                }
            }
        });
    }
}
