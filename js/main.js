// Main Game Loop and Initialization
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game dimensions
        this.width = 320;
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
        this.nextHeartScore = 100; // Next score milestone for heart restoration
        this.heartAnimation = null; // {x, y, time} for heart animation

        // Systems
        this.input = new InputHandler();
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();

        // Game objects
        this.player = null;
        this.platforms = null;
        this.enemies = null;
        this.stars = [];

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

        let scale;
        if (windowAspect > gameAspect) {
            scale = Math.floor(windowHeight / this.height);
        } else {
            scale = Math.floor(windowWidth / this.width);
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
        this.nextHeartScore = 100;
        this.heartAnimation = null;

        // Reset input state to prevent stuck keys
        this.input.reset();

        // Initialize game objects
        this.player = new Player(100, 100);
        this.platforms = new PlatformGenerator(this.width, this.height);
        this.enemies = new EnemyManager(this.platforms, this.height);
        this.stars = [];

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

            // Check for space to start
            if (this.input.isKeyPressed(' ')) {
                this.startGame();
            }
            return;
        }

        if (this.state === 'gameover') {
            // Check for space to retry - use key down instead of key pressed
            if (this.input.isKeyDown(' ')) {
                console.log("restarting!!")
                this.input.reset();
                this.startGame();
                console.log("restarted!!")
            }
            return;
        }

        if (this.state === 'paused') {
            // Check for space to unpause
            if (this.input.isKeyPressed(' ')) {
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
            this.audio.playSound(soundEffect);
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

        // Update particles
        this.particles.update(dt);

        // Update distance
        this.distance = Math.floor(this.player.x / 10);

        // Check for heart restoration every 100 points
        if (this.score >= this.nextHeartScore) {
            if (this.player.health < this.player.maxHealth) {
                this.player.health++;
                this.heartAnimation = {
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y,
                    time: 0
                };
                this.audio.playSound('star'); // Reuse star sound for heart
            }
            this.nextHeartScore += 100;
        }

        // Update heart animation
        if (this.heartAnimation) {
            this.heartAnimation.time += dt;
            if (this.heartAnimation.time > 1.0) {
                this.heartAnimation = null;
            }
        }

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

        // Draw enemies
        this.enemies.draw(this.ctx, this.camera);

        // Draw player
        this.player.draw(this.ctx, this.camera);

        // Draw particles
        this.particles.draw(this.ctx);

        // Draw heart animation
        if (this.heartAnimation) {
            const progress = this.heartAnimation.time / 1.0;
            const screenX = this.heartAnimation.x - this.camera.x;
            const screenY = this.heartAnimation.y - this.camera.y - (progress * 30); // Float upward
            const alpha = 1 - progress;

            this.ctx.save();
            this.ctx.globalAlpha = alpha;

            // Draw heart
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(screenX - 4, screenY, 3, 2);
            this.ctx.fillRect(screenX + 1, screenY, 3, 2);
            this.ctx.fillRect(screenX - 4, screenY + 2, 8, 6);
            this.ctx.fillRect(screenX - 3, screenY + 8, 6, 2);
            this.ctx.fillRect(screenX - 2, screenY + 10, 4, 2);

            // Highlight
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(screenX - 3, screenY + 1, 1, 1);
            this.ctx.fillRect(screenX + 2, screenY + 1, 1, 1);

            // +1 text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 10px "Courier New"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('+1', screenX, screenY - 5);

            this.ctx.restore();
        }

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
        this.ctx.fillText('. - Kick    / - Sword', this.width / 2, 175);

        // Flashing start text
        if (Math.floor(this.splashTime * 2) % 2 === 0) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = 'bold 12px "Courier New"';
            this.ctx.fillText('PRESS SPACE TO START', this.width / 2, 200);
        }

        // Copyright
        this.ctx.fillStyle = '#888';
        this.ctx.font = '8px "Courier New"';
        this.ctx.fillText('© 2026 Game Studio', this.width / 2, 230);
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
