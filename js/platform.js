// Platform Generation System
class Platform {
    constructor(x, y, width, height, type = 'solid', stage = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'solid' or 'oneway'
        this.stage = stage;
        this.isMoving = false;
        this.lastX = x; // Track position for moving platform logic
    }

    update(dt) {
        // Base platforms don't move
        this.lastX = this.x;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Stage-specific color palettes
        const stageColors = {
            1: { base: '#D2691E', highlight: '#FFB366', shadow: '#8B4513', stroke: '#A0522D' },
            2: { base: '#8B008B', highlight: '#DA70D6', shadow: '#4B0082', stroke: '#9370DB' }, // Purple
            3: { base: '#00CED1', highlight: '#AFEEEE', shadow: '#008B8B', stroke: '#48D1CC' }, // Cyan/Ice
            4: { base: '#228B22', highlight: '#90EE90', shadow: '#006400', stroke: '#32CD32' }, // Green
            5: { base: '#B22222', highlight: '#FF6347', shadow: '#8B0000', stroke: '#DC143C' }  // Red/Fire
        };

        const colors = stageColors[this.stage] || stageColors[1];

        if (this.type === 'solid') {
            // Draw solid platform with stage-specific colors
            ctx.fillStyle = colors.base;
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Top highlight
            ctx.fillStyle = colors.highlight;
            ctx.fillRect(screenX, screenY, this.width, 2);

            // Shadow on bottom
            ctx.fillStyle = colors.shadow;
            ctx.fillRect(screenX, screenY + this.height - 2, this.width, 2);

            // Brick pattern with alternating colors
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = 1;
            const brickWidth = 16;
            const brickHeight = 8;
            for (let bx = 0; bx < this.width; bx += brickWidth) {
                for (let by = 0; by < this.height; by += brickHeight) {
                    ctx.strokeRect(screenX + bx, screenY + by, brickWidth, brickHeight);
                    // Add dots for texture
                    if ((bx + by) % 32 === 0) {
                        ctx.fillStyle = colors.stroke;
                        ctx.fillRect(screenX + bx + 4, screenY + by + 3, 2, 2);
                    }
                }
            }
        } else {
            // Draw one-way platform with stage-specific colors (lighter versions)
            const onewayColors = {
                1: '#00BFFF',
                2: '#DDA0DD', // Plum
                3: '#E0FFFF', // Light cyan (icy)
                4: '#98FB98', // Pale green
                5: '#FA8072'  // Salmon (fire theme)
            };

            ctx.fillStyle = onewayColors[this.stage] || onewayColors[1];
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Top bright highlight
            ctx.fillStyle = colors.highlight;
            ctx.fillRect(screenX, screenY, this.width, 2);

            // Bottom shadow
            ctx.fillStyle = colors.shadow;
            ctx.fillRect(screenX, screenY + this.height - 2, this.width, 2);

            // Decorative pattern
            for (let i = 0; i < this.width; i += 8) {
                ctx.fillStyle = colors.stroke;
                ctx.fillRect(screenX + i, screenY + 2, 2, this.height - 4);
            }
        }
    }
}

class MovingPlatform extends Platform {
    constructor(x, y, width, height, leftBound, rightBound, stage = 1) {
        super(x, y, width, height, 'solid', stage);
        this.isMoving = true;
        this.startX = x;
        this.leftBound = leftBound;
        this.rightBound = rightBound;
        this.speed = 40; // Pixels per second
        this.direction = 1; // 1 for right, -1 for left
        this.velocityX = 0; // Current velocity
        this.lastX = x; // Track last position
    }

    update(dt) {
        // Store last position
        this.lastX = this.x;

        // Move platform
        const movement = this.speed * this.direction * dt;
        this.x += movement;
        this.velocityX = movement / dt; // Store velocity for this frame

        // Reverse direction at bounds
        if (this.x <= this.leftBound) {
            this.x = this.leftBound;
            this.direction = 1;
            this.velocityX = 0; // Stop at bounds
        } else if (this.x + this.width >= this.rightBound) {
            this.x = this.rightBound - this.width;
            this.direction = -1;
            this.velocityX = 0; // Stop at bounds
        }
    }

    draw(ctx, camera) {
        // Call parent draw method
        super.draw(ctx, camera);

        // Add visual indicator that it's moving (arrows or glow)
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw arrows to show movement direction
        ctx.fillStyle = '#FFFF00';
        if (this.direction > 0) {
            // Right arrow
            ctx.fillRect(screenX + this.width - 8, screenY + this.height / 2 - 2, 6, 4);
            ctx.fillRect(screenX + this.width - 6, screenY + this.height / 2 - 3, 2, 6);
        } else {
            // Left arrow
            ctx.fillRect(screenX + 2, screenY + this.height / 2 - 2, 6, 4);
            ctx.fillRect(screenX + 2, screenY + this.height / 2 - 3, 2, 6);
        }
    }
}

class PlatformGenerator {
    constructor(gameWidth, gameHeight) {
        this.platforms = [];
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.tileSize = 16;
        this.lastPlatformX = 0;
        this.currentStage = 1;

        // Create ground level
        this.platforms.push(new Platform(0, gameHeight - 32, gameWidth * 3, 32, 'solid', 1));

        // Generate initial platforms
        this.generatePlatforms(0, gameWidth * 2, 1);
    }

    generatePlatforms(startX, endX, currentStage = 1) {
        let currentX = Math.max(startX, this.lastPlatformX);

        // Get the last platform to ensure reachability
        let lastPlatform = this.platforms[this.platforms.length - 1];
        if (!lastPlatform) {
            lastPlatform = { x: 0, y: this.gameHeight - 32, width: 100 };
        }

        while (currentX < endX) {
            // Max jump: ~56 pixels up, ~90 pixels horizontal
            // Random gap between platforms (2-5 tiles, max ~80 pixels)
            const gap = (2 + Math.random() * 3) * this.tileSize;
            currentX += gap;

            // Random platform width (3-8 tiles)
            const width = (3 + Math.floor(Math.random() * 6)) * this.tileSize;

            // Calculate Y position ensuring it's reachable from last platform
            // Max upward jump from last platform: ~56 pixels
            // But allow platforms to be below easily (can fall any distance)
            const maxHeightAboveLastPlatform = 48; // ~3 tiles (conservative)
            const maxHeightBelowLastPlatform = 80; // Can fall further

            const minY = Math.max(40, lastPlatform.y - maxHeightAboveLastPlatform);
            const maxY = Math.min(this.gameHeight - 50, lastPlatform.y + maxHeightBelowLastPlatform);

            const y = minY + Math.random() * (maxY - minY);

            // Stage 4+: 30% chance of moving platform, otherwise normal
            // Stage 1-3: Normal platforms (70% one-way, 30% solid)
            let newPlatform;
            if (currentStage >= 4 && Math.random() < 0.3) {
                // Create moving platform
                const moveDistance = 80 + Math.random() * 80; // Move 80-160 pixels
                const leftBound = currentX;
                const rightBound = currentX + moveDistance;
                newPlatform = new MovingPlatform(currentX, y, width, 16, leftBound, rightBound, currentStage);
            } else {
                // Create normal platform
                const type = Math.random() > 0.3 ? 'oneway' : 'solid';
                const height = type === 'solid' ? 16 : 8;
                newPlatform = new Platform(currentX, y, width, height, type, currentStage);
            }

            this.platforms.push(newPlatform);

            // Update for next iteration
            lastPlatform = newPlatform;
            currentX += width;
        }

        this.lastPlatformX = currentX;
    }

    update(cameraX, gameWidth, currentStage = 1, dt = 0) {
        // Update current stage
        this.currentStage = currentStage;

        // Update all moving platforms
        this.platforms.forEach(platform => {
            if (platform.isMoving && dt > 0) {
                platform.update(dt);
            }
        });

        // Remove platforms far behind camera
        this.platforms = this.platforms.filter(p => p.x + p.width > cameraX - 100);

        // Generate new platforms ahead
        const rightEdge = cameraX + gameWidth + 200;
        if (this.lastPlatformX < rightEdge) {
            this.generatePlatforms(this.lastPlatformX, rightEdge + 400, currentStage);
        }
    }

    draw(ctx, camera) {
        this.platforms.forEach(platform => {
            if (platform.x + platform.width > camera.x - 50 &&
                platform.x < camera.x + this.gameWidth + 50) {
                platform.draw(ctx, camera);
            }
        });
    }

    getPlatformsInRange(x, y, width, height) {
        return this.platforms.filter(p => {
            return p.x < x + width &&
                   p.x + p.width > x &&
                   p.y < y + height &&
                   p.y + p.height > y;
        });
    }
}

class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.baseY = y;
        this.bobTime = Math.random() * Math.PI * 2;
        this.collected = false;
    }

    update(dt) {
        this.bobTime += dt * 3;
        this.y = this.baseY + Math.sin(this.bobTime) * 4;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw vibrant Atari-style star
        ctx.save();
        ctx.translate(screenX + 6, screenY + 6);
        ctx.rotate(this.bobTime * 0.5);

        // Outer glow
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(-5, -1, 10, 2);
        ctx.fillRect(-1, -5, 2, 10);

        // Main star (bright gold)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillRect(-1, -4, 2, 8);
        ctx.fillRect(-3, -3, 2, 2);
        ctx.fillRect(1, -3, 2, 2);
        ctx.fillRect(-3, 1, 2, 2);
        ctx.fillRect(1, 1, 2, 2);

        // Bright white center
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-1, -1, 2, 2);

        ctx.restore();
    }
}

class Magazine {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 12;
        this.collected = false;
        this.bobTime = Math.random() * Math.PI * 2;
        this.baseY = y;
    }

    update(dt) {
        this.bobTime += dt * 2;
        this.y = this.baseY + Math.sin(this.bobTime) * 3;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw magazine (ammo box)
        // Main box (brown/tan)
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(screenX + 2, screenY + 2, 12, 8);

        // Top (darker)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX + 2, screenY + 2, 12, 2);

        // Bullets visible at top (yellow/orange)
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(screenX + 4, screenY, 2, 3);
        ctx.fillRect(screenX + 7, screenY, 2, 3);
        ctx.fillRect(screenX + 10, screenY, 2, 3);

        // Bullet tips (brass)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX + 4, screenY, 2, 1);
        ctx.fillRect(screenX + 7, screenY, 2, 1);
        ctx.fillRect(screenX + 10, screenY, 2, 1);

        // Outline/detail
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 2, screenY + 2, 12, 8);
    }
}

class Heart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.collected = false;
        this.bobTime = Math.random() * Math.PI * 2;
        this.baseY = y;
    }

    update(dt) {
        this.bobTime += dt * 2.5;
        this.y = this.baseY + Math.sin(this.bobTime) * 4;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw heart with pulsing glow effect
        const pulse = Math.sin(this.bobTime * 2) * 0.3 + 0.7;

        ctx.save();
        ctx.globalAlpha = pulse;

        // Outer glow (yellow/gold)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX + 2, screenY + 1, 4, 2);
        ctx.fillRect(screenX + 10, screenY + 1, 4, 2);
        ctx.fillRect(screenX + 1, screenY + 3, 14, 8);
        ctx.fillRect(screenX + 2, screenY + 11, 12, 2);
        ctx.fillRect(screenX + 4, screenY + 13, 8, 2);

        ctx.restore();

        // Main heart (bright red)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX + 3, screenY + 2, 4, 2);
        ctx.fillRect(screenX + 9, screenY + 2, 4, 2);
        ctx.fillRect(screenX + 2, screenY + 4, 12, 8);
        ctx.fillRect(screenX + 3, screenY + 12, 10, 2);
        ctx.fillRect(screenX + 5, screenY + 14, 6, 2);

        // Bright highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(screenX + 4, screenY + 3, 2, 2);
        ctx.fillRect(screenX + 10, screenY + 3, 2, 2);
        ctx.fillRect(screenX + 6, screenY + 6, 1, 1);
    }
}

class Fire {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 16;
        this.animTime = 0;
        this.dead = false;
    }

    update(dt) {
        this.animTime += dt * 8;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Animated fire effect
        const flameFrame = Math.floor(this.animTime) % 3;

        // Base fire (red/orange)
        ctx.fillStyle = '#FF4500';
        for (let i = 0; i < this.width; i += 4) {
            const flameHeight = 8 + Math.sin(this.animTime * 2 + i * 0.5) * 4;
            ctx.fillRect(screenX + i, screenY + this.height - flameHeight, 4, flameHeight);
        }

        // Bright flames (yellow)
        ctx.fillStyle = '#FFD700';
        for (let i = 2; i < this.width; i += 8) {
            const flameHeight = 6 + Math.sin(this.animTime * 3 + i * 0.3) * 3;
            ctx.fillRect(screenX + i, screenY + this.height - flameHeight, 3, flameHeight - 2);
        }

        // Hot core (white)
        ctx.fillStyle = '#FFFFFF';
        for (let i = 4; i < this.width; i += 12) {
            const coreHeight = 3 + Math.sin(this.animTime * 4 + i * 0.2) * 2;
            ctx.fillRect(screenX + i, screenY + this.height - coreHeight, 2, coreHeight - 1);
        }

        // Embers/particles above fire
        ctx.fillStyle = flameFrame === 0 ? '#FF6347' : '#FFA500';
        for (let i = 0; i < this.width / 8; i++) {
            const px = screenX + (i * 8) + Math.sin(this.animTime + i) * 3;
            const py = screenY - 2 - (this.animTime % 1) * 8;
            ctx.fillRect(px, py, 2, 2);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;
        this.animTime = 0;
        this.activated = false;
    }

    update(dt) {
        this.animTime += dt * 4;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Animated portal with swirling effect
        const pulse = Math.sin(this.animTime) * 0.3 + 0.7;

        // Outer ring (purple)
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#8800FF";
        ctx.fillRect(screenX + 4, screenY, 40, 64);
        ctx.fillRect(screenX, screenY + 8, 48, 48);

        // Inner ring (cyan)
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(screenX + 8, screenY + 4, 32, 56);
        ctx.fillRect(screenX + 4, screenY + 12, 40, 40);

        // Swirling center (animated)
        const swirl = Math.floor(this.animTime * 2) % 4;
        ctx.fillStyle = "#FFFFFF";

        if (swirl === 0) {
            ctx.fillRect(screenX + 16, screenY + 20, 16, 24);
            ctx.fillRect(screenX + 12, screenY + 24, 8, 16);
        } else if (swirl === 1) {
            ctx.fillRect(screenX + 20, screenY + 16, 8, 32);
            ctx.fillRect(screenX + 16, screenY + 20, 16, 24);
        } else if (swirl === 2) {
            ctx.fillRect(screenX + 16, screenY + 20, 16, 24);
            ctx.fillRect(screenX + 28, screenY + 24, 8, 16);
        } else {
            ctx.fillRect(screenX + 12, screenY + 20, 24, 24);
            ctx.fillRect(screenX + 20, screenY + 16, 8, 8);
        }

        // Bright core
        ctx.fillStyle = "#FFFF00";
        ctx.fillRect(screenX + 20, screenY + 28, 8, 8);

        ctx.restore();

        // Particles around portal
        for (let i = 0; i < 8; i++) {
            const angle = (this.animTime + i * Math.PI / 4) * 2;
            const distance = 30 + Math.sin(this.animTime * 2 + i) * 5;
            const px = screenX + 24 + Math.cos(angle) * distance;
            const py = screenY + 32 + Math.sin(angle) * distance;

            ctx.fillStyle = i % 2 === 0 ? "#FF00FF" : "#00FFFF";
            ctx.fillRect(px, py, 3, 3);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

