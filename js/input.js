// Keyboard Input Handler
class InputHandler {
    constructor() {
        this.keys = {};
        this.keyPressed = {}; // For single press detection

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
    }

    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    isKeyPressed(key) {
        const pressed = this.keyPressed[key.toLowerCase()];
        if (pressed) {
            this.keyPressed[key.toLowerCase()] = false; // Reset after reading
            return true;
        }
        return false;
    }

    reset() {
        this.keyPressed = {};
    }
}
