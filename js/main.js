// Main Game Loop and Initialization
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game dimensions (wider for landscape mobile)
        this.width = 480;
        this.height = 240;
        this.scale = 2;

        // Set canvas size
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${this.width * this.scale}px`;
        this.canvas.style.height = `${this.height * this.scale}px`;

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        // Game state
        this.state = 'splash'; // splash, playing, gameover, paused
        this.score = 0;
        this.distance = 0;

        // Systems
        this.input = new InputHandler();
        this.mobileControls = new MobileControls();
        this.input.setMobileControls(this.mobileControls);
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();

        // Game objects
        this.player = null;
        this.platforms = null;
        this.enemies = null;
        this.stars = [];
        this.playerBullets = [];
        this.magazines = [];
        this.hearts = [];

        // Spawn tracking
        this.nextMagazineSpawn = 0;
        this.nextHeartSpawn = 0;

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            smoothing: 0.1
        };

        // Background - colorful Atari-style stars
        this.bgStars = [];
        const starColors = ['#FFFFFF', '#FFD700', '#00FFFF', '#FF00FF', '#00FF00'];
        for (let i = 0; i < 50; i++) {
            this.bgStars.push({
                x: Math.random() * this.width * 3,
                y: Math.random() * this.height,
                size: 1 + Math.random(),
                speed: 0.2 + Math.random() * 0.3,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }

        // Splash screen animation
        this.splashTime = 0;

        // Screen shake
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.dt = 1 / 60; // Fixed timestep

        // Bind resize
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    handleResize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const gameAspect = this.width / this.height;
        const windowAspect = windowWidth / windowHeight;

        // Check if mobile (use fractional scaling for better fit)
        const isMobile = this.mobileControls && this.mobileControls.isVisible();

        let scale;
        if (windowAspect > gameAspect) {
            scale = windowHeight / this.height;
        } else {
            scale = windowWidth / this.width;
        }

        // Use fractional scaling on mobile, integer on desktop
        if (!isMobile) {
            scale = Math.floor(scale);
        }

        scale = Math.max(1, Math.min(scale, 4)); // Clamp between 1-4x

        this.canvas.style.width = `${this.width * scale}px`;
        this.canvas.style.height = `${this.height * scale}px`;
    }

    startGame() {
        this.state = 'playing';
        this.prevState = '';
        this.score = 0;
        this.distance = 0;

        // Reset input state to prevent stuck keys
        this.input.reset();

        // Initialize game objects
        this.player = new Player(100, 100);
        this.platforms = new PlatformGenerator(this.width, this.height);
        this.enemies = new EnemyManager(this.platforms, this.height);
        this.stars = [];
        this.playerBullets = [];
        this.magazines = [];
        this.hearts = [];

        // Initialize spawn distances with variance
        this.nextMagazineSpawn = GameConfig.magazineSpawnDistance +
            (Math.random() * 2 - 1) * GameConfig.spawnVariance;
        this.nextHeartSpawn = GameConfig.heartSpawnDistance +
            (Math.random() * 2 - 1) * GameConfig.spawnVariance;

        // Spawn initial stars
        this.spawnStars();

        // Camera
        this.camera.x = 0;
        this.camera.y = 0;

        // Initialize audio
        this.audio.init();
    }

    spawnStars() {
        const cameraRight = this.camera.x + this.width;

        // Clean up off-screen stars
        this.stars = this.stars.filter(star => !star.collected && star.x > this.camera.x - 50);

        // Get suitable platforms (prefer ones ahead of camera, but use all if needed)
        let suitablePlatforms = this.platforms.platforms.filter(p => p.x > cameraRight - 200);
        if (suitablePlatforms.length === 0) {
            suitablePlatforms = this.platforms.platforms;
        }

        if (suitablePlatforms.length === 0) return; // No platforms, can't spawn stars

        // Spawn new stars ahead
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop
        while (this.stars.length < 10 && attempts < maxAttempts) {
            attempts++;

            const platform = suitablePlatforms[
                Math.floor(Math.random() * suitablePlatforms.length)
            ];

            const star = new Star(
                platform.x + Math.random() * platform.width,
                platform.y - 30 - Math.random() * 40
            );

            // Check if too close to existing stars
            const tooClose = this.stars.some(s =>
                Math.abs(s.x - star.x) < 30 && Math.abs(s.y - star.y) < 30
            );

            if (!tooClose) {
                this.stars.push(star);
            }
        }
    }

    update(dt) {
        
        
        if (this.state != this.prevState){
            console.log(`in state: ${this.state}`)
        }
        this.prevState = this.state;

        if (this.state === 'splash') {
            this.splashTime += dt;

            // Check for any key press or touch to start
            for (let key in this.input.keyPressed) {
                if (this.input.keyPressed[key]) {
                    this.startGame();
                    return;
                }
            }

            // Check mobile buttons
            if (this.input.wasMobileKeyPressed()) {
                this.startGame();
                return;
            }

            return;
        }

        if (this.state === 'gameover') {
            // Check for space to retry - use key down instead of key pressed
            if (this.input.isKeyDown(' ') || this.input.wasMobileKeyPressed()) {
                console.log("restarting!!")
                this.input.reset();
                this.startGame();
                console.log("restarted!!")
            }
            return;
        }

        if (this.state === 'paused') {
            // Check for space to unpause
            if (this.input.isKeyPressed(' ') || this.input.wasMobileKeyPressed()) {
                this.state = 'playing';
            }
            return;
        }

        if (this.state !== 'playing') return;

        // Check for pause during gameplay
        if (this.input.isKeyPressed(' ')) {
            this.state = 'paused';
            return;
        }

        // Update player
        const soundEffect = this.player.handleInput(this.input, dt);
        if (soundEffect) {
            if (typeof soundEffect === 'string') {
                this.audio.playSound(soundEffect);
            } else if (soundEffect.type === 'shoot' && soundEffect.bullet) {
                this.playerBullets.push(soundEffect.bullet);
                this.audio.playSound('sword'); // Reuse sword sound for gunshot
            }
        }

        const landed = this.player.update(dt, this.platforms);
        if (landed) {
            this.audio.playSound('land');
        }

        // Check death (fall off screen)
        if (this.player.y > this.height + 50) {
            this.gameOver();
            return;
        }

        // Update camera (follow player with offset)
        this.camera.targetX = this.player.x - this.width / 3;
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;

        // Update platforms
        this.platforms.update(this.camera.x, this.width);

        // Update enemies
        this.enemies.update(dt, this.player.x, this.width);

        // Check enemy collisions
        const collision = this.enemies.checkPlayerCollisions(this.player);
        if (collision) {
            if (collision.type === 'enemy_hit') {
                this.audio.playSound('enemy');
                this.score += collision.enemy.points;
                this.particles.emit(
                    collision.enemy.x + collision.enemy.width / 2,
                    collision.enemy.y + collision.enemy.height / 2,
                    8,
                    '#00FF00'
                );
                this.screenShake(2, 0.1);
            } else if (collision.type === 'player_hit') {
                if (this.player.takeDamage()) {
                    this.audio.playSound('damage');
                    this.screenShake(4, 0.2);

                    if (this.player.health <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }

        // Check bullet collisions
        const bulletCollision = this.enemies.checkBulletCollisions(this.player);
        if (bulletCollision) {
            if (bulletCollision.type === 'bullet_destroyed') {
                this.audio.playSound('enemy');
                this.score += 2; // Small bonus for destroying bullets
                this.particles.emit(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2,
                    6,
                    '#00FF00'
                );
            } else if (bulletCollision.type === 'player_hit_by_bullet') {
                if (this.player.takeDamage()) {
                    this.audio.playSound('damage');
                    this.screenShake(3, 0.15);

                    if (this.player.health <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }

        // Update player bullets
        this.playerBullets = this.playerBullets.filter(bullet => {
            if (bullet.dead) return false;
            if (bullet.x < this.camera.x - 50 || bullet.x > this.camera.x + this.width + 50) return false;

            bullet.update(dt);

            // Check collision with enemies
            for (let enemy of this.enemies.enemies) {
                if (enemy.dead) continue;

                if (CollisionDetector.checkAABB(bullet.getBounds(), enemy.getBounds())) {
                    bullet.dead = true;
                    const killed = enemy.takeDamage(1);
                    if (killed) {
                        this.audio.playSound('enemy');
                        this.score += enemy.points;
                        this.particles.emit(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            8,
                            '#00FF00'
                        );
                        this.screenShake(2, 0.1);
                    }
                    return false;
                }
            }

            // Check collision with enemy bullets
            for (let enemyBullet of this.enemies.bullets) {
                if (enemyBullet.dead) continue;

                if (CollisionDetector.checkAABB(bullet.getBounds(), enemyBullet.getBounds())) {
                    bullet.dead = true;
                    enemyBullet.dead = true;
                    this.particles.emit(
                        (bullet.x + enemyBullet.x) / 2,
                        (bullet.y + enemyBullet.y) / 2,
                        6,
                        '#FFFF00'
                    );
                    this.score += 2; // Bonus for shooting enemy bullets
                    return false;
                }
            }

            return true;
        });

        // Update stars
        this.stars.forEach(star => star.update(dt));

        // Check star collection
        for (let star of this.stars) {
            if (!star.collected && CollisionDetector.checkAABB(
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
                { x: star.x, y: star.y, width: star.width, height: star.height }
            )) {
                star.collected = true;
                this.score += 5;
                this.audio.playSound('star');
                this.particles.emit(star.x + 6, star.y + 6, 6, '#FFD700');
            }
        }

        // Spawn more stars
        this.spawnStars();

        // Update magazines
        this.magazines.forEach(mag => mag.update(dt));

        // Check magazine collection
        this.magazines = this.magazines.filter(mag => {
            if (mag.collected) return false;

            if (CollisionDetector.checkAABB(
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
                { x: mag.x, y: mag.y, width: mag.width, height: mag.height }
            )) {
                mag.collected = true;
                const ammoGained = Math.min(5, this.player.maxAmmo - this.player.ammo);
                this.player.ammo = Math.min(this.player.maxAmmo, this.player.ammo + 5);
                this.audio.playSound('star');
                this.particles.emit(mag.x + 8, mag.y + 6, 8, '#FFA500');
                return false;
            }

            // Remove magazines far behind camera
            if (mag.x < this.camera.x - 100) return false;

            return true;
        });

        // Spawn magazines based on distance
        if (this.player.x >= this.nextMagazineSpawn) {
            const suitablePlatforms = this.platforms.platforms.filter(p =>
                p.x > this.nextMagazineSpawn - 100 &&
                p.x < this.nextMagazineSpawn + 100 &&
                p.y < this.height - 50
            );

            if (suitablePlatforms.length > 0) {
                const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];
                this.magazines.push(new Magazine(
                    platform.x + Math.random() * Math.max(0, platform.width - 16),
                    platform.y - 30
                ));
            }

            // Schedule next magazine spawn
            this.nextMagazineSpawn += GameConfig.magazineSpawnDistance +
                (Math.random() * 2 - 1) * GameConfig.spawnVariance;
        }

        // Spawn hearts based on distance
        if (this.player.x >= this.nextHeartSpawn) {
            const suitablePlatforms = this.platforms.platforms.filter(p =>
                p.x > this.nextHeartSpawn - 100 &&
                p.x < this.nextHeartSpawn + 100 &&
                p.y < this.height - 50
            );

            if (suitablePlatforms.length > 0) {
                const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];
                this.hearts.push(new Heart(
                    platform.x + Math.random() * Math.max(0, platform.width - 16),
                    platform.y - 30
                ));
            }

            // Schedule next heart spawn
            this.nextHeartSpawn += GameConfig.heartSpawnDistance +
                (Math.random() * 2 - 1) * GameConfig.spawnVariance;
        }

        // Update hearts
        this.hearts.forEach(heart => heart.update(dt));

        // Check heart collection
        this.hearts = this.hearts.filter(heart => {
            if (heart.collected) return false;

            if (CollisionDetector.checkAABB(
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
                { x: heart.x, y: heart.y, width: heart.width, height: heart.height }
            )) {
                if (this.player.health < this.player.maxHealth) {
                    heart.collected = true;
                    this.player.health++;
                    this.audio.playSound('star'); // Reuse star sound for heart
                    this.particles.emit(heart.x + 8, heart.y + 8, 10, '#FF0000');
                    return false;
                }
            }

            // Remove hearts far behind camera
            if (heart.x < this.camera.x - 100) return false;

            return true;
        });

        // Update particles
        this.particles.update(dt);

        // Update distance
        this.distance = Math.floor(this.player.x / 10);

        // Update screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
        }
    }

    screenShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.playSound('death');
    }

    draw() {
        // Clear screen with gradient (Atari-style sky)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a0033');    // Deep purple at top
        gradient.addColorStop(0.5, '#2d1b4e'); // Purple middle
        gradient.addColorStop(1, '#4a2c5e');    // Lighter purple at bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'splash') {
            this.drawSplash();
            return;
        }

        if (this.state === 'gameover') {
            this.drawGameOver();
            return;
        }

        // Apply screen shake
        this.ctx.save();
        if (this.shakeTime > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }

        // Draw background stars (parallax, colorful)
        this.bgStars.forEach(star => {
            const parallaxX = star.x - this.camera.x * star.speed;
            if (parallaxX > -10 && parallaxX < this.width + 10) {
                this.ctx.fillStyle = star.color;
                this.ctx.fillRect(parallaxX, star.y, star.size, star.size);
                // Add twinkle effect
                if (Math.random() > 0.95) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(parallaxX, star.y, star.size, star.size);
                }
            }
        });

        // Draw platforms
        this.platforms.draw(this.ctx, this.camera);

        // Draw stars
        this.stars.forEach(star => star.draw(this.ctx, this.camera));

        // Draw magazines
        this.magazines.forEach(mag => mag.draw(this.ctx, this.camera));

        // Draw hearts
        this.hearts.forEach(heart => heart.draw(this.ctx, this.camera));

        // Draw enemies
        this.enemies.draw(this.ctx, this.camera);

        // Draw player bullets
        this.playerBullets.forEach(bullet => bullet.draw(this.ctx, this.camera));

        // Draw player
        this.player.draw(this.ctx, this.camera);

        // Draw particles
        this.particles.draw(this.ctx);

        this.ctx.restore();

        // Draw HUD
        this.drawHUD();

        // Draw pause overlay if paused
        if (this.state === 'paused') {
            this.drawPauseOverlay();
        }
    }

    drawSplash() {
        // Colorful starfield background
        this.bgStars.forEach(star => {
            const x = (star.x + this.splashTime * 20 * star.speed) % (this.width + 20) - 10;
            this.ctx.fillStyle = star.color;
            this.ctx.fillRect(x, star.y, star.size, star.size);
        });

        // Title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px "Courier New"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NINJA FOX', this.width / 2, 80);

        // Draw larger, better ninja fox
        this.ctx.save();
        this.ctx.translate(this.width / 2 - 24, 90);
        this.ctx.scale(2, 2);

        // Body (orange)
        this.ctx.fillStyle = '#FF6600';
        this.ctx.fillRect(6, 10, 12, 10);

        // Head (lighter orange)
        this.ctx.fillStyle = '#FF8833';
        this.ctx.fillRect(4, 4, 16, 8);

        // Ears
        this.ctx.fillRect(3, 2, 4, 3);
        this.ctx.fillRect(17, 2, 4, 3);
        this.ctx.fillStyle = '#FF6600';
        this.ctx.fillRect(4, 3, 2, 1);
        this.ctx.fillRect(18, 3, 2, 1);

        // Ninja headband
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(4, 6, 16, 3);

        // Eyes (white with pupils)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(8, 7, 3, 2);
        this.ctx.fillRect(13, 7, 3, 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(9, 7, 1, 2);
        this.ctx.fillRect(14, 7, 1, 2);

        // Snout
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(10, 10, 4, 2);

        // Legs
        this.ctx.fillStyle = '#FF6600';
        this.ctx.fillRect(8, 20, 3, 4);
        this.ctx.fillRect(13, 20, 3, 4);

        // Scarf (flowing)
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(9, 12, 6, 3);
        this.ctx.fillRect(15, 13, 3, 2);

        this.ctx.restore();

        // Instructions
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px "Courier New"';
        this.ctx.fillText('WASD - Move & Jump', this.width / 2, 160);
        this.ctx.fillText('. - Kick    / - Shoot', this.width / 2, 175);

        // Flashing start text
        if (Math.floor(this.splashTime * 2) % 2 === 0) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = 'bold 12px "Courier New"';
            this.ctx.fillText('PRESS SPACE TO START', this.width / 2, 200);
        }

        // Copyright
        this.ctx.fillStyle = '#888';
        this.ctx.font = '8px "Courier New"';
        this.ctx.fillText('© 2026 RoiN', this.width / 2, 230);
    }

    drawGameOver() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Game Over text with scanline effect
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 32px "Courier New"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 20);

        // Score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px "Courier New"';
        this.ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, this.width / 2, this.height / 2 + 20);
        this.ctx.fillText(`DISTANCE: ${this.distance}m`, this.width / 2, this.height / 2 + 40);

        // Retry text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Courier New"';
        this.ctx.fillText('PRESS SPACE TO RETRY', this.width / 2, this.height / 2 + 70);
    }

    drawPauseOverlay() {
        // Semi-transparent blur effect (simulated with checkerboard pattern)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Checkerboard pattern for blur effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 0; x < this.width; x += 4) {
            for (let y = 0; y < this.height; y += 4) {
                if ((x + y) % 8 === 0) {
                    this.ctx.fillRect(x, y, 2, 2);
                }
            }
        }

        // PAUSED text with glow effect
        this.ctx.save();
        this.ctx.textAlign = 'center';

        // Glow
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 40px "Courier New"';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);

        // Main text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);

        // Instructions
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '12px "Courier New"';
        this.ctx.fillText('PRESS SPACE TO RESUME', this.width / 2, this.height / 2 + 40);

        this.ctx.restore();
    }

    drawHUD() {
        // HUD background bar (Atari-style)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, 20);
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillRect(0, 20, this.width, 1);

        // Score with glow effect
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px "Courier New"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score.toString().padStart(6, '0')}`, 5, 14);

        // Ammo counter with bullet icon (before hearts)
        const ammoTextX = this.width - 60;
        const bulletIconX = this.width - 58;
        const ammoY = 6;

        // Draw bullet icon
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillRect(bulletIconX, ammoY + 3, 8, 4);
        this.ctx.fillRect(bulletIconX + 1, ammoY + 2, 6, 6);
        this.ctx.fillRect(bulletIconX + 2, ammoY + 1, 4, 8);

        // Bright core
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(bulletIconX + 3, ammoY + 4, 2, 2);

        // Ammo text
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillText(`${this.player.ammo}/${this.player.maxAmmo}`, ammoTextX, 14);

        // Health hearts (more vibrant)
        this.ctx.textAlign = 'right';
        for (let i = 0; i < this.player.maxHealth; i++) {
            const x = this.width - 10 - (i * 16);
            const y = 5;

            if (i < this.player.health) {
                // Full heart (bright red with highlight)
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(x, y, 3, 2);
                this.ctx.fillRect(x + 5, y, 3, 2);
                this.ctx.fillRect(x, y + 2, 8, 6);
                this.ctx.fillRect(x + 1, y + 8, 6, 2);
                this.ctx.fillRect(x + 2, y + 10, 4, 2);
                // White highlight
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(x + 1, y + 1, 1, 1);
                this.ctx.fillRect(x + 6, y + 1, 1, 1);
            } else {
                // Empty heart (dark)
                this.ctx.fillStyle = '#444444';
                this.ctx.fillRect(x, y, 3, 2);
                this.ctx.fillRect(x + 5, y, 3, 2);
                this.ctx.fillRect(x, y + 2, 8, 6);
                this.ctx.fillRect(x + 1, y + 8, 6, 2);
                this.ctx.fillRect(x + 2, y + 10, 4, 2);
            }
        }

        // Distance with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, this.height - 18, 60, 18);
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillText(`${this.distance}m`, 5, this.height - 5);
    }

    gameLoop(currentTime) {
        // Calculate delta time
        const frameTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Fixed timestep update
        this.accumulator += Math.min(frameTime, 0.1); // Cap to prevent spiral of death

        while (this.accumulator >= this.dt) {
            this.update(this.dt);
            this.accumulator -= this.dt;
        }

        // Render
        this.draw();

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});
