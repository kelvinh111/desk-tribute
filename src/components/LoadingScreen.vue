<template>
    <!-- 
        Loading screen with fade transitions
        - Uses 'appear' to animate on initial mount
        - Conditionally renders based on isLoading state
        - Covers entire viewport to prevent user interaction during loading
    -->
    <Transition
        name="loading-fade"
        appear
    >
        <div
            v-if="isLoading"
            class="loading-screen"
        >
            <!-- Real-time progress percentage display for user feedback -->
            <div class="progress-display">{{ Math.round(progress) }}%</div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import deskData from '../model/desk.json';

/**
 * LoadingScreen Component
 * 
 * Handles preloading of critical images before the main application starts.
 * Implements aggressive caching strategies to ensure smooth performance during
 * user interactions with desk gallery items and photo viewer transitions.
 * 
 * Emits: 'loading-complete' when all images are cached and fade-out completes
 */

// Define emitted events for parent component communication
const emit = defineEmits(['loading-complete']);

// Reactive state for controlling loading screen visibility and progress display
const isLoading = ref(true);  // Controls component visibility and CSS transitions
const progress = ref(0);      // Percentage value (0-100) for user feedback

async function preloadImages() {
    /**
     * Phase 1: Collect all critical images that need to be preloaded
     * This includes both desk screen thumbnails and first photos to ensure
     * smooth transitions when users interact with desk items
     */
    const imagesToLoad = [];

    deskData.forEach(desk => {
        // Add desk screen thumbnail image (shown in gallery grid)
        if (desk.screen && desk.screen.img) {
            imagesToLoad.push(desk.screen.img);
        }

        // Add first photo from each desk (used for screen flashing effect)
        if (desk.screen && desk.screen.firstPhoto) {
            imagesToLoad.push(desk.screen.firstPhoto);
        }
    });

    // Deduplicate URLs to avoid loading the same image multiple times
    // (some desks might share the same screen or first photo)
    const uniqueImages = [...new Set(imagesToLoad)];

    let loadedCount = 0;
    const totalImages = uniqueImages.length;

    // Handle edge case: if no images found, complete loading immediately
    if (totalImages === 0) {
        progress.value = 100;
        completeLoading();
        return;
    }

    /**
     * Phase 2: Preload each image with aggressive caching strategy
     * We use multiple caching techniques to ensure images are available
     * for both <img> tags and CSS background-image properties
     */
    const imagePromises = uniqueImages.map(imageUrl => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                /**
                 * Canvas caching: Force browser to fully decode and cache the image
                 * by drawing it to a canvas. This ensures instant availability for
                 * future use and prevents loading delays during animations.
                 */
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                /**
                 * CSS background-image caching: Create invisible DOM elements with
                 * background-image styles to force browser to cache images for CSS usage.
                 * This prevents flickering when images are used as background-image in
                 * gallery items and desk screens.
                 */
                const cacheDiv = document.createElement('div');
                cacheDiv.style.position = 'absolute';
                cacheDiv.style.top = '-9999px';        // Hide off-screen
                cacheDiv.style.left = '-9999px';       // Hide off-screen
                cacheDiv.style.width = '1px';
                cacheDiv.style.height = '1px';
                cacheDiv.style.backgroundImage = `url(${imageUrl})`;
                cacheDiv.style.backgroundSize = 'contain';
                cacheDiv.style.backgroundRepeat = 'no-repeat';
                document.body.appendChild(cacheDiv);

                // Update progress counter and percentage for user feedback
                loadedCount++;
                progress.value = (loadedCount / totalImages) * 100;
                resolve(img);
            };

            // Handle loading failures gracefully - don't block the entire loading process
            img.onerror = () => {
                console.warn(`Failed to load image: ${imageUrl}`);
                loadedCount++; // Still count as "processed" to maintain progress accuracy
                progress.value = (loadedCount / totalImages) * 100;
                resolve(null); // Resolve with null instead of rejecting to prevent blocking
            };

            // Trigger the actual image loading
            img.src = imageUrl;
        });
    });

    /**
     * Phase 3: Wait for all images to complete loading (success or failure)
     * Promise.all will resolve when every image has been processed, regardless
     * of individual success/failure status due to our error handling above
     */
    await Promise.all(imagePromises);

    // Brief pause to let users see the satisfying 100% completion
    // before starting the fade-out transition sequence
    setTimeout(() => {
        completeLoading();
    }, 200); // Short delay since completeLoading() handles additional timing
}

function completeLoading() {
    /**
     * Orchestrate the loading completion sequence with carefully timed delays:
     * 
     * 1. First delay (300ms): Allow users to see and appreciate the 100% completion
     *    This prevents the jarring experience of instant transitions and gives
     *    a sense of accomplishment for the loading process
     * 
     * 2. Set isLoading to false: Triggers the CSS fade-out transition
     * 
     * 3. Second delay (500ms): Wait for the fade-out animation to complete
     *    before emitting the event, ensuring smooth visual transitions
     * 
     * Total sequence time: ~800ms for a polished user experience
     */
    setTimeout(() => {
        isLoading.value = false; // Trigger fade-out transition

        // Wait for CSS transition to complete before notifying parent component
        setTimeout(() => {
            emit('loading-complete');
        }, 500); // Must match the .loading-fade-leave-active transition duration
    }, 300); // Brief pause to showcase 100% completion state
}

// Initialize image preloading process when component mounts
// This ensures images start loading as early as possible in the app lifecycle
onMounted(() => {
    preloadImages();
});
</script>

<style scoped>
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #E8E8E8;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.progress-display {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    font-family: system-ui, -apple-system, sans-serif;
}

/* Fade transition styles */
.loading-fade-enter-active {
    transition: opacity 0.3s ease-in;
}

.loading-fade-leave-active {
    transition: opacity 0.5s ease-out;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
    opacity: 0;
}

.loading-fade-enter-to,
.loading-fade-leave-from {
    opacity: 1;
}
</style>
