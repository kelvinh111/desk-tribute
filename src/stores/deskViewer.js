import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import itemsData from '../model/desk.json';

export const useDeskViewerStore = defineStore('deskViewer', () => {
    // Core data
    const desks = ref(itemsData);
    const selectedDeskId = ref(null);
    const hiddenDeskIds = ref(new Set());

    // Viewer states
    const isPhotoViewerVisible = ref(false);
    const isPhotoSliderVisible = ref(true);
    const isGalleryFaded = ref(false);
    const isCarouselLocked = ref(false);

    // Transition states for UI locking
    const isInitialPhotoLoading = ref(false); // Gallery desk clicked, waiting for first photo
    const isDeskSwitching = ref(false); // Desk switching in progress
    const isPhotoSliderTransitioning = ref(false); // Photo slider animating between slides

    // Clone management
    const selectedDeskClone = ref(null);

    // Window dimensions
    const windowWidth = ref(0);

    // Computed
    const selectedDesk = computed(() => {
        if (!selectedDeskId.value) return null;
        return desks.value.find(d => d.id === selectedDeskId.value);
    });

    const isLogoClickable = computed(() => {
        return !isInitialPhotoLoading.value &&
            !isDeskSwitching.value &&
            !isPhotoSliderTransitioning.value &&
            !isCarouselLocked.value;
    });

    const isDeskSliderInteractive = computed(() => {
        return !isInitialPhotoLoading.value &&
            !isDeskSwitching.value &&
            !isPhotoSliderTransitioning.value;
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
        windowWidth,
        isInitialPhotoLoading,
        isDeskSwitching,
        isPhotoSliderTransitioning,

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
        resetViewerState
    };
});
