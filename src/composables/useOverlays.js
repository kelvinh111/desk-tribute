import { ref, computed } from 'vue';

/**
 * Overlay Management Composable
 * 
 * Manages the state and transitions of modal overlays (About, Submit Desk).
 * Ensures mutual exclusivity between overlays and coordinates with gallery
 * effects to provide a smooth user experience.
 * 
 * Features:
 * - Mutual exclusivity: only one overlay can be active at a time
 * - Automatic gallery effect coordination via callback
 * - Reactive state management for overlay visibility
 * 
 * @param {Function} onOverlayChange - Callback function triggered when overlay state changes
 *                                   Receives 'pause' or 'resume' to coordinate with gallery effects
 * @returns {Object} Overlay management functions and reactive state
 */
export function useOverlays(onOverlayChange) {

    // ==========================================
    // OVERLAY STATE MANAGEMENT
    // ==========================================

    /** @type {import('vue').Ref<boolean>} Controls About overlay visibility */
    const isAboutOverlayVisible = ref(false);

    /** @type {import('vue').Ref<boolean>} Controls Submit Desk overlay visibility */
    const isSubmitDeskOverlayVisible = ref(false);

    /**
     * Computed property indicating if any overlay is currently visible
     * 
     * Used throughout the application to determine if overlays are affecting
     * the UI state and whether certain interactions should be disabled.
     * 
     * @returns {boolean} True if any overlay is currently shown
     */
    const isAnyOverlayVisible = computed(() =>
        isAboutOverlayVisible.value || isSubmitDeskOverlayVisible.value
    );

    // ==========================================
    // OVERLAY CONTROL FUNCTIONS
    // ==========================================

    /**
     * Show the About overlay
     * 
     * Implements mutual exclusivity by automatically hiding the Submit overlay
     * if it's currently visible. Triggers gallery effect pause via callback.
     */
    function showAboutOverlay() {
        // Ensure mutual exclusivity - only one overlay at a time
        if (isSubmitDeskOverlayVisible.value) {
            isSubmitDeskOverlayVisible.value = false;
        }
        isAboutOverlayVisible.value = true;
        onOverlayChange?.('pause'); // Pause gallery effects while overlay is shown
    }

    /**
     * Hide the About overlay
     * 
     * Triggers gallery effect resume via callback, allowing automated
     * gallery effects to continue once the overlay is dismissed.
     */
    function hideAboutOverlay() {
        isAboutOverlayVisible.value = false;
        onOverlayChange?.('resume'); // Resume gallery effects when overlay is hidden
    }

    /**
     * Show the Submit Desk overlay
     * 
     * Implements mutual exclusivity by automatically hiding the About overlay
     * if it's currently visible. Triggers gallery effect pause via callback.
     */
    function showSubmitDeskOverlay() {
        // Ensure mutual exclusivity - only one overlay at a time
        if (isAboutOverlayVisible.value) {
            isAboutOverlayVisible.value = false;
        }
        isSubmitDeskOverlayVisible.value = true;
        onOverlayChange?.('pause'); // Pause gallery effects while overlay is shown
    }

    /**
     * Hide the Submit Desk overlay
     * 
     * Triggers gallery effect resume via callback, allowing automated
     * gallery effects to continue once the overlay is dismissed.
     */
    function hideSubmitDeskOverlay() {
        isSubmitDeskOverlayVisible.value = false;
        onOverlayChange?.('resume'); // Resume gallery effects when overlay is hidden
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        // Reactive state for overlay visibility
        isAboutOverlayVisible,          // About overlay visibility state
        isSubmitDeskOverlayVisible,     // Submit Desk overlay visibility state
        isAnyOverlayVisible,            // Computed: true if any overlay is visible

        // Overlay control functions
        showAboutOverlay,               // Show About overlay (with mutual exclusivity)
        hideAboutOverlay,               // Hide About overlay
        showSubmitDeskOverlay,          // Show Submit Desk overlay (with mutual exclusivity)
        hideSubmitDeskOverlay           // Hide Submit Desk overlay
    };
}
