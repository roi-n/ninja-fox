// Mobile Controls for Touch Devices
class MobileControls {
    constructor() {
        this.isMobile = this.detectMobile();
        this.joystick = null;
        this.buttonJump = null;
        this.buttonA = null;
        this.buttonB = null;
        this.joystickActive = false;
        this.joystickAngle = 0;
        this.joystickDistance = 0;

        if (this.isMobile) {
            this.createControls();
        }
    }

    detectMobile() {
        // Check if device is mobile/tablet
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    createControls() {
        // Add mobile class to body for CSS targeting
        document.body.classList.add('mobile-controls');

        // Create joystick container
        this.joystick = {
            container: document.createElement('div'),
            stick: document.createElement('div'),
            touchId: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };

        this.joystick.container.id = 'joystick-container';
        this.joystick.stick.id = 'joystick-stick';
        this.joystick.container.appendChild(this.joystick.stick);
        document.body.appendChild(this.joystick.container);

        // Create Jump button (centered above A and B)
        this.buttonJump = document.createElement('div');
        this.buttonJump.id = 'button-jump';
        this.buttonJump.innerHTML = '<span>JUMP</span>';
        document.body.appendChild(this.buttonJump);

        // Create A button (Kick)
        this.buttonA = document.createElement('div');
        this.buttonA.id = 'button-a';
        this.buttonA.innerHTML = '<span>A</span><span class="label">KICK</span>';
        document.body.appendChild(this.buttonA);

        // Create B button (Shoot)
        this.buttonB = document.createElement('div');
        this.buttonB.id = 'button-b';
        this.buttonB.innerHTML = '<span>B</span><span class="label">SHOOT</span>';
        document.body.appendChild(this.buttonB);

        // Set up touch event listeners
        this.setupJoystickEvents();
        this.setupButtonEvents();
    }

    setupJoystickEvents() {
        const container = this.joystick.container;
        const stick = this.joystick.stick;
        const maxDistance = 40; // Max distance from center

        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.joystick.touchId = touch.identifier;

            const rect = container.getBoundingClientRect();
            this.joystick.startX = rect.left + rect.width / 2;
            this.joystick.startY = rect.top + rect.height / 2;

            this.joystickActive = true;
            this.updateJoystick(touch.clientX, touch.clientY, maxDistance);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!this.joystickActive) return;

            for (let touch of e.touches) {
                if (touch.identifier === this.joystick.touchId) {
                    e.preventDefault();
                    this.updateJoystick(touch.clientX, touch.clientY, maxDistance);
                    break;
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.joystick.touchId) {
                    this.joystickActive = false;
                    this.joystickAngle = 0;
                    this.joystickDistance = 0;
                    stick.style.transform = 'translate(-50%, -50%)';
                    this.joystick.touchId = null;
                    break;
                }
            }
        });
    }

    updateJoystick(touchX, touchY, maxDistance) {
        const dx = touchX - this.joystick.startX;
        const dy = touchY - this.joystick.startY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Clamp distance to maxDistance
        const clampedDistance = Math.min(distance, maxDistance);

        // Update stick position
        const stickX = Math.cos(angle) * clampedDistance;
        const stickY = Math.sin(angle) * clampedDistance;

        this.joystick.stick.style.transform =
            `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

        // Store normalized values
        this.joystickAngle = angle;
        this.joystickDistance = clampedDistance / maxDistance; // 0 to 1
    }

    setupButtonEvents() {
        // Jump Button
        this.buttonJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.buttonJump.classList.add('pressed');
            window.dispatchEvent(new CustomEvent('mobileButtonJump', { detail: { pressed: true } }));
        }, { passive: false });

        this.buttonJump.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.buttonJump.classList.remove('pressed');
            window.dispatchEvent(new CustomEvent('mobileButtonJump', { detail: { pressed: false } }));
        }, { passive: false });

        // Button A (Kick)
        this.buttonA.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.buttonA.classList.add('pressed');
            window.dispatchEvent(new CustomEvent('mobileButtonA', { detail: { pressed: true } }));
        }, { passive: false });

        this.buttonA.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.buttonA.classList.remove('pressed');
            window.dispatchEvent(new CustomEvent('mobileButtonA', { detail: { pressed: false } }));
        }, { passive: false });

        // Button B (Shoot)
        this.buttonB.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.buttonB.classList.add('pressed');
            window.dispatchEvent(new CustomEvent('mobileButtonB', { detail: { pressed: true } }));
        }, { passive: false });

        this.buttonB.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.buttonB.classList.remove('pressed');
            window.dispatchEvent(new CustomEvent('mobileButtonB', { detail: { pressed: false } }));
        }, { passive: false });
    }

    getJoystickInput() {
        if (!this.joystickActive) {
            return { left: false, right: false };
        }

        const threshold = 0.3; // Minimum distance to register input

        if (this.joystickDistance < threshold) {
            return { left: false, right: false };
        }

        // Convert angle to directional input (left/right only)
        const degrees = this.joystickAngle * (180 / Math.PI);

        return {
            left: Math.abs(degrees) > 90, // Left half of circle
            right: Math.abs(degrees) < 90  // Right half of circle
        };
    }

    isVisible() {
        return this.isMobile;
    }
}
