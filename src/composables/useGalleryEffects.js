import { ref } from 'vue';

/**
 * Composable for managing gallery effects
 * @param {Object} galleryRef - Reference to the gallery component
 * @returns {Object} Gallery effects management functions
 */
export function useGalleryEffects(galleryRef) {
    const shouldGalleryEffectsRun = ref(true);

    /**
     * Pause gallery effects
     */
    function pauseEffects() {
        galleryRef.value?.pauseGalleryEffects?.();
    }

    /**
     * Resume gallery effects if conditions are met
     * @param {boolean} isAnyOverlayVisible - Whether any overlay is visible
     * @param {boolean} isPhotoViewerVisible - Whether photo viewer is visible
     */
    function resumeEffects(isAnyOverlayVisible, isPhotoViewerVisible) {
        if (!isAnyOverlayVisible && !isPhotoViewerVisible) {
            galleryRef.value?.resumeGalleryEffects?.();
        }
    }

    /**
     * Enable or disable gallery effects
     * @param {boolean} enabled - Whether effects should be enabled
     */
    function setEffectsEnabled(enabled) {
        shouldGalleryEffectsRun.value = enabled;
    }

    return {
        shouldGalleryEffectsRun,
        pauseEffects,
        resumeEffects,
        setEffectsEnabled
    };
}
