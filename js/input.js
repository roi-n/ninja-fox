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
        this.buttonJumpWasPressed = false;
        this.buttonAWasPressed = false;
        this.buttonBWasPressed = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (!this.keyPressed[e.key.toLowerCase()]) {
                this.keyPressed[e.key.toLowerCase()] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keyPressed[e.key.toLowerCase()] = false;
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
                case '/': // Shoot
                    if (this.buttonBWasPressed) {
                        this.buttonBWasPressed = false;
                        return true;
                    }
                    break;
            }
        }

        return false;
    }

    reset() {
        this.keyPressed = {};
        this.buttonJumpWasPressed = false;
        this.buttonAWasPressed = false;
        this.buttonBWasPressed = false;
    }
}
