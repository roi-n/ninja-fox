// Keyboard and Touch Input Handler
class InputHandler {
    constructor() {
        this.keys = {};
        this.keyPressed = {}; // For single press detection
        this.mobileControls = null;

        // Mobile button states
        this.buttonJumpPressed = false;
        this.buttonAPressed = false;
        this.buttonBPressed = false;
        this.buttonPausePressed = false;
        this.buttonJumpWasPressed = false;
        this.buttonAWasPressed = false;
        this.buttonBWasPressed = false;
        this.buttonPauseWasPressed = false;

        // Cheat code tracking
        this.keySequence = '';
        this.lastKeyTime = 0;
        this.godModeActivated = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (!this.keyPressed[e.key.toLowerCase()]) {
                this.keyPressed[e.key.toLowerCase()] = true;
            }

            // Track key sequence for cheat codes
            const now = Date.now();
            if (now - this.lastKeyTime > 1000) {
                this.keySequence = ''; // Reset if too much time passed
            }
            this.keySequence += e.key.toLowerCase();
            this.lastKeyTime = now;

            // Keep only last 10 characters
            if (this.keySequence.length > 10) {
                this.keySequence = this.keySequence.slice(-10);
            }

            // Check for god mode cheat code: iddqd
            if (this.keySequence.includes('iddqd')) {
                this.godModeActivated = !this.godModeActivated;
                console.log(`🌈 GOD MODE ${this.godModeActivated ? 'ACTIVATED' : 'DEACTIVATED'}! 🌈`);
                this.keySequence = ''; // Reset sequence
            }

            // Visual feedback for keyboard presses on mobile controls
            this.updateVisualFeedback(e.key.toLowerCase(), true);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keyPressed[e.key.toLowerCase()] = false;

            // Remove visual feedback
            this.updateVisualFeedback(e.key.toLowerCase(), false);
        });

        // Listen for mobile button events
        window.addEventListener('mobileButtonJump', (e) => {
            if (e.detail.pressed && !this.buttonJumpPressed) {
                this.buttonJumpWasPressed = true;
            }
            this.buttonJumpPressed = e.detail.pressed;
        });

        window.addEventListener('mobileButtonA', (e) => {
            if (e.detail.pressed && !this.buttonAPressed) {
                this.buttonAWasPressed = true;
            }
            this.buttonAPressed = e.detail.pressed;
        });

        window.addEventListener('mobileButtonB', (e) => {
            if (e.detail.pressed && !this.buttonBPressed) {
                this.buttonBWasPressed = true;
            }
            this.buttonBPressed = e.detail.pressed;
        });

        window.addEventListener('mobileButtonPause', (e) => {
            if (e.detail.pressed && !this.buttonPausePressed) {
                this.buttonPauseWasPressed = true;
            }
            this.buttonPausePressed = e.detail.pressed;
        });
    }

    setMobileControls(mobileControls) {
        this.mobileControls = mobileControls;
    }

    isKeyDown(key) {
        // Check keyboard first
        if (this.keys[key.toLowerCase()]) {
            return true;
        }

        // Check mobile controls
        if (this.mobileControls && this.mobileControls.isVisible()) {
            const joystickInput = this.mobileControls.getJoystickInput();

            switch (key.toLowerCase()) {
                case 'a':
                    return joystickInput.left;
                case 'd':
                    return joystickInput.right;
            }
        }

        return false;
    }

    wasMobileKeyPressed() {
        return this.buttonJumpWasPressed || this.buttonAWasPressed || this.buttonBWasPressed;
    }

    isKeyPressed(key) {
        // Check keyboard first
        const pressed = this.keyPressed[key.toLowerCase()];
        if (pressed) {
            this.keyPressed[key.toLowerCase()] = false; // Reset after reading
            return true;
        }

        // Check mobile buttons
        if (this.mobileControls && this.mobileControls.isVisible()) {
            switch (key) {
                case 'w': // Jump
                    if (this.buttonJumpWasPressed) {
                        this.buttonJumpWasPressed = false;
                        return true;
                    }
                    break;
                case ',': // Kick
                    if (this.buttonAWasPressed) {
                        this.buttonAWasPressed = false;
                        return true;
                    }
                    break;
                case '.': // Shoot
                    if (this.buttonBWasPressed) {
                        this.buttonBWasPressed = false;
                        return true;
                    }
                    break;
                case ' ': // Pause (space key)
                    if (this.buttonPauseWasPressed) {
                        this.buttonPauseWasPressed = false;
                        return true;
                    }
                    break;
            }
        }

        return false;
    }

    updateVisualFeedback(key, pressed) {
        // Map keyboard keys to mobile buttons and add/remove pressed class
        const buttonMap = {
            'a': 'joystick-stick', // Left
            'd': 'joystick-stick', // Right
            'w': 'button-jump',
            ',': 'button-a',
            '.': 'button-b',
            ' ': 'button-pause'
        };

        const buttonId = buttonMap[key];
        if (buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                if (pressed) {
                    button.classList.add('pressed');
                    // For joystick, also move the stick
                    if (buttonId === 'joystick-stick') {
                        if (key === 'a') {
                            button.style.transform = 'translate(calc(-50% - 30px), -50%)';
                        } else if (key === 'd') {
                            button.style.transform = 'translate(calc(-50% + 30px), -50%)';
                        }
                    }
                } else {
                    button.classList.remove('pressed');
                    // Reset joystick position
                    if (buttonId === 'joystick-stick') {
                        button.style.transform = 'translate(-50%, -50%)';
                    }
                }
            }
        }
    }

    isGodModeActive() {
        return this.godModeActivated;
    }

    reset() {
        this.keyPressed = {};
        this.buttonJumpWasPressed = false;
        this.buttonAWasPressed = false;
        this.buttonBWasPressed = false;
        this.buttonPauseWasPressed = false;

        // Reset god mode cheat code
        this.godModeActivated = false;
        this.keySequence = '';
    }
}
