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

// Poop Class (dropped by birds)
class Poop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 150; // Falls down
        this.width = 6;
        this.height = 6;
        this.dead = false;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.vy += 300 * dt; // Gravity acceleration
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw brown poop
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX + 1, screenY, 4, 2);
        ctx.fillRect(screenX, screenY + 2, 6, 3);
        ctx.fillRect(screenX + 1, screenY + 5, 4, 1);

        // Darker spots
        ctx.fillStyle = '#654321';
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

class RedGoblin extends Enemy {
    constructor(x, y, platformLeft, platformRight) {
        super(x, y, 'redgoblin');
        this.width = 14;
        this.height = 14;
        this.speed = 40; // Slightly faster than regular goblin
        this.vx = -this.speed;
        this.platformLeft = platformLeft;
        this.platformRight = platformRight;
        this.hp = 1;
        this.points = 25;
        this.shootCooldown = 0;
        this.shootInterval = (2.0 + Math.random() * 2.0) / 3.0; // Shoot 3x faster (every 0.67-1.33 seconds)
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

        // Shooting logic (3x faster!)
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && playerX && Math.abs(this.x - playerX) < 250) {
            this.shootCooldown = this.shootInterval;
            // Return bullet to be created
            return new Bullet(
                this.x + (this.vx > 0 ? this.width : 0),
                this.y + this.height / 2,
                this.vx > 0 ? 120 : -120 // Faster bullets too
            );
        }
        return null;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw red goblin (red/orange)
        ctx.fillStyle = '#CC0000';

        // Body
        ctx.fillRect(screenX + 3, screenY + 6, 8, 8);

        // Head
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX + 2, screenY + 2, 10, 6);

        // Eyes (glowing yellow)
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(screenX + 4, screenY + 4, 2, 2);
        ctx.fillRect(screenX + 8, screenY + 4, 2, 2);

        // Feet (simple animation)
        ctx.fillStyle = '#AA0000';
        const frame = Math.floor(this.animTime * 8) % 2;
        if (frame === 0) {
            ctx.fillRect(screenX + 3, screenY + 14, 3, 2);
            ctx.fillRect(screenX + 8, screenY + 14, 3, 2);
        } else {
            ctx.fillRect(screenX + 4, screenY + 14, 3, 2);
            ctx.fillRect(screenX + 7, screenY + 14, 3, 2);
        }

        // Weapon indicator (small gun)
        ctx.fillStyle = '#666666';
        ctx.fillRect(screenX + (this.vx > 0 ? 11 : 1), screenY + 8, 3, 2);
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

class Bird extends Enemy {
    constructor(x, y) {
        super(x, y, 'bird');
        this.width = 14;
        this.height = 12;
        this.speed = 50;
        this.vx = -this.speed;
        this.baseY = y;
        this.waveTime = Math.random() * Math.PI * 2;
        this.hp = 1;
        this.points = 30;
        this.poopCooldown = 0;
        this.poopInterval = 2.0 + Math.random() * 2.0; // Poop every 2-4 seconds
    }

    update(dt, platforms, playerX) {
        super.update(dt);

        // Fly in sine wave pattern
        this.x += this.vx * dt;
        this.waveTime += dt * 2;
        this.y = this.baseY + Math.sin(this.waveTime) * 40;

        // Pooping logic
        this.poopCooldown -= dt;
        if (this.poopCooldown <= 0 && playerX && Math.abs(this.x - playerX) < 150) {
            this.poopCooldown = this.poopInterval;
            // Return poop to be created
            return new Poop(
                this.x + this.width / 2,
                this.y + this.height
            );
        }
        return null;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw bird (brown/white)
        ctx.fillStyle = '#8B4513';

        // Body
        ctx.fillRect(screenX + 4, screenY + 4, 6, 5);

        // Head
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(screenX + 2, screenY + 2, 4, 4);

        // Beak
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX, screenY + 3, 2, 2);

        // Wings (animated)
        ctx.fillStyle = '#654321';
        const wingFrame = Math.floor(this.animTime * 8) % 2;
        if (wingFrame === 0) {
            // Wings up
            ctx.fillRect(screenX + 3, screenY + 1, 3, 2);
            ctx.fillRect(screenX + 8, screenY + 1, 3, 2);
        } else {
            // Wings down
            ctx.fillRect(screenX + 3, screenY + 7, 3, 2);
            ctx.fillRect(screenX + 8, screenY + 7, 3, 2);
        }

        // Eye
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX + 3, screenY + 3, 1, 1);

        // Tail
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX + 10, screenY + 5, 2, 3);
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
        this.poops = [];
        this.platforms = platforms;
        this.gameHeight = gameHeight;
        this.spawnDistance = 0;
        this.nextSpawnDistance = 200;
        this.difficultyMultiplier = 1.0;
    }

    update(dt, playerX, gameWidth, distance = 0, currentStage = 1) {
        // Update all enemies and collect bullets/poops
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.dead) return false;
            if (enemy.x < playerX - 100) return false; // Despawn off-screen enemies

            const projectile = enemy.update(dt, this.platforms, playerX);
            if (projectile) {
                if (projectile instanceof Poop) {
                    if (!this.poops) this.poops = [];
                    this.poops.push(projectile);
                } else {
                    this.bullets.push(projectile);
                }
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

        // Update poops
        this.poops = this.poops.filter(poop => {
            if (poop.dead) return false;
            if (poop.y > this.gameHeight + 50) return false; // Remove when off screen

            poop.update(dt);
            return true;
        });

        // Spawn new enemies based on distance
        this.spawnDistance = playerX;
        if (this.spawnDistance > this.nextSpawnDistance) {
            this.spawnEnemy(playerX + gameWidth, distance, currentStage);
            this.nextSpawnDistance = this.spawnDistance + (150 + Math.random() * 200) / this.difficultyMultiplier;

            // Increase difficulty every 500 pixels
            this.difficultyMultiplier = 1.0 + Math.floor(this.spawnDistance / 500) * 0.1;
        }

        // Max 5 enemies on screen
        if (this.enemies.length > 5) {
            this.enemies = this.enemies.slice(-5);
        }
    }

    spawnEnemy(spawnX, distance = 0, currentStage = 1) {
        // Find a suitable platform
        const suitablePlatforms = this.platforms.platforms.filter(p =>
            p.x > spawnX - 100 && p.x < spawnX + 100 && p.y < this.gameHeight - 50
        );

        if (suitablePlatforms.length === 0) return;

        const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];

        // Check difficulty thresholds (stage-based or distance-based)
        const allowRedGoblins = (typeof GameConfig !== 'undefined' && GameConfig.stagesMode) ?
            currentStage >= 2 : distance >= (GameConfig.redGoblinDistance || 500);
        const allowBirds = (typeof GameConfig !== 'undefined' && GameConfig.stagesMode) ?
            currentStage >= 2 : distance >= (GameConfig.birdDistance || 1000);

        // Choose enemy type based on stage/distance
        const rand = Math.random();
        let enemy;

        if (allowBirds && rand < 0.15) {
            // Bird (15% after threshold)
            enemy = new Bird(
                platform.x + platform.width / 2,
                platform.y - 60
            );
        } else if (allowRedGoblins && rand < 0.35) {
            // Red Goblin (20% after threshold)
            enemy = new RedGoblin(
                platform.x + 20,
                platform.y - 16,
                platform.x,
                platform.x + platform.width
            );
        } else if (rand < 0.65) {
            // Goblin (30%)
            enemy = new Goblin(
                platform.x + 20,
                platform.y - 16,
                platform.x,
                platform.x + platform.width
            );
        } else if (rand < 0.9) {
            // Bat (25%)
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
        this.poops.forEach(poop => poop.draw(ctx, camera));
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

    checkPoopCollisions(player) {
        // Check poops hitting player
        for (let poop of this.poops) {
            if (poop.dead) continue;

            const playerBounds = {
                x: player.x,
                y: player.y,
                width: player.width,
                height: player.height
            };

            if (CollisionDetector.checkAABB(poop.getBounds(), playerBounds)) {
                // Check if player is attacking to destroy poop
                const attackHitbox = player.getAttackHitbox();
                if (attackHitbox && CollisionDetector.checkAABB(attackHitbox, poop.getBounds())) {
                    poop.dead = true;
                    return { type: 'poop_destroyed' };
                }

                // Poop hits player
                poop.dead = true;
                return { type: 'player_hit_by_poop' };
            }
        }

        return null;
    }
}
