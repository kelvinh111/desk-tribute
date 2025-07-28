import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import itemsData from '../model/desk.json';

/**
 * Desk Viewer Store - Central State Management
 * 
 * Manages all state related to the desk gallery application including:
 * - Gallery and photo viewer states
 * - Desk selection and cloning for animations
 * - UI interaction locks and transition states
 * - Photo viewer readiness and loading states
 * 
 * This store ensures coordinated state management across the complex
 * animation sequences and user interactions in the application.
 */
export const useDeskViewerStore = defineStore('deskViewer', () => {

    // ==========================================
    // CORE DATA & DESK MANAGEMENT
    // ==========================================

    /** @type {import('vue').Ref<Array>} Raw desk data from JSON file */
    const desks = ref(itemsData);

    /** @type {import('vue').Ref<number|null>} Currently selected desk ID for photo viewing */
    const selectedDeskId = ref(null);

    /** @type {import('vue').Ref<Set<number>>} Set of desk IDs that are temporarily hidden during animations */
    const hiddenDeskIds = ref(new Set());

    // ==========================================
    // VIEWER & DISPLAY STATES
    // ==========================================

    /** @type {import('vue').Ref<boolean>} Controls PhotoViewer component visibility */
    const isPhotoViewerVisible = ref(false);

    /** @type {import('vue').Ref<boolean>} Controls photo slider visibility within PhotoViewer */
    const isPhotoSliderVisible = ref(true);

    /** @type {import('vue').Ref<boolean>} Controls gallery fade effect during desk selection */
    const isGalleryFaded = ref(false);

    /** @type {import('vue').Ref<boolean>} Locks photo carousel during critical animations */
    const isCarouselLocked = ref(false);

    // ==========================================
    // TRANSITION & LOADING STATES
    // UI locking mechanism to prevent user interactions during critical animations
    // ==========================================

    /** @type {import('vue').Ref<boolean>} Gallery desk clicked, waiting for first photo to load */
    const isInitialPhotoLoading = ref(false);

    /** @type {import('vue').Ref<boolean>} Desk switching operation in progress (prevents UI interactions) */
    const isDeskSwitching = ref(false);

    /** @type {import('vue').Ref<boolean>} Photo slider animating between slides */
    const isPhotoSliderTransitioning = ref(false);

    /** @type {import('vue').Ref<boolean>} PhotoViewer slider is fully loaded and ready for interaction */
    const isPhotoViewerReady = ref(false);

    // ==========================================
    // ANIMATION & EFFECT MANAGEMENT
    // ==========================================

    /** @type {import('vue').Ref<Object|null>} Stores cloned desk element data for pop-in/pop-out animations */
    const selectedDeskClone = ref(null);

    /** @type {import('vue').Ref<Object|null>} Pending screen flashing effect data for desk transitions */
    const pendingFlashEffect = ref(null);

    // ==========================================
    // RESPONSIVE & LAYOUT DATA
    // ==========================================

    /** @type {import('vue').Ref<number>} Current window width for responsive calculations */
    const windowWidth = ref(0);

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================

    /**
     * Get the currently selected desk object
     * @returns {Object|null} The desk object matching selectedDeskId, or null if none selected
     */
    const selectedDesk = computed(() => {
        if (!selectedDeskId.value) return null;
        return desks.value.find(d => d.id === selectedDeskId.value);
    });

    /**
     * Determine if the logo/header should respond to clicks
     * 
     * The logo is clickable only when no critical operations are in progress.
     * This prevents users from interrupting animations or loading sequences
     * that could leave the UI in an inconsistent state.
     * 
     * @returns {boolean} True if logo should respond to clicks
     */
    const isLogoClickable = computed(() => {
        return !isInitialPhotoLoading.value &&
            !isDeskSwitching.value &&
            !isPhotoSliderTransitioning.value &&
            !isCarouselLocked.value;
    });

    /**
     * Determine if the desk slider should accept user interactions
     * 
     * The desk slider becomes interactive when:
     * - No critical loading/switching operations are active
     * - PhotoViewer is either ready for interaction OR not visible at all
     * 
     * This ensures smooth user experience during complex state transitions.
     * 
     * @returns {boolean} True if desk slider should respond to user input
     */
    const isDeskSliderInteractive = computed(() => {
        return !isInitialPhotoLoading.value &&
            !isDeskSwitching.value &&
            !isPhotoSliderTransitioning.value &&
            (isPhotoViewerReady.value || !isPhotoViewerVisible.value);
    });

    // Actions
    function setSelectedDeskId(id) {
        selectedDeskId.value = id;
    }

    function setPhotoViewerVisible(visible) {
        isPhotoViewerVisible.value = visible;
    }

    function setPhotoSliderVisible(visible) {
        isPhotoSliderVisible.value = visible;
    }

    function setGalleryFaded(faded) {
        isGalleryFaded.value = faded;
    }

    function setCarouselLocked(locked) {
        isCarouselLocked.value = locked;
    }

    function setSelectedDeskClone(clone) {
        selectedDeskClone.value = clone;
    }

    function addHiddenDeskId(id) {
        hiddenDeskIds.value.add(id);
    }

    function clearHiddenDeskIds() {
        hiddenDeskIds.value.clear();
    }

    function setWindowWidth(width) {
        windowWidth.value = width;
    }

    function setInitialPhotoLoading(loading) {
        isInitialPhotoLoading.value = loading;
    }

    function setDeskSwitching(switching) {
        isDeskSwitching.value = switching;
    }

    function setPhotoSliderTransitioning(transitioning) {
        isPhotoSliderTransitioning.value = transitioning;
    }

    function setPhotoViewerReady(ready) {
        isPhotoViewerReady.value = ready;
    }

    function setPendingFlashEffect(flashData) {
        pendingFlashEffect.value = flashData;
    }

    function resetViewerState() {
        selectedDeskId.value = null;
        selectedDeskClone.value = null;
        isPhotoViewerVisible.value = false;
        isPhotoSliderVisible.value = true;
        isGalleryFaded.value = false;
        isCarouselLocked.value = false;
        isInitialPhotoLoading.value = false;
        isDeskSwitching.value = false;
        isPhotoSliderTransitioning.value = false;
        isPhotoViewerReady.value = false;
        pendingFlashEffect.value = null;
        clearHiddenDeskIds();
    } return {
        // State
        desks,
        selectedDeskId,
        hiddenDeskIds,
        isPhotoViewerVisible,
        isPhotoSliderVisible,
        isGalleryFaded,
        isCarouselLocked,
        selectedDeskClone,
        pendingFlashEffect,
        windowWidth,
        isInitialPhotoLoading,
        isDeskSwitching,
        isPhotoSliderTransitioning,
        isPhotoViewerReady,

        // Computed
        selectedDesk,
        isLogoClickable,
        isDeskSliderInteractive,

        // Actions
        setSelectedDeskId,
        setPhotoViewerVisible,
        setPhotoSliderVisible,
        setGalleryFaded,
        setCarouselLocked,
        setSelectedDeskClone,
        addHiddenDeskId,
        clearHiddenDeskIds,
        setWindowWidth,
        setInitialPhotoLoading,
        setDeskSwitching,
        setPhotoSliderTransitioning,
        setPhotoViewerReady,
        setPendingFlashEffect,
        resetViewerState
    };
});
