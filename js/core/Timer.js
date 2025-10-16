// Timer class for countdown timer
export class Timer {
    constructor(timeLimit, game) {
        this.timeLimit = timeLimit; // Time limit in milliseconds
        this.game = game;
        this.startTime = Date.now();
        this.paused = false;
        this.pausedTime = 0;
        this.deleteMe = false;
        this.timeOverCalled = false; // Flag to ensure timeOver is only called once
    }

    getNumSecondsLeft() {
        if (this.paused) {
            return Math.max(0, Math.floor((this.timeLimit - this.pausedTime) / 1000));
        }

        const elapsed = Date.now() - this.startTime;
        const remaining = this.timeLimit - elapsed;
        return Math.max(0, Math.floor(remaining / 1000));
    }

    getTimeRemaining() {
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.timeLimit - elapsed);
    }

    resetTimer() {
        // Reset timer back to full time (for cheats)
        this.startTime = Date.now();
        console.log('Timer reset!');
    }

    pause() {
        if (!this.paused) {
            this.paused = true;
            this.pausedTime = Date.now() - this.startTime;
        }
    }

    resume() {
        if (this.paused) {
            this.paused = false;
            this.startTime = Date.now() - this.pausedTime;
        }
    }

    update(deltaTime, currentTime) {
        if (this.paused) return;

        const secondsLeft = this.getNumSecondsLeft();

        // Update UI
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = `Time: ${secondsLeft}`;

            // Change color when time is running out
            if (secondsLeft <= 10) {
                timerDisplay.style.color = '#ff0000';
            } else if (secondsLeft <= 20) {
                timerDisplay.style.color = '#ff8800';
            } else {
                timerDisplay.style.color = '#ffffff';
            }
        }

        // Check if time is up (only call once)
        if (secondsLeft <= 0 && !this.timeOverCalled) {
            this.timeOver();
        }
    }

    timeOver() {
        // Time's up!
        console.log('Time over!');
        this.timeOverCalled = true;
        this.game.timeOver();
        this.remove();
    }

    remove() {
        // Stop the timer
        this.deleteMe = true;
    }

    stopStepFrame() {
        this.deleteMe = true;
    }
}
