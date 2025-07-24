/**
 * Global Audio Manager for handling sound effects across the application
 */
class AudioManager {
    constructor() {
        this.audioElements = new Map();
        this.audioEnabled = false;
        this.defaultVolume = 0.5;
        this.isInitialized = false;
    }

    /**
     * Initialize audio elements with their respective files
     * @param {Object} audioConfig - Configuration object with sound names and file paths
     * Example: { 'shuffle': '/src/assets/sounds/gallery_shuffle.mp3' }
     */
    initialize(audioConfig) {
        if (this.isInitialized) return;

        Object.entries(audioConfig).forEach(([name, filePath]) => {
            const audio = new Audio(filePath);
            audio.preload = 'auto';
            audio.volume = this.defaultVolume;
            this.audioElements.set(name, audio);
        });

        this.isInitialized = true;
        this.setupUserInteractionListeners();
    }

    /**
     * Set up listeners to enable audio after user interaction
     * This is required due to browser autoplay policies
     */
    setupUserInteractionListeners() {
        const enableAudioOnInteraction = () => {
            this.enableAudio();
            // Remove listeners after first interaction
            document.removeEventListener('click', enableAudioOnInteraction);
            document.removeEventListener('keydown', enableAudioOnInteraction);
            document.removeEventListener('touchstart', enableAudioOnInteraction);
        };

        document.addEventListener('click', enableAudioOnInteraction);
        document.addEventListener('keydown', enableAudioOnInteraction);
        document.addEventListener('touchstart', enableAudioOnInteraction);
    }

    /**
     * Enable audio playback by "unlocking" all audio elements
     * This bypasses browser autoplay restrictions after user interaction
     */
    async enableAudio() {
        if (this.audioEnabled || this.audioElements.size === 0) return;

        try {
            const unlockPromises = Array.from(this.audioElements.values()).map(audio => {
                return audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => {
                    // Ignore errors during unlock process
                });
            });

            await Promise.all(unlockPromises);
            this.audioEnabled = true;
            console.log('🔊 Audio enabled after user interaction');
        } catch (error) {
            console.warn('Could not enable audio:', error);
        }
    }

    /**
     * Play a sound by name
     * @param {string} soundName - The name of the sound to play
     * @param {Object} options - Optional settings
     * @param {number} options.volume - Volume override (0-1)
     * @param {boolean} options.loop - Whether to loop the sound
     * @param {number} options.startTime - Start time in seconds
     */
    play(soundName, options = {}) {
        const audio = this.audioElements.get(soundName);

        if (!audio) {
            console.warn(`🔇 Sound "${soundName}" not found`);
            return;
        }

        if (!this.audioEnabled) {
            console.log(`🔇 Audio not enabled yet for "${soundName}" - waiting for user interaction`);
            return;
        }

        try {
            // Reset audio to start (allows overlapping plays)
            audio.currentTime = options.startTime || 0;

            // Apply volume override if provided
            if (options.volume !== undefined) {
                audio.volume = Math.max(0, Math.min(1, options.volume));
            }

            // Apply loop setting
            if (options.loop !== undefined) {
                audio.loop = options.loop;
            }

            audio.play().catch(error => {
                console.warn(`🔇 Could not play "${soundName}":`, error);
            });
        } catch (error) {
            console.warn(`🔇 Error playing "${soundName}":`, error);
        }
    }

    /**
     * Stop a currently playing sound
     * @param {string} soundName - The name of the sound to stop
     */
    stop(soundName) {
        const audio = this.audioElements.get(soundName);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    /**
     * Set volume for a specific sound or all sounds
     * @param {number} volume - Volume level (0-1)
     * @param {string} soundName - Optional: specific sound name, if not provided affects all
     */
    setVolume(volume, soundName = null) {
        const normalizedVolume = Math.max(0, Math.min(1, volume));

        if (soundName) {
            const audio = this.audioElements.get(soundName);
            if (audio) {
                audio.volume = normalizedVolume;
            }
        } else {
            // Set volume for all sounds
            this.defaultVolume = normalizedVolume;
            this.audioElements.forEach(audio => {
                audio.volume = normalizedVolume;
            });
        }
    }

    /**
     * Check if audio is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.audioEnabled;
    }

    /**
     * Get list of available sound names
     * @returns {string[]}
     */
    getAvailableSounds() {
        return Array.from(this.audioElements.keys());
    }

    /**
     * Manually enable audio (useful for components that want to enable on specific interactions)
     */
    manuallyEnable() {
        this.enableAudio();
    }
}

// Create and export a singleton instance
export const audioManager = new AudioManager();

// Export the class as well for potential custom instances
export { AudioManager };
