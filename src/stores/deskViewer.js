import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabase.js';

/**
 * Configuration Flag - Toggle Data Source
 * Set to true to use local desk.json file
 * Set to false to use Supabase API
 */
const USE_LOCAL_DATA = true;

/**
 * API Configuration - Choose your API endpoint
 * 'remote' - Use hosted Supabase (requires deployed functions)
 * 'local' - Use local Supabase (requires `supabase start`)
 * 'fallback' - Always use local JSON data
 */
const API_MODE = 'remote'; // 'remote', 'local', or 'fallback'

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

    /** @type {import('vue').Ref<Array>} Desk data from Supabase API */
    const desks = ref([]);

    /** @type {import('vue').Ref<boolean>} Whether desk data is currently being loaded */
    const isDesksLoading = ref(false);

    /** @type {import('vue').Ref<string|null>} Error message if desk loading fails */
    const desksLoadingError = ref(null);

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
    }

    /**
     * Fetch desk data from Supabase API or local JSON based on configuration flag
     * @returns {Promise<void>}
     */
    async function fetchDesks() {
        if (isDesksLoading.value) return; // Prevent multiple simultaneous requests

        isDesksLoading.value = true;
        desksLoadingError.value = null;

        try {
            // Check configuration flag to determine data source
            if (USE_LOCAL_DATA || API_MODE === 'fallback') {
                console.log('Using local desk data (USE_LOCAL_DATA = true or API_MODE = fallback)...');
                const fallbackData = await import('../model/desk.json');
                const localDesks = fallbackData.default || fallbackData;
                desks.value = localDesks;
                console.log('Successfully loaded', localDesks.length, 'desks from local JSON file');
                return;
            }

            // Determine API URL based on mode
            let apiUrl;
            if (API_MODE === 'local') {
                // Local Supabase development server (requires `supabase start`)
                apiUrl = 'http://127.0.0.1:54321/functions/v1/get-desks';
                console.log('Using local Supabase development server...');
            } else {
                // Remote Supabase (hosted)
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uedlyafexdgfdqkjkygr.supabase.co';
                apiUrl = `${supabaseUrl}/functions/v1/get-desks`;
                console.log('Using remote Supabase API...');
            }

            console.log('Fetching desk data from:', apiUrl);

            // Use a timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                signal: controller.signal,
                mode: 'cors', // Explicitly request CORS
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                throw new Error(`API responded with ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Raw API response:', data);

            // Add slugs and default values for routing and component compatibility
            const desksWithSlugs = data.map(desk => ({
                ...desk,
                // Ensure required fields have default values
                decor: desk.decor || "/src/assets/decor.svg",
                monitor: desk.monitor || {
                    width: "37.54%",
                    height: "21.82%",
                    x: "20.70%",
                    y: "61.82%",
                    img: "/src/assets/monitor.svg"
                },
                screen: desk.screen || {
                    width: "25.26%",
                    height: "16.36%",
                    x: "27.02%",
                    y: "63.27%",
                    firstPhoto: desk.photos?.[0] || "/src/assets/800x400.jpg"
                },
                slug: desk.slug || desk.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            }));

            desks.value = desksWithSlugs;
            console.log('Successfully loaded', desksWithSlugs.length, 'desks from Supabase API');

        } catch (error) {
            console.error('API request failed:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            // Fall back to local JSON data on any error (CORS, timeout, network, etc.)
            if (!USE_LOCAL_DATA && API_MODE !== 'fallback') {
                try {
                    console.log('API failed, falling back to local desk data...');
                    const fallbackData = await import('../model/desk.json');
                    const localDesks = fallbackData.default || fallbackData;
                    desks.value = localDesks;
                    console.log('Successfully loaded', localDesks.length, 'desks from local fallback');

                    // Set a user-friendly error message
                    desksLoadingError.value = `API unavailable (${error.message}), using local data`;
                } catch (fallbackError) {
                    console.error('Failed to load fallback data:', fallbackError);
                    desksLoadingError.value = 'Failed to load desk data from both API and local sources';
                    desks.value = [];
                }
            } else {
                // If we were already trying to use local data and it failed
                console.error('Failed to load local desk data:', error);
                desksLoadingError.value = 'Failed to load local desk data';
                desks.value = [];
            }
        } finally {
            isDesksLoading.value = false;
        }
    }

    return {
        // State
        desks,
        isDesksLoading,
        desksLoadingError,
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
        fetchDesks,
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
