# NINJA FOX - Game Design Document

## 1. Game Concept
Retro-style 2D platformer featuring a ninja fox running infinitely across 5 distinct stages, fighting enemies, avoiding obstacles, and collecting power-ups. 8-bit Atari aesthetic with procedural chiptune music and victory condition.

## 2. Controls
- **Keyboard**: A/D (move), W (jump/double jump), , (kick), . (shoot), Space (pause)
- **Mobile**: Virtual joystick (move), Jump button, A/B buttons (kick/shoot), Pause button
- **Cheat Code**: Type "iddqd" to toggle god mode (resets on death/restart)

## 3. Core Mechanics
- **Movement**: 120 px/s horizontal speed with smooth acceleration
- **Jump**: Single jump (-300 force), double jump available after first jump (max ~180px horizontal, ~56px vertical reach)
- **Combat**: Melee kick, ranged pistol (10 ammo, collectible magazines)
- **Health**: 3 hearts, collectible heart pickups, 1 second invulnerability after damage
- **Physics**: Gravity (800 px/s²), coyote time (0.1s), jump buffer (0.15s), ice sliding in stage 3+

## 4. Stages System (5 Stages)
- **Progression**: Every 500m (configurable via `GameConfig.stageDistance` in config.js, set to 100 for testing)
- **Notification**: "Stage X" displays for 1 second at top-center when entering new stage
- **HUD Indicator**: Shows "STAGE X/5" in top-left corner during gameplay
- **Victory**: Swirling portal appears at `(totalStages + 1) * stageDistance` meters (600m default) on dedicated 96px golden platform

## 5. Stage 1 - Tutorial Plains (0-100m)
- **Platforms**: Brown/tan colored, normal difficulty
- **Enemies**: Basic goblins (patrol, shoot normal speed), skulls (fly in sine wave)
- **Features**: Standard platforming, learn basic mechanics

## 6. Stage 2 - Purple Skies (100-200m)
- **Platforms**: Purple themed
- **Enemies**: Birds (fly in sine waves, drop poop projectiles when player nearby), Red Goblins (shoot 3x faster than normal goblins)
- **Challenge**: Aerial threats from above, faster projectiles

## 7. Stage 3 - Ice Caverns (200-300m)
- **Platforms**: Cyan/ice colored with reduced friction
- **Physics**: Slippery platforms using `iceBaseAcceleration` (0.5) and `iceAccelerationDecay` (0.9) from config
- **Challenge**: Precision movement on slick surfaces

## 8. Stage 4 - Moving Gardens (300-400m)
- **Platforms**: Green themed, 20% spawn as moving platforms
- **Moving Platforms**: Travel 40-90 pixels horizontally at 40 px/s, reverse at bounds, carry player via delta-position tracking
- **Spacing**: 32-64px gaps after moving platforms (tighter for double jump chaining), platforms never overlap. if two platforms collide, they both change direction.
- **Challenge**: Timing jumps to catch moving platforms, double jump chaining required

## 9. Stage 5 - Fire Realm (400-500m)
- **Platforms**: Red/fire themed, 40% spawn with fire obstacles
- **Fire**: 24px tall visible flames with multi-layer animation (red/orange/yellow/white), glow effects, rising ember particles
- **Layout**: 24px landing space + 32-64px fire + 24px+ landing space (can jump over fire)
- **Challenge**: Jump timing to clear fire obstacles (instant damage on touch)

## 10. Enemy Types & AI
- **Goblin**: Patrols platforms, shoots bullets at normal speed (2-4s interval), 30 points
- **RedGoblin**: Stage 2+, patrols faster (40 px/s), shoots 3x faster (0.67-1.33s interval), 50 points
- **Skull**: Flies in sine wave pattern, simple aerial threat, 40 points
- **Bird**: Stage 2+, flies in sine wave, drops poop when player within 150px, 2-4s poop interval, 60 points
- **Poop**: Brown projectile dropped by birds, falls with gravity acceleration, 6x6px hitbox

## 11. Platform Types & Generation
- **Solid**: Full collision (16px height), 30% spawn rate
- **One-way**: Jump through from below (8px height), 70% spawn rate
- **Moving**: Stage 4+ only, horizontal movement with visual arrows, delta tracking for player movement. if platform moves, the player moves on it. platforms cannot overlap. they cannot be spawned on the same location, and if they bomp each other, both just change direction. make sure that there is a time that platforms are near enough so that the player can jump between one to the next. 
- **Fire**: Stage 5+ only, solid platform with attached fire obstacle
- **Generation**: 2-5 tile gaps (32-80px), platforms reachable within jump range, no overlaps

## 12. God Mode (IDDQD Cheat Code)
- **Activation**: Type "iddqd" anywhere during gameplay (key sequence tracking with 1s timeout)
- **Toggle**: Type again to deactivate, automatically resets on death or game restart
- **Visual**: Rapid rainbow color cycling using HSL hue rotation (`Date.now() / 20` for 5x faster blinking)
- **Effects**: Invincible (no damage), instant-kill enemies/projectiles on touch, pass through fire harmlessly, bullets/poop disappear on contact
- **Audio**: Automatically switches to intense god mode music (C6-A6 range, 0.08-0.12s tempo)
- **Console**: Logs "🌈 GOD MODE ACTIVATED/DEACTIVATED! 🌈" and "🌈 GOD MODE - [action]" messages

## 13. Audio System (Web Audio API)
- **Normal Music**: Epic adventure melody (C5-G5 range, 0.2-0.6s duration) with bass line (C3-F3 triangle waves) and arpeggios (C4-G4 sine waves)
- **God Mode Music**: Fast intense melody (C6-A6 range, 0.08-0.12s duration, square waves) for adrenaline rush
- **Victory Music**: Triumphant fanfare (C5-C6 range with harmony fifths) that pauses background music
- **SFX**: Jump (200-400Hz sweep), land (100Hz thud), kick (150-50Hz sawtooth), sword (400-200Hz sawtooth), star (523-784Hz chime), enemy (300-50Hz), damage (400-100Hz), death (440-55Hz)
- **Controls**: Toggle music/SFX independently, `setGodMode(enabled)` switches music tracks

## 14. Game Architecture & Files
- **main.js**: Game class with loop, states (splash/playing/paused/gameover/victory), collision detection, stage progression, portal spawning, damage logging
- **player.js**: Player/PlayerBullet classes, movement physics, combat (kick/shoot), god mode visuals, ice physics, moving platform tracking
- **platform.js**: Platform/MovingPlatform/Fire/Portal classes, PlatformGenerator with stage-aware procedural generation
- **enemy.js**: Enemy/Goblin/RedGoblin/Skull/Bird/Poop/Bullet classes, AI behaviors, shooting mechanics
- **audio.js**: AudioManager with procedural music generation, god mode switching, victory fanfare, SFX oscillators
- **input.js**: InputHandler with keyboard/mobile input, cheat code detection (sequence tracking), god mode state
- **mobile.js**: MobileControls with virtual joystick and touch buttons
- **particle.js**: ParticleSystem for visual effects (star sparkles, enemy death, landing dust, fire embers)
- **collision.js**: AABB collision detection utilities
- **config.js**: GameConfig with stages settings, physics constants, difficulty scaling

## 15. Rendering (HTML5 Canvas)
- **Resolution**: 480x240 pixels, 2x scale for display, no image smoothing (crisp pixels)
- **Camera**: Smooth following with 0.1 lerp smoothing, centered on player X position
- **Background**: Parallax star field with 50 colorful Atari-style stars (white/gold/cyan/magenta/green)
- **Animations**: State-based sprite rendering (idle/run/jump/fall/kick/stab/hurt) with frame timing
- **Stage Themes**: Color palettes change per stage (brown/purple/cyan/green/red with highlights/shadows/strokes)
- **Effects**: Screen shake, particle systems, fire glow, portal swirl, rainbow god mode

## 16. Difficulty Scaling & Progression
- **Distance-based**: `difficultyLevel = distance / 100`, affects enemy spawn rates and platform gaps
- **Platform Gaps**: 2-5 tiles (32-80px horizontal), 48px max vertical difference, always within jump range
- **Enemy Spawning**: Increases with distance, stage-specific enemy types unlock
- **Stage Hazards**: Cumulative (stage 5 has ice physics + moving platforms + fire + all enemies)

## 17. Collectibles & Power-ups
- **Stars**: Yellow collectibles, +10 points, float above platforms with bobbing animation
- **Magazines**: Pistol ammo pickup, restores 10 bullets (max 20), spawns every 300-500m, 16x16px with "MAG" text
- **Hearts**: Health pickup, restores 1 heart (max 3), spawns every 500-700m, 16x16px pixel heart

## 18. Victory Condition & Portal
- **Spawn Distance**: `(GameConfig.totalStages + 1) * GameConfig.stageDistance` meters (600m with default settings)
- **Spawn Trigger**: When player reaches within 200px of portal distance and stage 5 is complete
- **Portal Platform**: Dedicated 96px wide golden/yellow platform created specifically for portal at exact spawn point
- **Portal Visual**: 48x64px swirling animated portal with multi-colored rotating particles (cyan/magenta/yellow)
- **Victory Trigger**: Player collision with portal hitbox transitions to victory state
- **Victory Screen**: Full-screen celebration with "VICTORY!" text, final score, distance traveled, stage completion count, continuous fireworks particles (multi-colored explosions), celebratory music fanfare, "PRESS SPACE TO PLAY AGAIN" prompt
- **Victory Behavior**: Game pauses on victory screen, does NOT auto-restart, only restarts when player presses Space or mobile button

## 19. Damage System & Death
- **Health**: 3 hearts max, visible in HUD as pixel art hearts (full/empty states)
- **Damage Sources**: Enemy contact (1 heart), bullets (1 heart), poop (1 heart), fire (1 heart)
- **Invulnerability**: 1 second after damage with visual flash effect, prevents multi-hit
- **Death Trigger**: Health reaches 0 or player falls below screen (Y > gameHeight + 50)
- **Detailed Logging**: Console logs all damage with emojis (💔 enemy, 💥 bullet, 💩 poop, 🔥 fire, ☠️ death with cause and distance)
- **Game Over**: State transitions to gameover, death sound plays, score displayed, restart prompt

## 20. Technical Features & Optimization
- **Fixed Timestep**: 60 FPS game loop with accumulator (1/60s dt) for consistent physics
- **Coyote Time**: 0.1s grace period after leaving platform for forgiving jumps
- **Jump Buffer**: 0.15s input buffer to queue jump commands before landing
- **Screen Shake**: Visual feedback for damage and impacts (shakeTime + shakeIntensity)
- **Responsive Design**: Canvas auto-scales to window size maintaining 2:1 aspect ratio
- **Mobile Optimization**: Touch controls auto-show on mobile devices, joystick position tracking
- **Performance**: Platform culling (despawn when < camera.x - 200), enemy limits (max 8 on screen)
- **Anti-Overlap**: Moving platforms use rightBound calculation (`x + width + moveDistance`) and sequential positioning to prevent overlaps
- **Object Pooling**: Particles, bullets reuse objects to minimize GC pressure

---

**Version**: 2.0
**Status**: Implemented & Playable
**Configuration**: Edit `js/config.js` to adjust stage distances, physics, and difficulty scaling
