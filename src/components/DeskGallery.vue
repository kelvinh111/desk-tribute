<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue';
import Masonry from 'masonry-layout';
import { audioManager } from '../utils/audioManager.js';

const props = defineProps({
    desks: Array,
    isGalleryFaded: Boolean,
    selectedDeskClone: Object,
    shouldStartEffects: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['pick']);

const COLUMN_WIDTH = 285; // This is the width of each column in the Masonry gallery.
const GUTTER = 35; // The space between gallery items in the Masonry layout.
const CYCLE_INTERVAL = 8000; // 8 seconds in milliseconds
const JUMP_INTERVAL = 2000; // 2 seconds for jump effect

const galleryRef = ref(null);
let masonryInstance = null;
const windowWidth = ref(window.innerWidth);
let cycleInterval = null;
let jumpInterval = null;
let jumpCounter = 0; // Track jump intervals to detect cycle timing

// Create a reactive copy of the desks array for manipulation
const displayDesks = ref([]);

// Initialize display desks when props.desks changes
const initializeDisplayDesks = () => {
    if (props.desks && props.desks.length > 0) {
        displayDesks.value = [...props.desks];
    }
};

// Cycle function to move last desk to beginning
const cycleDeskOrder = () => {
    if (displayDesks.value.length > 1) {
        const lastDesk = displayDesks.value.pop();
        displayDesks.value.unshift(lastDesk);

        // Play shuffle sound effect
        audioManager.play('gallery_shuffle');

        // Refresh masonry layout after DOM update
        nextTick(() => {
            if (masonryInstance) {
                masonryInstance.reloadItems();
                masonryInstance.layout();
            }
        });
    }

    // Don't reset jump counter - let it continue its natural progression
};

// Start the cycling interval
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
        const randomIndex = Math.floor(Math.random() * visibleDesks.length);
        const randomDesk = visibleDesks[randomIndex];
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
};

// Pause all gallery effects (cycling and jumping)
const pauseGalleryEffects = () => {
    stopCycling();
    stopJumping();
    console.log('🔇 Gallery effects paused');
};

// Resume all gallery effects (cycling and jumping)
const resumeGalleryEffects = () => {
    startCycling();
    startJumping();
    console.log('🔊 Gallery effects resumed');
};

// Watch for changes in shouldStartEffects prop
watch(() => props.shouldStartEffects, (newValue) => {
    if (newValue && !cycleInterval && !jumpInterval) {
        // Start effects if they should be running but aren't
        startCycling();
        startJumping();
        console.log('🔊 Gallery effects started via prop change');
    } else if (!newValue) {
        // Stop effects if they shouldn't be running
        stopCycling();
        stopJumping();
        console.log('🔇 Gallery effects stopped via prop change');
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
        const numCols = Math.floor(windowWidth.value / singleColumnWidth);
        return `${numCols * singleColumnWidth - GUTTER}px`;
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

    // Initialize audio manager with gallery sounds
    audioManager.initialize({
        'gallery_shuffle': '/src/assets/sounds/gallery_shuffle.mp3',
        'gallery_jump': '/src/assets/sounds/gallery_jump.mp3',
        'gallery_hover': '/src/assets/sounds/gallery_hover.mp3',
        'gallery_click': '/src/assets/sounds/gallery_click.mp3',
        'photoviewer_load': '/src/assets/sounds/photoviewer_load.mp3',
        'header_hover': '/src/assets/sounds/header_hover.mp3',
        'header_click': '/src/assets/sounds/header_click.mp3',
        'photoviewer_hover': '/src/assets/sounds/photoviewer_hover.mp3',
        'photoviewer_click': '/src/assets/sounds/photoviewer_click.mp3'
    });

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
                            backgroundImage: `url(${desk.screen.img})`,
                            top: desk.screen.y,
                            left: desk.screen.x,
                            width: desk.screen.width,
                            height: desk.screen.height
                        }"
                    >
                        <div
                            class="glitch-layer glitch-1"
                            :style="{ backgroundImage: `url(${desk.screen.img})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-2"
                            :style="{ backgroundImage: `url(${desk.screen.img})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-red"
                            :style="{ backgroundImage: `url(${desk.screen.img})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-green"
                            :style="{ backgroundImage: `url(${desk.screen.img})` }"
                        ></div>
                        <div
                            class="glitch-layer glitch-blue"
                            :style="{ backgroundImage: `url(${desk.screen.img})` }"
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
    min-width: 650px;
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
