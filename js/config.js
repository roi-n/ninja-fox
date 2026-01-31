// Game Configuration
const GameConfig = {
    // Game version
    version: 'v1.0.0',

    // Pickup spawn distances (in pixels)
    magazineSpawnDistance: 1000,  // Spawn magazine every ~1000 pixels
    heartSpawnDistance: 2000,     // Spawn heart every ~2000 pixels

    // Spawn variance (adds randomness to spawn distances)
    spawnVariance: 500,          // Random offset: -500 to +500 pixels

    // Difficulty progression
    difficultyInterval: 500,     // Increase difficulty every 500m (adjustable for testing)

    // Difficulty thresholds (in meters)
    redGoblinDistance: 500,      // Red goblins appear at 500m+
    birdDistance: 1000,          // Birds appear at 1000m+
    fireDistance: 1500,          // Fire obstacles at 1500m+
    movingPlatformDistance: 2000, // Moving platforms at 2000m+

    // Ice physics scaling
    iceBaseAcceleration: 400,    // Base acceleration on ice
    iceAccelerationDecay: 0.9,   // Multiply by this per difficulty level (gets slipperier)

    // Debug settings
    debugMobileControlsOnPC: false, // Show mobile controls on PC for debugging

    // Stages mode
    stagesMode: true,               // Enable stages progression (false = continuous difficulty)
    stageDistance: 100,             // Distance in meters for each stage (adjustable for testing)
    totalStages: 5,                 // Total number of stages before victory
};
