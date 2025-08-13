import { logger } from './logger.js';

/**
 * Global Audio Manager for handling sound effects across the application
 * 
 * Provides centralized audio management with browser autoplay compliance,
 * global mute functionality, and optimized sound effect playback for
 * enhanced user experience throughout the desk gallery application.
 * 
 * Features:
 * - Browser autoplay policy compliance
 * - Global mute/unmute functionality
 * - Optimized audio preloading and caching
 * - Graceful fallback for audio loading failures
 * - User interaction detection for audio enablement
 */
class AudioManager {
    constructor() {
        this.audioElements = new Map();     // Stores all preloaded audio elements
        this.audioEnabled = false;          // Tracks if audio is enabled (autoplay compliance)
        this.defaultVolume = 0.5;           // Default volume level for all sounds
        this.isInitialized = false;         // Prevents duplicate initialization
        this.isMuted = false;               // Global mute state for user control
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
     * 
     * Modern browsers require user interaction before allowing audio playback
     * to prevent unwanted autoplay. This method sets up one-time listeners
     * that will enable audio on the first user interaction (click, key, touch).
     */
    setupUserInteractionListeners() {
        const enableAudioOnInteraction = () => {
            this.enableAudio();
            // Clean up listeners after first interaction to prevent memory leaks
            document.removeEventListener('click', enableAudioOnInteraction);
            document.removeEventListener('keydown', enableAudioOnInteraction);
            document.removeEventListener('touchstart', enableAudioOnInteraction);
        };

        // Listen for multiple interaction types to ensure cross-platform compatibility
        document.addEventListener('click', enableAudioOnInteraction);
        document.addEventListener('keydown', enableAudioOnInteraction);
        document.addEventListener('touchstart', enableAudioOnInteraction);
    }

    /**
     * Enable audio playback by "unlocking" all audio elements
     * 
     * This method bypasses browser autoplay restrictions by briefly playing
     * and immediately pausing each audio element after user interaction.
     * This "unlocks" the audio elements for future programmatic playback.
     */
    async enableAudio() {
        if (this.audioEnabled || this.audioElements.size === 0) return;

        try {
            // Create unlock promises for all audio elements
            const unlockPromises = Array.from(this.audioElements.values()).map(audio => {
                return audio.play().then(() => {
                    audio.pause();        // Immediately pause to avoid unwanted sound
                    audio.currentTime = 0; // Reset to beginning for future playback
                }).catch(() => {
                    // Silently ignore unlock failures - some browsers may still block
                });
            });

            await Promise.all(unlockPromises);
            this.audioEnabled = true;
            logger.log('Audio system unlocked and ready');
        } catch (error) {
            logger.warn('Could not enable audio:', error);
        }
    }

    /**
     * Play a sound effect by name with optional configuration
     * 
     * @param {string} soundName - The registered name of the sound to play
     * @param {Object} options - Optional playback configuration
     * @param {number} options.volume - Volume override (0-1), defaults to defaultVolume
     * @param {boolean} options.loop - Whether to loop the sound continuously
     * @param {number} options.startTime - Start playback from specific time in seconds
     * 
     * @example
     * // Basic usage
     * audioManager.play('gallery_click');
     * 
     * // With custom volume
     * audioManager.play('gallery_hover', { volume: 0.3 });
     * 
     * // Looping background sound
     * audioManager.play('ambient', { loop: true, volume: 0.2 });
     */
    play(soundName, options = {}) {
        // Respect global mute setting - early return for performance
        if (this.isMuted) {
            return;
        }

        const audio = this.audioElements.get(soundName);

        if (!audio) {
            logger.warn(`🔇 Sound "${soundName}" not found in audio registry`);
            return;
        }

        // Respect browser autoplay restrictions - fail silently if not unlocked
        if (!this.audioEnabled) {
            return;
        }

        try {
            // Reset audio to beginning to allow overlapping sound effects
            // This enables rapid-fire sounds like multiple hover effects
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
                logger.warn(`🔇 Could not play "${soundName}":`, error);
            });
        } catch (error) {
            logger.warn(`🔇 Error playing "${soundName}":`, error);
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
     * Set muted state
     * @param {boolean} muted - Whether to mute all sounds
     */
    setMuted(muted) {
        this.isMuted = muted;
    }

    /**
     * Toggle mute state
     * @returns {boolean} - New mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * Check if audio is muted
     * @returns {boolean}
     */
    isMutedState() {
        return this.isMuted;
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
