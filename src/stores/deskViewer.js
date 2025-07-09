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

    // Clone management
    const selectedDeskClone = ref(null);

    // Window dimensions
    const windowWidth = ref(0);

    // Computed
    const selectedDesk = computed(() => {
        if (!selectedDeskId.value) return null;
        return desks.value.find(d => d.id === selectedDeskId.value);
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

    function resetViewerState() {
        selectedDeskId.value = null;
        selectedDeskClone.value = null;
        isPhotoViewerVisible.value = false;
        isPhotoSliderVisible.value = true;
        isGalleryFaded.value = false;
        isCarouselLocked.value = false;
        clearHiddenDeskIds();
    }

    return {
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

        // Computed
        selectedDesk,

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
        resetViewerState
    };
});
