// Sound Manager for game audio
export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    async loadSounds() {
        const soundFiles = [
            { key: 'button', path: '/assets/06_sounds/sounds_1_buttonSound.wav' },
            { key: 'playerMove', path: '/assets/06_sounds/sounds_2_playerMoveSound.wav' },
            { key: 'death', path: '/assets/06_sounds/sounds_3_deathSound.wav' },
            { key: 'coin', path: '/assets/06_sounds/sounds_4_coinSound.wav' },
            { key: 'goal', path: '/assets/06_sounds/sounds_5_goalSound.wav' },
            { key: 'warp', path: '/assets/06_sounds/sounds_6_warpSound.wav' },
            { key: 'trigger', path: '/assets/06_sounds/sounds_7_triggerSound.wav' }
        ];

        for (const soundFile of soundFiles) {
            try {
                const audio = new Audio(soundFile.path);
                audio.preload = 'auto';
                this.sounds[soundFile.key] = audio;
            } catch (error) {
                console.error(`Failed to load sound ${soundFile.key}:`, error);
            }
        }

        console.log('Sounds loaded');
    }

    play(soundKey, volume = 1.0) {
        if (!this.enabled) return;

        const sound = this.sounds[soundKey];
        if (sound) {
            // Clone the audio so we can play multiple instances simultaneously
            const soundClone = sound.cloneNode();
            soundClone.volume = volume;
            soundClone.play().catch(err => {
                console.warn(`Failed to play sound ${soundKey}:`, err);
            });
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
