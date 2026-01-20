# Ninja Fox Platformer - Game Design Document

## 1. Game Overview
- **Genre**: 8-bit side-scrolling platformer with continuous horizontal progression
- **Objective**: Maximize score by collecting stars and defeating enemies while avoiding death
- **Win Condition**: No end state - pure score-chasing arcade gameplay
- **Lose Condition**: Player dies (falls into pits or takes damage from enemies)

## 2. Visual Style
- **Art Style**: Authentic 8-bit pixel art (NES/Atari era aesthetic)
- **Color Palette**: Limited 16-color palette for retro authenticity
- **Resolution**: 320x240 base canvas, scaled up with nearest-neighbor to maintain crisp pixels
- **Animation**: 3-4 frame sprite animations for character actions
- **Background**: Parallax scrolling with 2 layers (distant mountains/clouds + near trees/bushes)

## 3. Player Character - Ninja Fox
- **Design**: Orange/red fox sprite with ninja headband and scarf
- **Size**: 16x16 pixels
- **States**: idle, running, jumping, falling, kicking, sword-stabbing, hurt, death
- **Health**: 3 hit points (displayed as hearts in HUD)
- **Movement Speed**: 120 pixels/second base, 180 pixels/second when running

## 4. Core Mechanics

### 4.1 Movement
- **Walk/Run**: W/A/S/D keys (A=left, D=right, W=jump, S=crouch/drop through platforms)
- **Jump**: Variable height based on hold duration (max 3 tiles high)
- **Gravity**: 800 pixels/second² for arcade-feel physics
- **Coyote Time**: 0.1 second grace period after leaving platform edges
- **Jump Buffer**: 0.15 second input buffering for responsive controls

### 4.2 Combat System
- **Jump Attack**: Landing on enemy from above (must hit top 25% of enemy hitbox)
- **Kick (Z key)**:
  - Swirling kick animation (360° spin)
  - 0.4 second duration, invulnerability during animation
  - Forward momentum boost (50 pixels)
  - Kills enemies on contact
- **Sword Stab (X key)**:
  - Quick forward thrust (16 pixel reach)
  - 0.3 second duration
  - Kills enemies in front arc
  - No invulnerability

### 4.3 Platform Types
- **Solid Platforms**: Full collision on all sides (ground level, thick platforms)
- **One-Way Platforms**: Can jump through from below, stand on top, drop through with S+Jump
- **Platform Density**: One platform every 2-5 tiles horizontally, varying heights

## 5. Enemies

### 5.1 Enemy Types
- **Goblin** (common): Walks back/forth on platforms, 1 HP, 10 points
- **Bat** (uncommon): Flies in sine wave pattern, 1 HP, 20 points
- **Armored Beetle** (rare): Slower but requires 2 hits or kick/sword to kill, 50 points

### 5.2 Enemy Spawn System
- Spawn off-screen to the right based on distance traveled
- Difficulty scaling: Enemy density increases every 500 pixels traveled
- Max 5 enemies on screen simultaneously

## 6. Collectibles
- **Stars**: Worth 5 points each, float above platforms with bobbing animation
- **Star Clusters**: Groups of 3-5 stars in challenging positions
- **Spawn Rate**: One star every 3-7 tiles on average

## 7. Controls Mapping
```
W = Jump (hold for higher jump)
A = Move Left
S = Drop through one-way platforms (when held with jump)
D = Move Right
Z = Swirly Ninja Kick
X = Sword Stab
SPACE = Start game from splash screen
ESC = Pause menu
```

## 8. User Interface

### 8.1 Splash Screen
- Title logo: "NINJA FOX" in blocky 8-bit font
- Pixelated ninja fox character art
- Flashing "PRESS SPACE TO START" text (0.5s interval)
- Copyright text: "© 2026 Game Studio"
- Starfield background animation

### 8.2 HUD (In-Game)
- **Top-Left**: Score (6 digits, leading zeros)
- **Top-Right**: Health hearts (3 max, pixel art hearts)
- **Distance Meter**: Bottom-left corner showing meters traveled

### 8.3 Game Over Screen
- "GAME OVER" text with scanline effect
- Final score display
- "Press SPACE to retry" prompt

## 9. Audio Design
- **Music**: Looping 8-bit chiptune soundtrack (upbeat tempo, NES-style square/triangle waves)
- **Sound Effects**:
  - Jump: short ascending beep
  - Land: soft thud
  - Kick: whoosh + impact
  - Sword: slash sound
  - Star collect: cheerful chime
  - Enemy defeat: explosion chirp
  - Damage taken: descending tone
  - Death: game over jingle

## 10. Technical Implementation

### 10.1 Technology Stack
- **HTML5 Canvas** for rendering
- **Vanilla JavaScript** (ES6+) for game logic
- **Web Audio API** for sound (with fallback)
- **No external game engines** - pure JS implementation

### 10.2 Architecture
- Entity-Component system for game objects
- Fixed timestep game loop (60 FPS target)
- Separate update/render phases
- Camera follows player with horizontal offset (player at 1/3 screen width)

### 10.3 File Structure
```
index.html          - Entry point
css/
  style.css         - Minimal styling
js/
  main.js           - Game initialization & loop
  player.js         - Player class
  enemy.js          - Enemy classes
  platform.js       - Platform generation
  particle.js       - Visual effects
  audio.js          - Sound manager
  input.js          - Keyboard handler
  collision.js      - Physics & collision detection
assets/
  sprites/          - PNG sprite sheets
  audio/            - OGG/MP3 sound files
```

## 11. Progression & Difficulty
- **Distance-Based Scaling**: Every 500 pixels increases enemy spawn rate by 10%
- **Platform Gaps**: Gradually increase in width (max 4 tiles)
- **No level cap**: Infinite runner style until death

## 12. Performance Targets
- 60 FPS on modern browsers (Chrome, Firefox, Safari)
- <100ms input latency
- <50MB total asset size
- Mobile-friendly (responsive canvas scaling)

## 13. Polish Features
- **Screen Shake**: On kick/sword attacks (2 pixels, 0.1s)
- **Particle Effects**: Star sparkles, enemy death puffs, landing dust
- **Sprite Flashing**: Invulnerability frames after taking damage (1 second)
- **Smooth Camera**: Lerp-based camera following (0.1 smoothing factor)

## 14. Accessibility
- **Colorblind Mode**: Option to change star color to yellow/blue
- **Sound Toggle**: Mute button for music/SFX separately
- **Keyboard-Only**: Fully playable without mouse

---

# Test Plan

## Unit Tests

### T1. Player Movement
- **T1.1**: W key makes player jump with correct velocity
- **T1.2**: A/D keys move player left/right at correct speed
- **T1.3**: Player cannot move beyond left screen boundary
- **T1.4**: Gravity applies correctly (player falls when airborne)
- **T1.5**: Coyote time allows jump within 0.1s of leaving platform

### T2. Combat Mechanics
- **T2.1**: Z key triggers kick animation and hitbox
- **T2.2**: X key triggers sword attack with correct reach
- **T2.3**: Kick provides invulnerability during animation
- **T2.4**: Jump attack works when landing on enemy from above
- **T2.5**: Sword attack only hits enemies in front arc

### T3. Platform Collision
- **T3.1**: Player stands on solid platforms
- **T3.2**: Player can jump through one-way platforms from below
- **T3.3**: S+Jump drops player through one-way platforms
- **T3.4**: Player collides with solid platform sides

### T4. Enemy Behavior
- **T4.1**: Goblin walks back/forth on platform correctly
- **T4.2**: Bat follows sine wave flight pattern
- **T4.3**: Armored Beetle requires 2 jump hits to defeat
- **T4.4**: Enemies despawn when off-screen to the left
- **T4.5**: Max 5 enemies enforced on screen

### T5. Scoring System
- **T5.1**: Stars add 5 points when collected
- **T5.2**: Goblin defeat adds 10 points
- **T5.3**: Bat defeat adds 20 points
- **T5.4**: Beetle defeat adds 50 points
- **T5.5**: Score persists across game session

### T6. Health & Death
- **T6.1**: Player starts with 3 hearts
- **T6.2**: Enemy contact reduces health by 1
- **T6.3**: Invulnerability frames prevent multi-hit
- **T6.4**: Death occurs at 0 health
- **T6.5**: Falling into pit triggers instant death

## Integration Tests

### T7. Game Flow
- **T7.1**: Splash screen displays on load
- **T7.2**: SPACE key transitions to gameplay
- **T7.3**: Game over screen shows on death
- **T7.4**: Retry returns to gameplay with reset state

### T8. Audio System
- **T8.1**: Music starts on game begin
- **T8.2**: All sound effects trigger correctly
- **T8.3**: Mute toggles work independently
- **T8.4**: Audio works across browsers (Chrome, Firefox, Safari)

### T9. Rendering
- **T9.1**: Canvas scales correctly on window resize
- **T9.2**: Pixel art maintains crisp edges (no blur)
- **T9.3**: Parallax background scrolls at correct speeds
- **T9.4**: HUD elements stay in fixed positions

### T10. Performance
- **T10.1**: Game maintains 60 FPS with 5 enemies + 10 stars
- **T10.2**: No memory leaks after 5 minutes of gameplay
- **T10.3**: Input responds within 100ms

## User Acceptance Tests

### T11. Playability
- **T11.1**: Player can reach 1000 points on first try
- **T11.2**: Controls feel responsive and intuitive
- **T11.3**: Difficulty curve feels fair (not too easy/hard in first 2 mins)
- **T11.4**: Visual clarity - enemies/platforms clearly distinguishable

### T12. 90s Aesthetic
- **T12.1**: Art style evokes NES/Atari era games
- **T12.2**: Music sounds authentically 8-bit
- **T12.3**: Color palette feels retro
- **T12.4**: Splash screen captures 90s game nostalgia

### T13. Cross-Browser
- **T13.1**: Game runs on Chrome (latest)
- **T13.2**: Game runs on Firefox (latest)
- **T13.3**: Game runs on Safari (latest)
- **T13.4**: Game runs on mobile browsers (touch controls not required)

---

**Document Version**: 1.0
**Status**: Awaiting Approval
**Next Steps**: Upon approval, begin implementation with splash screen & core game loop
