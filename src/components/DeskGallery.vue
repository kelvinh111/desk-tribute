<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue';
import Masonry from 'masonry-layout';
import { audioManager } from '../utils/audioManager.js';

/**
 * DeskGallery Component
 * 
 * Main gallery component that displays desk items in a responsive Masonry layout.
 * Features automated visual effects including desk shuffling, jump animations,
 * and responsive grid management. Handles complex state management for desk
 * selection animations and clone element coordination.
 * 
 * Key Features:
 * - Responsive Masonry grid layout
 * - Automated desk shuffling and jump effects
 * - Smooth fade transitions during desk selection
 * - Clone element management for pop-in/pop-out animations
 * - Audio feedback for user interactions
 * - Lifecycle management for interval-based effects
 */

// ==========================================
// COMPONENT PROPS & EMITS
// ==========================================

const props = defineProps({
    /** @type {Array} Array of desk objects to display in the gallery */
    desks: Array,

    /** @type {boolean} Controls gallery fade effect during desk selection */
    isGalleryFaded: Boolean,

    /** @type {Object|null} Clone data for desk pop-in/pop-out animations */
    selectedDeskClone: Object,

    /** @type {boolean} Master control for whether automated effects should run */
    shouldStartEffects: {
        type: Boolean,
        default: true
    }
});

/** Emitted when a desk item is clicked/selected */
const emit = defineEmits(['pick']);

// ==========================================
// LAYOUT & TIMING CONSTANTS
// ==========================================

/** @type {number} Width of each column in the Masonry grid layout (pixels) */
const COLUMN_WIDTH = 285;

/** @type {number} Spacing between gallery items in the Masonry layout (pixels) */
const GUTTER = 35;

/** @type {number} Interval for desk cycling/shuffling effect (milliseconds) */
const CYCLE_INTERVAL = 8000; // 8 seconds

/** @type {number} Interval for individual desk jump animations (milliseconds) */
const JUMP_INTERVAL = 2000; // 2 seconds

// ==========================================
// COMPONENT STATE & REFS
// ==========================================

/** @type {import('vue').Ref} Reference to the main gallery DOM element */
const galleryRef = ref(null);

/** @type {Masonry|null} Masonry layout instance for responsive grid management */
let masonryInstance = null;

/** @type {import('vue').Ref<number>} Current window width for responsive calculations */
const windowWidth = ref(window.innerWidth);

/** @type {number|null} Interval ID for desk cycling effect */
let cycleInterval = null;

/** @type {number|null} Interval ID for desk jump animations */
let jumpInterval = null;

/** @type {number} Counter to track jump intervals and detect cycle timing */
let jumpCounter = 0;

/** @type {number|null} ID of the last desk that performed a jump animation */
let lastJumpedDeskId = null;

/** @type {import('vue').Ref<Array>} Reactive copy of desks array for manipulation during effects */
const displayDesks = ref([]);

// ==========================================
// TOUCH HANDLING FOR MOBILE SWIPE
// ==========================================

/** @type {import('vue').Ref<number>} Touch start X coordinate */
const touchStartX = ref(0);

/** @type {import('vue').Ref<number>} Touch start Y coordinate */
const touchStartY = ref(0);

/** @type {import('vue').Ref<number>} Current scroll position for swipe navigation */
const currentScrollX = ref(0);

/**
 * Handle touch start for swipe navigation
 * @param {TouchEvent} event - Touch start event
 */
function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
    currentScrollX.value = galleryRef.value ? galleryRef.value.scrollLeft : 0;
}

/**
 * Handle touch end for swipe navigation
 * @param {TouchEvent} event - Touch end event
 */
function handleTouchEnd(event) {
    if (!touchStartX.value || !touchStartY.value) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.value;
    const deltaY = touch.clientY - touchStartY.value;

    // Reset touch coordinates
    touchStartX.value = 0;
    touchStartY.value = 0;

    // Only handle horizontal swipes (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (galleryRef.value) {
            const scrollAmount = 300; // Amount to scroll per swipe

            if (deltaX > 0) {
                // Swipe right - scroll left
                galleryRef.value.scrollTo({
                    left: Math.max(0, galleryRef.value.scrollLeft - scrollAmount),
                    behavior: 'smooth'
                });
            } else {
                // Swipe left - scroll right
                galleryRef.value.scrollTo({
                    left: galleryRef.value.scrollLeft + scrollAmount,
                    behavior: 'smooth'
                });
            }
        }
    }
}

// ==========================================
// GALLERY DATA MANAGEMENT
// ==========================================

/**
 * Initialize the display desks array from props
 * 
 * Creates a reactive copy of the props.desks array that can be manipulated
 * for visual effects like shuffling without affecting the original data.
 */
const initializeDisplayDesks = () => {
    if (props.desks && props.desks.length > 0) {
        displayDesks.value = [...props.desks];
    }
};

// ==========================================
// AUTOMATED EFFECTS - CYCLING
// ==========================================

/**
 * Cycle desk order by moving the last desk to the beginning
 * 
 * This creates a smooth shuffling effect where desks continuously
 * reorder themselves. The Masonry layout is refreshed after each
 * cycle to maintain proper positioning.
 */
const cycleDeskOrder = () => {
    if (displayDesks.value.length > 1) {
        // Move last desk to beginning of array
        const lastDesk = displayDesks.value.pop();
        displayDesks.value.unshift(lastDesk);

        // Provide audio feedback for the shuffle
        audioManager.play('gallery_shuffle');

        // Update Masonry layout to reflect new order
        nextTick(() => {
            if (masonryInstance) {
                masonryInstance.reloadItems();  // Refresh item references
                masonryInstance.layout();       // Recalculate and animate positions
            }
        });
    }

    // Note: Jump counter continues its natural progression independently
};

/**
 * Start the automated desk cycling interval
 * 
 * Initiates the background process that continuously reorders desks
 * to create dynamic visual interest in the gallery.
 */
const startCycling = () => {
    if (cycleInterval) {
        clearInterval(cycleInterval);
    }
    cycleInterval = setInterval(cycleDeskOrder, CYCLE_INTERVAL);
};

// Stop the cycling interval
const stopCycling = () => {
    if (cycleInterval) {
        clearInterval(cycleInterval);
        cycleInterval = null;
    }
};

// Function to check if an element is visible in viewport
const isElementInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
    );
};

// Function to make a desk jump
const jumpDesk = (deskElement) => {
    const monitor = deskElement.querySelector('.desk-monitor');
    const screen = deskElement.querySelector('.desk-screen');

    if (monitor && screen) {
        // Play jump sound effect
        audioManager.play('gallery_jump');

        // Add jump class to trigger CSS animation
        monitor.classList.add('jumping');
        screen.classList.add('jumping');

        // Remove jump class after animation completes
        setTimeout(() => {
            monitor.classList.remove('jumping');
            screen.classList.remove('jumping');
        }, 800); // Animation duration
    }
};

// Function to pick a random visible desk and make it jump
const triggerRandomJump = () => {
    if (!galleryRef.value) return;

    // Increment jump counter
    jumpCounter++;

    // Check if this jump timing coincides with cycle timing
    // CYCLE_INTERVAL(8000) / JUMP_INTERVAL(2000) = 4, so every 4th jump coincides with cycle
    const cycleJumpRatio = CYCLE_INTERVAL / JUMP_INTERVAL;
    const isCycleTime = jumpCounter % cycleJumpRatio === 0;

    // Skip jumping if it's cycle time
    if (isCycleTime) {
        return;
    }

    const galleryItems = galleryRef.value.querySelectorAll('.gallery-item');
    const visibleDesks = Array.from(galleryItems).filter(item => isElementInViewport(item));

    if (visibleDesks.length > 0) {
        let availableDesks = visibleDesks;

        // If we have more than one visible desk and we know which desk jumped last,
        // filter out the last jumped desk to ensure variety
        if (visibleDesks.length > 1 && lastJumpedDeskId !== null) {
            availableDesks = visibleDesks.filter(desk => {
                const deskId = desk.getAttribute('data-desk-id');
                return deskId !== lastJumpedDeskId.toString();
            });
        }

        // If filtering left us with no desks (shouldn't happen), fall back to all visible desks
        if (availableDesks.length === 0) {
            availableDesks = visibleDesks;
        }

        const randomIndex = Math.floor(Math.random() * availableDesks.length);
        const randomDesk = availableDesks[randomIndex];

        // Update the last jumped desk ID
        lastJumpedDeskId = parseInt(randomDesk.getAttribute('data-desk-id'));

        jumpDesk(randomDesk);
    }
};

// Start the jump interval
const startJumping = () => {
    if (jumpInterval) {
        clearInterval(jumpInterval);
    }
    jumpInterval = setInterval(triggerRandomJump, JUMP_INTERVAL);
};

// Stop the jump interval
const stopJumping = () => {
    if (jumpInterval) {
        clearInterval(jumpInterval);
        jumpInterval = null;
    }
    jumpCounter = 0; // Reset counter when stopping
    lastJumpedDeskId = null; // Reset last jumped desk tracking
};

// Pause all gallery effects (cycling and jumping)
const pauseGalleryEffects = () => {
    stopCycling();
    stopJumping();
};

// Resume all gallery effects (cycling and jumping)
const resumeGalleryEffects = () => {
    startCycling();
    startJumping();
};

// Watch for changes in shouldStartEffects prop
watch(() => props.shouldStartEffects, (newValue) => {
    if (newValue && !cycleInterval && !jumpInterval) {
        // Start effects if they should be running but aren't
        startCycling();
        startJumping();
    } else if (!newValue) {
        // Stop effects if they shouldn't be running
        stopCycling();
        stopJumping();
    }
});

const galleryWidth = () => {
    if (typeof window === 'undefined') return '100%';
    const numberOfColumns = Math.min(displayDesks.value.length, Math.floor(windowWidth.value / COLUMN_WIDTH));
    const calculatedWidth = COLUMN_WIDTH * numberOfColumns + GUTTER * (numberOfColumns - 1);

    if (calculatedWidth <= windowWidth.value) {
        return `${calculatedWidth}px`;
    } else {
        const singleColumnWidth = COLUMN_WIDTH + GUTTER;
        const numCols = Math.max(1, Math.floor(windowWidth.value / singleColumnWidth)); // Ensure at least 1 column
        const finalWidth = numCols * singleColumnWidth - GUTTER;
        // On very narrow screens, use a single column with reduced width
        if (windowWidth.value < 320) {
            return `${Math.max(285, windowWidth.value - 40)}px`; // 285px is COLUMN_WIDTH, with 20px padding on each side
        }
        return `${finalWidth}px`;
    }
};

const handleResize = () => {
    windowWidth.value = window.innerWidth;
    if (masonryInstance) {
        masonryInstance.layout();
    }
};

const handleDeskClick = (desk, event) => {
    // Enable audio on first user interaction
    audioManager.manuallyEnable();

    // Play click sound effect
    audioManager.play('gallery_click');

    // Pause gallery effects when a desk is selected
    pauseGalleryEffects();

    // Remove the glitch effect immediately when desk is clicked
    const deskElement = event.target.closest('.desk');
    if (deskElement) {
        deskElement.classList.remove('monitor-hovered');
    }

    // Emit the pick event
    emit('pick', desk);
};

onMounted(() => {
    // Initialize display desks
    initializeDisplayDesks();

    nextTick(() => {
        masonryInstance = new Masonry(galleryRef.value, {
            itemSelector: '.gallery-item',
            columnWidth: COLUMN_WIDTH,
            gutter: GUTTER,
        });

        // Only start cycling and jumping if shouldStartEffects is true
        if (props.shouldStartEffects) {
            // Start cycling after masonry is initialized
            startCycling();

            // Start jumping effect
            startJumping();
        }
    });
    window.addEventListener('resize', handleResize);
}); onBeforeUnmount(() => {
    stopCycling();
    stopJumping();
    window.removeEventListener('resize', handleResize);
    if (masonryInstance) {
        masonryInstance.destroy();
    }
});

defineExpose({
    galleryRef,
    pauseGalleryEffects,
    resumeGalleryEffects
});
</script>

<template>
    <div
        ref="galleryRef"
        class="gallery"
        :style="{ width: galleryWidth() }"
        :class="{ 'faded-queue': isGalleryFaded, 'unclickable': isGalleryFaded }"
    >
        <TransitionGroup
            name="gallery"
            tag="div"
        >
            <div
                v-for="desk in displayDesks"
                :key="desk.id"
                class="gallery-item"
                :data-desk-id="desk.id"
                :class="{ 'fade-out': selectedDeskClone && selectedDeskClone.desk.id !== desk.id }"
            >
                <div
                    class="gallery-item-content desk"
                    :style="{ backgroundImage: 'url(../src/assets/desk.svg)' }"
                >
                    <div
                        class="desk-decor"
                        :style="{ backgroundImage: `url(${desk.decor})` }"
                    ></div>
                    <div
                        class="desk-monitor"
                        :style="{
                            backgroundImage: `url(${desk.monitor.img})`,
                            top: desk.monitor.y,
                            left: desk.monitor.x,
                            width: desk.monitor.width,
                            height: desk.monitor.height
                        }"
                        @click="handleDeskClick(desk, $event)"
                        @mouseenter="$event.target.closest('.desk').classList.add('monitor-hovered'); audioManager.play('gallery_hover')"
                        @mouseleave="$event.target.closest('.desk').classList.remove('monitor-hovered')"
                    ></div>
                    <div
                        class="desk-screen glitch-container"
                        :style="{
                            backgroundImage: `url(${desk.profile})`,
                            top: desk.screen.y,
                            left: desk.screen.x,
                            width: desk.screen.width,
                            height: desk.screen.height
                        }"
                    >
                        <div
                            class="glitch-layer glitch-1"
                            :style="{ backgroundImage: `url(${desk.profile})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-2"
                            :style="{ backgroundImage: `url(${desk.profile})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-red"
                            :style="{ backgroundImage: `url(${desk.profile})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-green"
                            :style="{ backgroundImage: `url(${desk.profile})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-blue"
                            :style="{ backgroundImage: `url(${desk.profile})` }"
                        ></div>
                    </div>
                    <div class="desk-info">
                        <div class="desk-name">{{ desk.name }}</div>
                        <div class="desk-desc">{{ desk.title }} / {{ desk.location }}</div>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped lang="scss">
.gallery {
    position: relative;
    /* When the queue is fading out, reduce its opacity */
    transition: opacity 0.6s ease;
    margin: 0 auto;
    max-width: 100vw;
    min-width: 285px;
    /* Match single column width */
    z-index: 1;
}

.gallery-item.fade-out {
    opacity: 0;
    transition: opacity 0.4s ease;
}

.faded-queue {
    opacity: 0;
}

.gallery-item {
    font-size: 15px;
    opacity: 1;

    .gallery-item-content {
        // border: 1px solid blue;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center bottom;
        position: relative;
        width: 285px;
        height: 275px;
    }
}

.desk {

    .desk-decor,
    .desk-monitor,
    .desk-screen {
        position: absolute;
        background-size: cover;
        background-position: center;
    }

    .desk-decor {
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 1;
    }

    .desk-monitor {
        z-index: 2; // Lower z-index but still clickable
        cursor: pointer; // Visual indication that it's clickable
        transition: transform 0.1s ease; // Smooth transition for jump effect

        &.jumping {
            animation: jump 0.8s ease-in-out;
            transform-origin: bottom center; // Squeeze from bottom center
        }
    }

    .desk-screen {
        z-index: 3; // Higher z-index to appear on top
        pointer-events: none; // Allow clicks to pass through to monitor below
        overflow: hidden; // Ensure glitch effects don't exceed screen bounds
        transition: transform 0.1s ease; // Smooth transition for jump effect

        &.jumping {
            animation: jump 0.8s ease-in-out;
            transform-origin: bottom center; // Squeeze from bottom center
        }
    }

    .glitch-container {
        position: relative;

        .glitch-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            opacity: 0;
            pointer-events: none;
        }

        .glitch-1 {
            transform: translateX(0);
            filter: hue-rotate(90deg) saturate(1.2);
            mix-blend-mode: multiply;
        }

        .glitch-2 {
            transform: translateX(0);
            filter: hue-rotate(180deg) saturate(1.5);
            mix-blend-mode: screen;
        }

        .glitch-red {
            transform: translateX(0);
            filter: sepia(100%) hue-rotate(0deg) saturate(3);
            mix-blend-mode: lighten;
        }

        .glitch-green {
            transform: translateX(0);
            filter: sepia(100%) hue-rotate(90deg) saturate(3);
            mix-blend-mode: lighten;
        }

        .glitch-blue {
            transform: translateX(0);
            filter: sepia(100%) hue-rotate(180deg) saturate(3);
            mix-blend-mode: lighten;
        }

        // Add scanlines effect
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(0deg,
                    transparent,
                    transparent 1px,
                    rgba(255, 255, 255, 0.1) 1px,
                    rgba(255, 255, 255, 0.1) 2px);
            opacity: 0;
            pointer-events: none;
            z-index: 1;
        }
    }

    // Glitch effect on monitor hover
    &.monitor-hovered {
        .desk-screen {
            .glitch-layer {
                opacity: 0.6;
            }

            .glitch-1 {
                animation: glitch-1 0.2s infinite;
            }

            .glitch-2 {
                animation: glitch-2 0.25s infinite;
            }

            .glitch-red {
                opacity: 0.8;
                animation: glitch-red 0.15s infinite;
            }

            .glitch-green {
                opacity: 0.8;
                animation: glitch-green 0.18s infinite;
            }

            .glitch-blue {
                opacity: 0.8;
                animation: glitch-blue 0.22s infinite;
            }

            &::before {
                opacity: 0.3;
                animation: scanlines 0.1s infinite;
            }
        }
    }

    .desk-info {
        color: #959595;
        font-size: 14px;
    }

    .desk-name {
        position: absolute;
        bottom: 4.5%;
        left: 13%;
        z-index: 4; // Above everything else
        font-size: 100%;
    }

    .desk-desc {
        position: absolute;
        bottom: 0.5%;
        left: 13%;
        z-index: 4; // Above everything else
        font-size: 70%;
    }
}

.unclickable {
    pointer-events: none;
}

// Glitch effect keyframes
@keyframes glitch-1 {
    0% {
        transform: translateX(0);
        opacity: 0.6;
    }

    10% {
        transform: translateX(-3px) skewX(1deg);
        opacity: 0.8;
    }

    20% {
        transform: translateX(3px) skewX(-1deg);
        opacity: 0.4;
    }

    30% {
        transform: translateX(-2px) skewX(0.5deg);
        opacity: 0.9;
    }

    40% {
        transform: translateX(2px) skewX(-0.5deg);
        opacity: 0.3;
    }

    50% {
        transform: translateX(-4px) skewX(1.5deg);
        opacity: 0.8;
    }

    60% {
        transform: translateX(4px) skewX(-1.5deg);
        opacity: 0.5;
    }

    70% {
        transform: translateX(-1px) skewX(0.2deg);
        opacity: 0.7;
    }

    80% {
        transform: translateX(1px) skewX(-0.2deg);
        opacity: 0.9;
    }

    90% {
        transform: translateX(-3px) skewX(1deg);
        opacity: 0.2;
    }

    100% {
        transform: translateX(0);
        opacity: 0.6;
    }
}

@keyframes glitch-2 {
    0% {
        transform: translateX(0) scaleY(1);
        opacity: 0.5;
    }

    15% {
        transform: translateX(2px) scaleY(0.98);
        opacity: 0.7;
    }

    25% {
        transform: translateX(-3px) scaleY(1.02);
        opacity: 0.3;
    }

    35% {
        transform: translateX(3px) scaleY(0.99);
        opacity: 0.8;
    }

    45% {
        transform: translateX(-2px) scaleY(1.01);
        opacity: 0.2;
    }

    55% {
        transform: translateX(2px) scaleY(0.97);
        opacity: 0.7;
    }

    65% {
        transform: translateX(-4px) scaleY(1.03);
        opacity: 0.4;
    }

    75% {
        transform: translateX(4px) scaleY(0.98);
        opacity: 0.3;
    }

    85% {
        transform: translateX(-1px) scaleY(1.01);
        opacity: 0.8;
    }

    95% {
        transform: translateX(1px) scaleY(0.99);
        opacity: 0.2;
    }

    100% {
        transform: translateX(0) scaleY(1);
        opacity: 0.5;
    }
}

@keyframes scanlines {
    0% {
        opacity: 0.3;
    }

    50% {
        opacity: 0.1;
    }

    100% {
        opacity: 0.3;
    }
}

@keyframes glitch-red {
    0% {
        transform: translateX(0) translateY(0);
        opacity: 0.8;
    }

    10% {
        transform: translateX(-3px) translateY(1px);
        opacity: 0.9;
    }

    20% {
        transform: translateX(4px) translateY(-1px);
        opacity: 0.7;
    }

    30% {
        transform: translateX(-2px) translateY(2px);
        opacity: 0.8;
    }

    40% {
        transform: translateX(3px) translateY(-1px);
        opacity: 0.6;
    }

    50% {
        transform: translateX(-4px) translateY(1px);
        opacity: 0.9;
    }

    60% {
        transform: translateX(2px) translateY(-2px);
        opacity: 0.7;
    }

    70% {
        transform: translateX(-3px) translateY(1px);
        opacity: 0.8;
    }

    80% {
        transform: translateX(4px) translateY(-1px);
        opacity: 0.6;
    }

    90% {
        transform: translateX(-2px) translateY(2px);
        opacity: 0.9;
    }

    100% {
        transform: translateX(0) translateY(0);
        opacity: 0.8;
    }
}

@keyframes glitch-green {
    0% {
        transform: translateX(0) translateY(0);
        opacity: 0.8;
    }

    15% {
        transform: translateX(3px) translateY(-1px);
        opacity: 0.7;
    }

    25% {
        transform: translateX(-4px) translateY(2px);
        opacity: 0.9;
    }

    35% {
        transform: translateX(2px) translateY(-1px);
        opacity: 0.6;
    }

    45% {
        transform: translateX(-3px) translateY(1px);
        opacity: 0.8;
    }

    55% {
        transform: translateX(4px) translateY(-2px);
        opacity: 0.7;
    }

    65% {
        transform: translateX(-2px) translateY(1px);
        opacity: 0.9;
    }

    75% {
        transform: translateX(3px) translateY(-1px);
        opacity: 0.6;
    }

    85% {
        transform: translateX(-4px) translateY(2px);
        opacity: 0.8;
    }

    95% {
        transform: translateX(2px) translateY(-1px);
        opacity: 0.7;
    }

    100% {
        transform: translateX(0) translateY(0);
        opacity: 0.8;
    }
}

@keyframes glitch-blue {
    0% {
        transform: translateX(0) translateY(0);
        opacity: 0.8;
    }

    12% {
        transform: translateX(4px) translateY(1px);
        opacity: 0.6;
    }

    24% {
        transform: translateX(-3px) translateY(-2px);
        opacity: 0.9;
    }

    36% {
        transform: translateX(2px) translateY(1px);
        opacity: 0.7;
    }

    48% {
        transform: translateX(-4px) translateY(-1px);
        opacity: 0.8;
    }

    60% {
        transform: translateX(3px) translateY(2px);
        opacity: 0.6;
    }

    72% {
        transform: translateX(-2px) translateY(-1px);
        opacity: 0.9;
    }

    84% {
        transform: translateX(4px) translateY(1px);
        opacity: 0.7;
    }

    96% {
        transform: translateX(-3px) translateY(-2px);
        opacity: 0.8;
    }

    100% {
        transform: translateX(0) translateY(0);
        opacity: 0.8;
    }
}

// Jump animation keyframes
@keyframes jump {
    0% {
        transform: translateY(0) scaleY(1);
    }

    10% {
        transform: translateY(0) scaleY(0.8);
    }

    20% {
        transform: translateY(0) scaleY(1);
    }

    30% {
        transform: translateY(-80px) scaleY(1);
    }

    35% {
        transform: translateY(-100px) scaleY(1);
    }

    45% {
        transform: translateY(-100px) scaleY(1);
    }

    60% {
        transform: translateY(-80px) scaleY(1);
    }

    75% {
        transform: translateY(0) scaleY(1);
    }

    85% {
        transform: translateY(0) scaleY(0.8);
    }

    95% {
        transform: translateY(0) scaleY(1);
    }

    100% {
        transform: translateY(0) scaleY(1);
    }
}
</style>
