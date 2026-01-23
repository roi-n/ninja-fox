// Platform Generation System
class Platform {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'solid' or 'oneway'
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        if (this.type === 'solid') {
            // Draw solid platform with vibrant Atari-style colors
            // Base color - bright tan/orange
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Top highlight
            ctx.fillStyle = '#FFB366';
            ctx.fillRect(screenX, screenY, this.width, 2);

            // Shadow on bottom
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, screenY + this.height - 2, this.width, 2);

            // Brick pattern with alternating colors
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 1;
            const brickWidth = 16;
            const brickHeight = 8;
            for (let bx = 0; bx < this.width; bx += brickWidth) {
                for (let by = 0; by < this.height; by += brickHeight) {
                    ctx.strokeRect(screenX + bx, screenY + by, brickWidth, brickHeight);
                    // Add dots for texture
                    if ((bx + by) % 32 === 0) {
                        ctx.fillStyle = '#A0522D';
                        ctx.fillRect(screenX + bx + 4, screenY + by + 3, 2, 2);
                    }
                }
            }
        } else {
            // Draw one-way platform (vibrant cyan/blue Atari style)
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Top bright highlight
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(screenX, screenY, this.width, 2);

            // Bottom shadow
            ctx.fillStyle = '#1E90FF';
            ctx.fillRect(screenX, screenY + this.height - 2, this.width, 2);

            // Decorative pattern
            for (let i = 0; i < this.width; i += 8) {
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(screenX + i, screenY + 2, 2, this.height - 4);
            }
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

        // Create ground level
        this.platforms.push(new Platform(0, gameHeight - 32, gameWidth * 3, 32, 'solid'));

        // Generate initial platforms
        this.generatePlatforms(0, gameWidth * 2);
    }

    generatePlatforms(startX, endX) {
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

            // 70% one-way, 30% solid
            const type = Math.random() > 0.3 ? 'oneway' : 'solid';
            const height = type === 'solid' ? 16 : 8;

            const newPlatform = new Platform(currentX, y, width, height, type);
            this.platforms.push(newPlatform);

            // Update for next iteration
            lastPlatform = newPlatform;
            currentX += width;
        }

        this.lastPlatformX = currentX;
    }

    update(cameraX, gameWidth) {
        // Remove platforms far behind camera
        this.platforms = this.platforms.filter(p => p.x + p.width > cameraX - 100);

        // Generate new platforms ahead
        const rightEdge = cameraX + gameWidth + 200;
        if (this.lastPlatformX < rightEdge) {
            this.generatePlatforms(this.lastPlatformX, rightEdge + 400);
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
