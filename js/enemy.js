// Bullet Class
class Bullet {
    constructor(x, y, vx) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.width = 6;
        this.height = 6;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw green energy bullet
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(screenX, screenY + 2, 6, 2);
        ctx.fillRect(screenX + 1, screenY + 1, 4, 4);
        ctx.fillRect(screenX + 2, screenY, 2, 6);

        // Bright core
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(screenX + 2, screenY + 2, 2, 2);
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

// Enemy Classes
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;
        this.vx = 0;
        this.vy = 0;
        this.animTime = 0;
        this.hp = 1;
    }

    update(dt) {
        this.animTime += dt;
    }

    takeDamage(damage = 1) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.dead = true;
            return true;
        }
        return false;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    checkCollision(other) {
        return CollisionDetector.checkAABB(this.getBounds(), other);
    }
}

class Goblin extends Enemy {
    constructor(x, y, platformLeft, platformRight) {
        super(x, y, 'goblin');
        this.width = 14;
        this.height = 14;
        this.speed = 30;
        this.vx = -this.speed;
        this.platformLeft = platformLeft;
        this.platformRight = platformRight;
        this.hp = 1;
        this.points = 10;
        this.shootCooldown = 0;
        this.shootInterval = 2.0 + Math.random() * 2.0; // Shoot every 2-4 seconds
    }

    update(dt, platforms, playerX) {
        super.update(dt);

        // Move back and forth on platform
        this.x += this.vx * dt;

        // Turn around at platform edges
        if (this.x <= this.platformLeft || this.x + this.width >= this.platformRight) {
            this.vx = -this.vx;
        }

        // Apply gravity
        this.vy += 600 * dt;
        this.y += this.vy * dt;

        // Simple ground collision
        const nearbyPlatforms = platforms.getPlatformsInRange(
            this.x - 10, this.y - 10,
            this.width + 20, this.height + 20
        );

        for (let platform of nearbyPlatforms) {
            if (CollisionDetector.checkPlatformCollision(this, platform)) {
                this.y = platform.y - this.height;
                this.vy = 0;
            }
        }

        // Shooting logic
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && playerX && Math.abs(this.x - playerX) < 200) {
            this.shootCooldown = this.shootInterval;
            // Return bullet to be created
            return new Bullet(
                this.x + (this.vx > 0 ? this.width : 0),
                this.y + this.height / 2,
                this.vx > 0 ? 100 : -100
            );
        }
        return null;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw goblin (green)
        ctx.fillStyle = '#00AA00';

        // Body
        ctx.fillRect(screenX + 3, screenY + 6, 8, 8);

        // Head
        ctx.fillStyle = '#00CC00';
        ctx.fillRect(screenX + 2, screenY + 2, 10, 6);

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX + 4, screenY + 4, 2, 2);
        ctx.fillRect(screenX + 8, screenY + 4, 2, 2);

        // Feet (simple animation)
        ctx.fillStyle = '#00AA00';
        const frame = Math.floor(this.animTime * 8) % 2;
        if (frame === 0) {
            ctx.fillRect(screenX + 3, screenY + 14, 3, 2);
            ctx.fillRect(screenX + 8, screenY + 14, 3, 2);
        } else {
            ctx.fillRect(screenX + 4, screenY + 14, 3, 2);
            ctx.fillRect(screenX + 7, screenY + 14, 3, 2);
        }
    }
}

class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 'bat');
        this.width = 12;
        this.height = 10;
        this.speed = 60;
        this.vx = -this.speed;
        this.baseY = y;
        this.waveTime = Math.random() * Math.PI * 2;
        this.hp = 1;
        this.points = 20;
    }

    update(dt) {
        super.update(dt);

        // Fly in sine wave pattern
        this.x += this.vx * dt;
        this.waveTime += dt * 3;
        this.y = this.baseY + Math.sin(this.waveTime) * 30;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw bat (purple)
        ctx.fillStyle = '#8800AA';

        // Body
        ctx.fillRect(screenX + 4, screenY + 3, 4, 4);

        // Wings (animated)
        const wingFrame = Math.floor(this.animTime * 10) % 2;
        if (wingFrame === 0) {
            // Wings up
            ctx.fillRect(screenX, screenY + 2, 3, 2);
            ctx.fillRect(screenX + 9, screenY + 2, 3, 2);
        } else {
            // Wings down
            ctx.fillRect(screenX, screenY + 5, 3, 2);
            ctx.fillRect(screenX + 9, screenY + 5, 3, 2);
        }

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX + 4, screenY + 4, 1, 1);
        ctx.fillRect(screenX + 7, screenY + 4, 1, 1);
    }
}

class ArmoredBeetle extends Enemy {
    constructor(x, y, platformLeft, platformRight) {
        super(x, y, 'beetle');
        this.width = 16;
        this.height = 12;
        this.speed = 20;
        this.vx = -this.speed;
        this.platformLeft = platformLeft;
        this.platformRight = platformRight;
        this.hp = 2;
        this.maxHp = 2;
        this.points = 50;
    }

    update(dt, platforms) {
        super.update(dt);

        // Move back and forth on platform (slower than goblin)
        this.x += this.vx * dt;

        // Turn around at platform edges
        if (this.x <= this.platformLeft || this.x + this.width >= this.platformRight) {
            this.vx = -this.vx;
        }

        // Apply gravity
        this.vy += 600 * dt;
        this.y += this.vy * dt;

        // Simple ground collision
        const nearbyPlatforms = platforms.getPlatformsInRange(
            this.x - 10, this.y - 10,
            this.width + 20, this.height + 20
        );

        for (let platform of nearbyPlatforms) {
            if (CollisionDetector.checkPlatformCollision(this, platform)) {
                this.y = platform.y - this.height;
                this.vy = 0;
            }
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw armored beetle (brown with armor)
        // Armor shell (darker when damaged)
        ctx.fillStyle = this.hp < this.maxHp ? '#996600' : '#CC8800';
        ctx.fillRect(screenX + 2, screenY + 2, 12, 8);

        // Shell segments
        ctx.strokeStyle = '#663300';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 6, screenY + 2);
        ctx.lineTo(screenX + 6, screenY + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 2);
        ctx.lineTo(screenX + 10, screenY + 10);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#AA6600';
        ctx.fillRect(screenX, screenY + 5, 3, 4);

        // Legs
        ctx.fillStyle = '#663300';
        ctx.fillRect(screenX + 3, screenY + 10, 2, 2);
        ctx.fillRect(screenX + 6, screenY + 10, 2, 2);
        ctx.fillRect(screenX + 9, screenY + 10, 2, 2);
        ctx.fillRect(screenX + 12, screenY + 10, 2, 2);
    }
}

class EnemyManager {
    constructor(platforms, gameHeight) {
        this.enemies = [];
        this.bullets = [];
        this.platforms = platforms;
        this.gameHeight = gameHeight;
        this.spawnDistance = 0;
        this.nextSpawnDistance = 200;
        this.difficultyMultiplier = 1.0;
    }

    update(dt, playerX, gameWidth) {
        // Update all enemies and collect bullets
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.dead) return false;
            if (enemy.x < playerX - 100) return false; // Despawn off-screen enemies

            const bullet = enemy.update(dt, this.platforms, playerX);
            if (bullet) {
                this.bullets.push(bullet);
            }
            return true;
        });

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.dead) return false;
            if (bullet.x < playerX - 150 || bullet.x > playerX + gameWidth + 50) return false;

            bullet.update(dt);
            return true;
        });

        // Spawn new enemies based on distance
        this.spawnDistance = playerX;
        if (this.spawnDistance > this.nextSpawnDistance) {
            this.spawnEnemy(playerX + gameWidth);
            this.nextSpawnDistance = this.spawnDistance + (150 + Math.random() * 200) / this.difficultyMultiplier;

            // Increase difficulty every 500 pixels
            this.difficultyMultiplier = 1.0 + Math.floor(this.spawnDistance / 500) * 0.1;
        }

        // Max 5 enemies on screen
        if (this.enemies.length > 5) {
            this.enemies = this.enemies.slice(-5);
        }
    }

    spawnEnemy(spawnX) {
        // Find a suitable platform
        const suitablePlatforms = this.platforms.platforms.filter(p =>
            p.x > spawnX - 100 && p.x < spawnX + 100 && p.y < this.gameHeight - 50
        );

        if (suitablePlatforms.length === 0) return;

        const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];

        // Choose enemy type
        const rand = Math.random();
        let enemy;

        if (rand < 0.6) {
            // Goblin (60%)
            enemy = new Goblin(
                platform.x + 20,
                platform.y - 16,
                platform.x,
                platform.x + platform.width
            );
        } else if (rand < 0.9) {
            // Bat (30%)
            enemy = new Bat(
                platform.x + platform.width / 2,
                platform.y - 60
            );
        } else {
            // Armored Beetle (10%)
            enemy = new ArmoredBeetle(
                platform.x + 20,
                platform.y - 14,
                platform.x,
                platform.x + platform.width
            );
        }

        this.enemies.push(enemy);
    }

    draw(ctx, camera) {
        this.enemies.forEach(enemy => enemy.draw(ctx, camera));
        this.bullets.forEach(bullet => bullet.draw(ctx, camera));
    }

    checkPlayerCollisions(player) {
        const playerBounds = player.getBounds ? player.getBounds() : {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        };

        for (let enemy of this.enemies) {
            if (enemy.dead) continue;

            if (enemy.checkCollision(playerBounds)) {
                // Check if player is attacking
                const attackHitbox = player.getAttackHitbox();
                if (attackHitbox && CollisionDetector.checkAABB(attackHitbox, enemy.getBounds())) {
                    // Player hit enemy
                    const killed = enemy.takeDamage(player.attackType === 'kick' || player.attackType === 'stab' ? 1 : 1);
                    return { type: 'enemy_hit', enemy: enemy, killed: killed };
                }

                // Check jump attack (landing on top)
                if (player.vy > 0 && playerBounds.y + playerBounds.height * 0.5 < enemy.y) {
                    const killed = enemy.takeDamage(1);
                    player.vy = -200; // Bounce
                    return { type: 'enemy_hit', enemy: enemy, killed: killed };
                }

                // Enemy damaged player
                return { type: 'player_hit', enemy: enemy };
            }
        }

        return null;
    }

    checkBulletCollisions(player) {
        // Check bullets hitting player
        for (let bullet of this.bullets) {
            if (bullet.dead) continue;

            const playerBounds = {
                x: player.x,
                y: player.y,
                width: player.width,
                height: player.height
            };

            if (CollisionDetector.checkAABB(bullet.getBounds(), playerBounds)) {
                // Check if player is attacking to destroy bullet
                const attackHitbox = player.getAttackHitbox();
                if (attackHitbox && CollisionDetector.checkAABB(attackHitbox, bullet.getBounds())) {
                    bullet.dead = true;
                    return { type: 'bullet_destroyed' };
                }

                // Bullet hits player
                bullet.dead = true;
                return { type: 'player_hit_by_bullet' };
            }
        }

        return null;
    }
}
