// Player Character - Ninja Fox
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.vx = 0;
        this.vy = 0;
        this.speed = 120;
        this.jumpForce = -300;
        this.gravity = 800;
        this.grounded = false;
        this.health = 3;
        this.maxHealth = 3;

        // State management
        this.state = 'idle'; // idle, running, jumping, falling, kicking, stabbing, hurt
        this.facing = 1; // 1 = right, -1 = left
        this.animTime = 0;
        this.stateTime = 0;

        // Jump mechanics
        this.coyoteTime = 0.1;
        this.coyoteCounter = 0;
        this.jumpBuffer = 0.15;
        this.jumpBufferCounter = 0;
        this.doubleJumpAvailable = false;

        // Combat
        this.attacking = false;
        this.attackTime = 0;
        this.attackType = null;
        this.invulnerable = false;
        this.invulnerableTime = 0;

        // Visual effects
        this.flashTime = 0;

        // Ice physics
        this.onIce = false;
        this.slideVelocity = 0;
    }

    handleInput(input, dt) {
        if (this.state === 'kicking' || this.state === 'stabbing' || this.state === 'hurt') {
            return; // Can't move during attacks or hurt state
        }

        // Horizontal movement
        let targetVx = 0;
        if (input.isKeyDown('a')) {
            targetVx = -this.speed;
            this.facing = -1;
        }
        if (input.isKeyDown('d')) {
            targetVx = this.speed;
            this.facing = 1;
        }

        // Apply ice physics if on ice
        if (this.onIce && this.grounded) {
            // Slide on ice - slower acceleration/deceleration
            const acceleration = 400 * dt; // Lower acceleration on ice
            if (Math.abs(targetVx - this.vx) < acceleration) {
                this.vx = targetVx;
            } else {
                this.vx += targetVx > this.vx ? acceleration : -acceleration;
            }
        } else {
            this.vx = targetVx;
        }

        // Jump
        if (input.isKeyPressed('w')) {
            this.jumpBufferCounter = this.jumpBuffer;
        }

        if (this.jumpBufferCounter > 0) {
            // First jump from ground
            if (this.coyoteCounter > 0) {
                this.vy = this.jumpForce;
                this.jumpBufferCounter = 0;
                this.coyoteCounter = 0;
                this.grounded = false;
                this.doubleJumpAvailable = true;
                return 'jump';
            }
            // Double jump in air
            else if (this.doubleJumpAvailable && !this.grounded) {
                this.vy = this.jumpForce;
                this.jumpBufferCounter = 0;
                this.doubleJumpAvailable = false;
                return 'jump';
            }
        }

        // Attacks (can be done in air too for better reactivity)
        if (input.isKeyPressed(',')) {
            this.startKick();
            return 'kick';
        }

        if (input.isKeyPressed('.')) {
            this.startStab();
            return 'sword';
        }

        return null;
    }

    startKick() {
        this.state = 'kicking';
        this.attacking = true;
        this.attackType = 'kick';
        this.attackTime = 0.25; // Faster, more reactive
        this.stateTime = 0;
        // Don't set invulnerable - causes invisibility issues
        this.vx = this.facing * 50; // Forward momentum
    }

    startStab() {
        this.state = 'stabbing';
        this.attacking = true;
        this.attackType = 'stab';
        this.attackTime = 0.2; // Faster, more reactive
        this.stateTime = 0;
        this.vx = 0;
    }

    takeDamage() {
        if (this.invulnerable) return false;

        this.health--;
        this.invulnerable = true;
        this.invulnerableTime = 1.0;
        this.state = 'hurt';
        this.stateTime = 0;
        this.vy = -200;
        this.vx = -this.facing * 100;

        return true;
    }

    update(dt, platforms) {
        // Update timers
        if (this.jumpBufferCounter > 0) {
            this.jumpBufferCounter -= dt;
        }

        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
            this.flashTime += dt;
        }

        this.stateTime += dt;
        this.animTime += dt;

        // Update attack state
        if (this.attacking) {
            this.attackTime -= dt;
            if (this.attackTime <= 0) {
                this.attacking = false;
                this.attackType = null;
                this.state = 'idle';
            }
        }

        // Handle hurt state
        if (this.state === 'hurt' && this.stateTime > 0.3) {
            this.state = 'idle';
        }

        // Apply gravity
        if (!this.grounded) {
            this.vy += this.gravity * dt;
        }

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Prevent going off left edge
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }

        // Check if grounded
        let wasGrounded = this.grounded;
        this.grounded = false;
        this.onIce = false; // Reset ice flag

        // Platform collision
        const nearbyPlatforms = platforms.getPlatformsInRange(
            this.x - 20, this.y - 20,
            this.width + 40, this.height + 40
        );

        for (let platform of nearbyPlatforms) {
            if (platform.type === 'oneway') {
                if (CollisionDetector.checkPlatformCollision(this, platform)) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    this.onIce = true; // One-way platforms are ice!
                }
            } else if (platform.type === 'solid') {
                if (CollisionDetector.checkSolidCollision(this, platform)) {
                    const side = CollisionDetector.resolveCollision(this, platform);
                    if (side === 'top') {
                        this.grounded = true;
                    }
                }
            }
        }

        // Update coyote time
        if (this.grounded) {
            this.coyoteCounter = this.coyoteTime;
        } else {
            this.coyoteCounter -= dt;
        }

        // Update animation state
        if (this.state !== 'kicking' && this.state !== 'stabbing' && this.state !== 'hurt') {
            if (!this.grounded) {
                this.state = this.vy < 0 ? 'jumping' : 'falling';
            } else if (Math.abs(this.vx) > 0) {
                this.state = 'running';
            } else {
                this.state = 'idle';
            }
        }

        return wasGrounded === false && this.grounded;
    }

    getAttackHitbox() {
        if (!this.attacking) return null;

        if (this.attackType === 'kick') {
            return {
                x: this.x - 10,
                y: this.y - 10,
                width: this.width + 20,
                height: this.height + 20
            };
        } else if (this.attackType === 'stab') {
            // Vertical slash from up to down
            return {
                x: this.facing > 0 ? this.x + this.width - 8 : this.x - 8,
                y: this.y - 10,
                width: 16,
                height: this.height + 20
            };
        }
        return null;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Flash when invulnerable
        if (this.invulnerable && Math.floor(this.flashTime * 10) % 2 === 0) {
            return;
        }

        ctx.save();

        // Flip sprite based on facing direction
        if (this.facing < 0) {
            ctx.translate(screenX + this.width, screenY);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(screenX, screenY);
        }

        // Draw ninja fox (8-bit pixel art style)
        this.drawSprite(ctx);

        ctx.restore();
    }

    drawSprite(ctx) {
        // Larger, more detailed ninja fox (24x24)

        // Body (orange, larger)
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(6, 10, 12, 10);

        // Head (lighter orange)
        ctx.fillStyle = '#FF8833';
        ctx.fillRect(4, 4, 16, 8);

        // Ears (triangular look)
        ctx.fillRect(3, 2, 4, 3);
        ctx.fillRect(17, 2, 4, 3);
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(4, 3, 2, 1);
        ctx.fillRect(18, 3, 2, 1);

        // Ninja headband (black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 6, 16, 3);

        // Eyes (white with black pupils)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 7, 3, 2);
        ctx.fillRect(13, 7, 3, 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(9, 7, 1, 2);
        ctx.fillRect(14, 7, 1, 2);

        // Snout (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 10, 4, 2);

        // Legs with animation
        ctx.fillStyle = '#FF6600';
        if (this.state === 'running') {
            const frame = Math.floor(this.animTime * 10) % 2;
            if (frame === 0) {
                ctx.fillRect(7, 20, 4, 4);
                ctx.fillRect(13, 20, 4, 4);
            } else {
                ctx.fillRect(8, 20, 4, 4);
                ctx.fillRect(12, 20, 4, 4);
            }
        } else {
            ctx.fillRect(8, 20, 3, 4);
            ctx.fillRect(13, 20, 3, 4);
        }

        // Scarf (red, flowing)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(9, 12, 6, 3);
        if (this.state === 'running' || this.state === 'jumping') {
            ctx.fillRect(15, 13, 3, 2);
            ctx.fillRect(18, 14, 2, 1);
        }

        // Attack visuals (larger and more visible)
        if (this.state === 'kicking') {
            // Spinning kick with trail effect
            ctx.fillStyle = '#FFFF00';
            const angle = (this.stateTime / this.attackTime) * Math.PI * 2;
            const kickX = 12 + Math.cos(angle) * 14;
            const kickY = 12 + Math.sin(angle) * 14;

            // Kick effect
            ctx.fillRect(kickX - 3, kickY - 3, 6, 6);

            // Trail
            const trailAngle = angle - Math.PI / 4;
            const trailX = 12 + Math.cos(trailAngle) * 12;
            const trailY = 12 + Math.sin(trailAngle) * 12;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(trailX - 2, trailY - 2, 4, 4);
        } else if (this.state === 'stabbing') {
            // Vertical sword slash from up to down
            const slashProgress = this.stateTime / this.attackTime;
            const slashY = -8 + slashProgress * 30; // Animates from top to bottom

            // Sword blade (vertical)
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(20, slashY, 3, 20);

            // Blade highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(20, slashY, 1, 18);

            // Motion blur effect
            ctx.fillStyle = 'rgba(192, 192, 192, 0.3)';
            ctx.fillRect(21, slashY - 4, 2, 24);

            // Handle at top
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(19, slashY - 3, 5, 3);
        }
    }
}
