import { ref, computed } from 'vue';

/**
 * Composable for managing overlay states
 * @param {Function} onOverlayChange - Callback when overlay state changes
 * @returns {Object} Overlay management functions and state
 */
export function useOverlays(onOverlayChange) {
    const isAboutOverlayVisible = ref(false);
    const isSubmitDeskOverlayVisible = ref(false);

    const isAnyOverlayVisible = computed(() =>
        isAboutOverlayVisible.value || isSubmitDeskOverlayVisible.value
    );

    /**
     * Show about overlay and hide submit overlay if visible
     */
    function showAboutOverlay() {
        if (isSubmitDeskOverlayVisible.value) {
            isSubmitDeskOverlayVisible.value = false;
        }
        isAboutOverlayVisible.value = true;
        onOverlayChange?.('pause');
    }

    /**
     * Hide about overlay
     */
    function hideAboutOverlay() {
        isAboutOverlayVisible.value = false;
        onOverlayChange?.('resume');
    }

    /**
     * Show submit desk overlay and hide about overlay if visible
     */
    function showSubmitDeskOverlay() {
        if (isAboutOverlayVisible.value) {
            isAboutOverlayVisible.value = false;
        }
        isSubmitDeskOverlayVisible.value = true;
        onOverlayChange?.('pause');
    }

    /**
     * Hide submit desk overlay
     */
    function hideSubmitDeskOverlay() {
        isSubmitDeskOverlayVisible.value = false;
        onOverlayChange?.('resume');
    }

    return {
        isAboutOverlayVisible,
        isSubmitDeskOverlayVisible,
        isAnyOverlayVisible,
        showAboutOverlay,
        hideAboutOverlay,
        showSubmitDeskOverlay,
        hideSubmitDeskOverlay
    };
}
