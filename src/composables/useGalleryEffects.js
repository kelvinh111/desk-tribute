import { ref } from 'vue';

/**
 * Gallery Effects Composable
 * 
 * Manages the automated gallery effects including desk shuffling, jumping animations,
 * and visual effects. Provides centralized control for pausing/resuming effects
 * based on application state (overlays, photo viewer, etc.).
 * 
 * @param {import('vue').Ref} galleryRef - Reference to the DeskGallery component
 * @returns {Object} Gallery effects management functions and state
 */
export function useGalleryEffects(galleryRef) {

    /** @type {import('vue').Ref<boolean>} Controls whether gallery effects should be active */
    const shouldGalleryEffectsRun = ref(true);

    /**
     * Pause all gallery effects immediately
     * 
     * Calls the gallery component's pause method to stop automated
     * effects like desk shuffling and jump animations. Used when
     * overlays are shown or photo viewer is active.
     */
    function pauseEffects() {
        galleryRef.value?.pauseGalleryEffects?.();
    }

    /**
     * Resume gallery effects conditionally
     * 
     * Only resumes effects if both overlay and photo viewer are not visible.
     * This ensures effects don't interfere with user interactions or
     * distract from focused content viewing.
     * 
     * @param {boolean} isAnyOverlayVisible - Whether any modal overlay is currently shown
     * @param {boolean} isPhotoViewerVisible - Whether the photo viewer is currently active
     */
    function resumeEffects(isAnyOverlayVisible, isPhotoViewerVisible) {
        if (!isAnyOverlayVisible && !isPhotoViewerVisible) {
            galleryRef.value?.resumeGalleryEffects?.();
        }
    }

    /**
     * Enable or disable gallery effects entirely
     * 
     * Sets the master control flag for whether effects should run.
     * When disabled, effects will not automatically resume even
     * when conditions would normally allow it.
     * 
     * @param {boolean} enabled - Whether effects should be enabled
     */
    function setEffectsEnabled(enabled) {
        shouldGalleryEffectsRun.value = enabled;
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        shouldGalleryEffectsRun,  // Reactive flag indicating if effects should run
        pauseEffects,             // Immediately pause all gallery effects
        resumeEffects,            // Conditionally resume effects based on app state
        setEffectsEnabled         // Master control for enabling/disabling effects
    };
}
