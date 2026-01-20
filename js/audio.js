// Audio Manager
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.musicNode = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.createMusic();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // Generate 8-bit style chiptune music (Epic Atari adventure style)
    createMusic() {
        if (!this.audioContext) return;

        // Epic adventure melody - longer, more varied, less repetitive
        const melody = [
            // Section A - Heroic opening
            {note: 523, duration: 0.2}, // C5
            {note: 587, duration: 0.2}, // D5
            {note: 659, duration: 0.2}, // E5
            {note: 698, duration: 0.4}, // F5
            {note: 659, duration: 0.2}, // E5
            {note: 587, duration: 0.2}, // D5
            {note: 523, duration: 0.4}, // C5
            {note: 0, duration: 0.2},

            // Section B - Adventure continues
            {note: 440, duration: 0.2}, // A4
            {note: 494, duration: 0.2}, // B4
            {note: 523, duration: 0.2}, // C5
            {note: 587, duration: 0.4}, // D5
            {note: 523, duration: 0.2}, // C5
            {note: 494, duration: 0.2}, // B4
            {note: 440, duration: 0.4}, // A4
            {note: 0, duration: 0.2},

            // Section C - Climbing melody
            {note: 392, duration: 0.2}, // G4
            {note: 440, duration: 0.2}, // A4
            {note: 494, duration: 0.2}, // B4
            {note: 523, duration: 0.2}, // C5
            {note: 587, duration: 0.2}, // D5
            {note: 659, duration: 0.2}, // E5
            {note: 698, duration: 0.6}, // F5
            {note: 0, duration: 0.2},

            // Section D - Resolution
            {note: 784, duration: 0.3}, // G5
            {note: 659, duration: 0.3}, // E5
            {note: 523, duration: 0.3}, // C5
            {note: 392, duration: 0.6}, // G4
            {note: 0, duration: 0.4},
        ];

        // Bass line - creates depth and rhythm
        const bass = [
            {note: 131, duration: 0.4}, // C3
            {note: 0, duration: 0.2},
            {note: 165, duration: 0.4}, // E3
            {note: 0, duration: 0.2},
            {note: 196, duration: 0.4}, // G3
            {note: 0, duration: 0.2},
            {note: 175, duration: 0.4}, // F3
            {note: 0, duration: 0.2},
            {note: 147, duration: 0.4}, // D3
            {note: 0, duration: 0.2},
            {note: 131, duration: 0.4}, // C3
            {note: 0, duration: 0.2},
        ];

        // Arpeggio layer for richness
        const arp = [
            {note: 262, duration: 0.1}, // C4
            {note: 330, duration: 0.1}, // E4
            {note: 392, duration: 0.1}, // G4
            {note: 330, duration: 0.1}, // E4
        ];

        let melodyIndex = 0;
        let bassIndex = 0;
        let arpIndex = 0;

        const playMusic = () => {
            if (!this.musicEnabled) {
                setTimeout(playMusic, 100);
                return;
            }

            const currentNote = melody[melodyIndex];

            // Play melody note
            if (currentNote.note > 0) {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.value = currentNote.note;
                gainNode.gain.value = 0.07;

                osc.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                osc.start();
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + currentNote.duration);
                osc.stop(this.audioContext.currentTime + currentNote.duration);
            }

            // Play bass note
            if (melodyIndex % 2 === 0) {
                const bassNote = bass[bassIndex % bass.length];
                if (bassNote.note > 0) {
                    const bassOsc = this.audioContext.createOscillator();
                    const bassGain = this.audioContext.createGain();

                    bassOsc.type = 'triangle';
                    bassOsc.frequency.value = bassNote.note;
                    bassGain.gain.value = 0.05;

                    bassOsc.connect(bassGain);
                    bassGain.connect(this.audioContext.destination);

                    bassOsc.start();
                    bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + bassNote.duration);
                    bassOsc.stop(this.audioContext.currentTime + bassNote.duration);
                }
                bassIndex++;
            }

            // Play arpeggio occasionally for texture
            if (melodyIndex % 4 === 0 && currentNote.note > 0) {
                const arpNote = arp[arpIndex % arp.length];
                const arpOsc = this.audioContext.createOscillator();
                const arpGain = this.audioContext.createGain();

                arpOsc.type = 'sine';
                arpOsc.frequency.value = arpNote.note;
                arpGain.gain.value = 0.03;

                arpOsc.connect(arpGain);
                arpGain.connect(this.audioContext.destination);

                arpOsc.start();
                arpGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + arpNote.duration);
                arpOsc.stop(this.audioContext.currentTime + arpNote.duration);

                arpIndex++;
            }

            melodyIndex = (melodyIndex + 1) % melody.length;
            setTimeout(playMusic, currentNote.duration * 1000);
        };

        playMusic();
    }

    // Play sound effect
    playSound(type) {
        if (!this.audioContext || !this.sfxEnabled) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        switch(type) {
            case 'jump':
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'land':
                osc.type = 'sine';
                osc.frequency.value = 100;
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'kick':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'sword':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'star':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.05);
                osc.frequency.setValueAtTime(784, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'enemy':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'damage':
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'death':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(55, now + 1);
                gainNode.gain.setValueAtTime(0.5, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
                osc.start(now);
                osc.stop(now + 1);
                break;
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
    }
}
