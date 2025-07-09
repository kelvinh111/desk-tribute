<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
    desks: Array,
    selectedDeskId: [String, Number],
    isCarouselLocked: Boolean
});

const emit = defineEmits(['update:isCarouselLocked', 'change-desk']);

// --- Configuration Constants ---
const BASE_SLIDER_ITEM_WIDTH = 90;
const EXPANDED_SLIDER_ITEM_WIDTH = 160;
const BASE_SLIDER_ITEM_HEIGHT = 68;
const EXPANDED_SLIDER_ITEM_HEIGHT = 136;
const ANIMATION_DURATION = 0.6;
const HOVER_ANIMATION_DURATION = 0.4;
const THROW_MULTIPLIER = 400;
const CAROUSEL_GUTTER = 0;

const sliderRef = ref(null);
let positionSliderItems = null;
let needsPositionUpdate = false;
const isHoverable = ref(true); // Flag to indicate if the desks are hoverable

const selectionState = reactive({
    selectedIndex: null,
    progress: 0,
    hoverStates: [],
});

const hoverState = reactive({
    currentHoveredIndex: null,
    isHoveringAnyDesk: false,
});

const carousel = reactive({
    x: 0,
    isDragging: false,
    hasDragged: false,
    isPointerDown: false,
    startX: 0,
    startScrollX: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
});

const floatingLabel = reactive({
    visible: false,
    name: '',
    desc: '',
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    hideTimeout: null,
    // Current cursor position (real-time, no lag)
    currentCursorX: 0,
    currentCursorY: 0,
});

function handleItemClick(desk) {
    if (carousel.hasDragged || props.isCarouselLocked) return;
    if (props.selectedDeskId && props.selectedDeskId !== desk.id) {
        isHoverable.value = false; // Disable hover effects when a desk is selected
        emit('update:isCarouselLocked', true);
        emit('change-desk', desk);
    }
}

function updateFloatingLabel(event) {
    floatingLabel.targetX = event.clientX;
    floatingLabel.targetY = event.clientY;
    // Update current cursor position immediately (no elastic animation)
    floatingLabel.currentCursorX = event.clientX;
    floatingLabel.currentCursorY = event.clientY;
}

function showFloatingLabel(desk, event) {
    // Clear any pending hide timeout
    if (floatingLabel.hideTimeout) {
        clearTimeout(floatingLabel.hideTimeout);
        floatingLabel.hideTimeout = null;
    }

    const wasVisible = floatingLabel.visible;
    const deskIndex = props.desks.indexOf(desk);
    const previousHoveredIndex = hoverState.currentHoveredIndex;

    // Update hover state
    hoverState.currentHoveredIndex = deskIndex;
    hoverState.isAnyDeskHovered = true;

    floatingLabel.name = desk.name;
    floatingLabel.desc = desk.title + ' / ' + desk.location;
    floatingLabel.visible = true;

    // Only set current position if label was not visible before (first show)
    if (!wasVisible) {
        floatingLabel.x = event.clientX;
        floatingLabel.y = event.clientY;
    }

    // Always update target position for smooth movement
    floatingLabel.targetX = event.clientX;
    floatingLabel.targetY = event.clientY;
    // Update current cursor position immediately
    floatingLabel.currentCursorX = event.clientX;
    floatingLabel.currentCursorY = event.clientY;
}

function hideFloatingLabel() {
    // Add a small delay before hiding to prevent flickering during item transitions
    floatingLabel.hideTimeout = setTimeout(() => {
        floatingLabel.visible = false;
        hoverState.currentHoveredIndex = null;
        hoverState.isAnyDeskHovered = false;
        floatingLabel.hideTimeout = null;
    }, 50);
}

function handleSliderLeave() {
    // This is redundant with the mouseleave event listener, but kept for template consistency
    hideFloatingLabel();
}

function onTick() {
    if (needsPositionUpdate && positionSliderItems) {
        positionSliderItems(carousel.x);
        needsPositionUpdate = false;
    }

    // Elastic animation for floating label (only the label moves with lag, cursor position is immediate)
    if (floatingLabel.visible) {
        const easing = 0.1; // Elastic factor (lower = more lag/elasticity)
        const deltaX = floatingLabel.targetX - floatingLabel.x;
        const deltaY = floatingLabel.targetY - floatingLabel.y;

        // Apply elastic movement only to the label
        floatingLabel.x += deltaX * easing;
        floatingLabel.y += deltaY * easing;
    }
}

function markForUpdate() {
    needsPositionUpdate = true;
}

function getCarouselBounds() {
    const slider = sliderRef.value;
    if (!slider) return { minX: 0, maxX: 0 };

    const numSliderItems = props.desks.length;
    const totalHoverProgress = selectionState.hoverStates.reduce((sum, state) => sum + (state?.progress || 0), 0);
    const suppressionFactor = 1 - Math.min(1, totalHoverProgress);
    const effectiveSelectedProgress = selectionState.progress * suppressionFactor;

    let dynamicContentWidth = 0;
    for (let i = 0; i < numSliderItems; i++) {
        const hoverProgress = selectionState.hoverStates[i]?.progress || 0;
        let width = BASE_SLIDER_ITEM_WIDTH;
        if (hoverProgress > 0) {
            width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * hoverProgress;
        } else if (i === selectionState.selectedIndex) {
            width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * effectiveSelectedProgress;
        }
        dynamicContentWidth += width;
    }

    if (numSliderItems > 0) {
        dynamicContentWidth += (numSliderItems - 1) * CAROUSEL_GUTTER;
    }

    const sliderWidth = slider.offsetWidth;
    const minX = Math.min(0, -(dynamicContentWidth - sliderWidth));
    return { minX, maxX: 0 };
}

function handlePointerDown(event) {
    if (props.isCarouselLocked) return;
    gsap.killTweensOf(carousel);
    carousel.isDragging = true;
    carousel.isPointerDown = true;
    carousel.hasDragged = false;
    carousel.startX = event.clientX;
    carousel.startScrollX = carousel.x;
    carousel.lastX = carousel.x;
    carousel.lastTime = Date.now();
    carousel.velocityX = 0;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(event) {
    if (!carousel.isDragging) return;
    const dx = event.clientX - carousel.startX;
    if (!carousel.hasDragged && Math.abs(dx) > 5) {
        carousel.hasDragged = true;
    }
    if (carousel.hasDragged) {
        event.preventDefault();
    }
    const newX = carousel.startScrollX + dx;
    const bounds = getCarouselBounds();
    carousel.x = gsap.utils.clamp(bounds.minX, bounds.maxX, newX);
    markForUpdate();
    const now = Date.now();
    const dt = now - carousel.lastTime;
    if (dt > 0) {
        carousel.velocityX = (carousel.x - carousel.lastX) / dt;
    }
    carousel.lastX = carousel.x;
    carousel.lastTime = now;
}

function handlePointerUp() {
    if (!carousel.isDragging) return;
    carousel.isDragging = false;
    carousel.isPointerDown = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    const throwDistance = carousel.velocityX * THROW_MULTIPLIER;
    let targetX = carousel.x + throwDistance;
    const bounds = getCarouselBounds();
    const originalTargetX = targetX;
    targetX = gsap.utils.clamp(bounds.minX, bounds.maxX, targetX);
    const hitBoundary = originalTargetX < bounds.minX || originalTargetX > bounds.maxX;

    gsap.to(carousel, {
        x: targetX,
        duration: hitBoundary ? ANIMATION_DURATION : ANIMATION_DURATION * 1.5,
        ease: hitBoundary ? 'back.out(1.7)' : 'power3.out',
        onUpdate: markForUpdate,
    });
}

watch(() => props.selectedDeskId, (newId, oldId) => {
    const slider = sliderRef.value;
    if (!slider) return;
    isHoverable.value = false; // Disable hover effects when a desk is selected

    if (newId) {
        const index = props.desks.findIndex(d => d.id === newId);
        if (index === -1) return;

        gsap.to(slider, { autoAlpha: 1, duration: ANIMATION_DURATION, ease: 'power2.inOut' });
        selectionState.selectedIndex = index;

        const sliderWidth = slider.offsetWidth;
        const numSliderItems = props.desks.length;
        const activeSliderItem = slider.querySelectorAll('.slider-item')[index];
        const activeSliderItemContent = activeSliderItem.querySelector('.slider-item-content');

        if (!oldId) {
            gsap.set(activeSliderItemContent, { autoAlpha: 0 });
        }

        let dynamicInitialX = [];
        let currentX = 0;
        for (let i = 0; i < numSliderItems; i++) {
            dynamicInitialX.push(currentX);
            currentX += ((i === index) ? EXPANDED_SLIDER_ITEM_WIDTH : BASE_SLIDER_ITEM_WIDTH) + CAROUSEL_GUTTER;
        }
        const dynamicContentWidth = currentX - (numSliderItems > 0 ? CAROUSEL_GUTTER : 0);
        const targetX = (sliderWidth / 2 - EXPANDED_SLIDER_ITEM_WIDTH / 2) - dynamicInitialX[index];
        const finalBounds = {
            minX: Math.min(0, -(dynamicContentWidth - sliderWidth)),
            maxX: 0
        };
        const clampedTargetX = gsap.utils.clamp(finalBounds.minX, finalBounds.maxX, targetX);

        const tl = gsap.timeline();
        tl.to(selectionState, {
            progress: 1,
            duration: ANIMATION_DURATION,
            ease: 'power2.inOut',
            onUpdate: markForUpdate
        }, 0);

        if (!oldId) {
            tl.to(carousel, {
                x: clampedTargetX,
                duration: ANIMATION_DURATION,
                ease: 'power2.inOut',
                onUpdate: markForUpdate
            }, 0);
        }

        // tl.call(() => {
        const activeSliderItemLeft = activeSliderItem.getBoundingClientRect().left;
        const fromLeft = window.innerWidth / 2 - activeSliderItem.getBoundingClientRect().width / 2;
        const fromTop = window.innerHeight / 2 - activeSliderItem.getBoundingClientRect().top;

        // Check if this is a desk switch (oldId exists) or initial selection (oldId is null)
        if (oldId) {
            // Desk switching: animate to center, wait, then animate back
            gsap.fromTo(activeSliderItemContent, {
                autoAlpha: 1,
                scale: 1,
                x: 0,
                y: 0,
            }, {
                scale: 0.8,
                x: fromLeft - activeSliderItemLeft,
                y: fromTop,
                duration: ANIMATION_DURATION,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Wait 1 second, then animate back to slider
                    setTimeout(() => {
                        gsap.fromTo(activeSliderItemContent, {
                            autoAlpha: 0,
                            scale: 0.8,
                            x: fromLeft - activeSliderItemLeft,
                            y: fromTop,
                        }, {
                            autoAlpha: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            duration: ANIMATION_DURATION,
                            ease: 'power2.inOut',
                            onComplete: () => {
                                isHoverable.value = true; // Re-enable hover effects after animation
                                emit('update:isCarouselLocked', false);
                            }
                        });
                    }, 1000);
                }
            });
        } else {
            // Initial selection from gallery: use original animation
            gsap.fromTo(activeSliderItemContent, {
                autoAlpha: 0,
                scale: 0.8,
                x: fromLeft - activeSliderItemLeft,
                y: fromTop,
            }, {
                autoAlpha: 1,
                scale: 1,
                x: 0,
                y: 0,
                duration: ANIMATION_DURATION,
                ease: 'power2.inOut',
                onComplete: () => {
                    isHoverable.value = true; // Re-enable hover effects after animation
                    emit('update:isCarouselLocked', false);
                }
            });
        }
        // }, null, ANIMATION_DURATION);

    } else if (oldId) {
        selectionState.hoverStates.forEach(state => { state.progress = 0; });
        gsap.to(slider, { autoAlpha: 0, duration: ANIMATION_DURATION, ease: 'power2.inOut' });
        gsap.to(selectionState, {
            progress: 0,
            duration: ANIMATION_DURATION,
            ease: 'power2.inOut',
            onUpdate: markForUpdate,
            onComplete: () => {
                selectionState.selectedIndex = null;
            }
        });
    }
});

function reset() {
    const slider = sliderRef.value;
    if (!slider) return;
    selectionState.hoverStates.forEach(state => { state.progress = 0; });
    gsap.to(slider, { autoAlpha: 0, duration: ANIMATION_DURATION, ease: 'power2.inOut' });
    gsap.to(selectionState, {
        progress: 0,
        duration: ANIMATION_DURATION,
        ease: 'power2.inOut',
        onUpdate: markForUpdate,
        onComplete: () => {
            selectionState.selectedIndex = null;
        }
    });
}

defineExpose({
    reset
});

onMounted(() => {
    gsap.ticker.add(onTick);
    const slider = sliderRef.value;
    if (!slider) return;
    gsap.set(slider, { autoAlpha: 0 });

    const sliderItems = gsap.utils.toArray(slider.querySelectorAll('.slider-item'));
    selectionState.hoverStates = sliderItems.map(() => ({ progress: 0 }));

    gsap.set(sliderItems, {
        width: BASE_SLIDER_ITEM_WIDTH,
        height: BASE_SLIDER_ITEM_HEIGHT,
        x: (i) => i * (BASE_SLIDER_ITEM_WIDTH + CAROUSEL_GUTTER),
    });

    positionSliderItems = (dragX) => {
        // Calculate suppression factor excluding the selected item's hover to prevent circular dependency
        const totalHoverProgress = selectionState.hoverStates.reduce((sum, state, index) => {
            return sum + (index !== selectionState.selectedIndex ? (state?.progress || 0) : 0);
        }, 0);
        const suppressionFactor = 1 - Math.min(1, totalHoverProgress);
        const effectiveSelectedProgress = selectionState.progress * suppressionFactor;

        const sliderItemData = sliderItems.map((_, i) => {
            const hoverProgress = selectionState.hoverStates[i]?.progress || 0;
            let width = BASE_SLIDER_ITEM_WIDTH;
            let height = BASE_SLIDER_ITEM_HEIGHT;
            let opacity = 0.5;

            if (hoverProgress > 0) {
                width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * hoverProgress;
                height = BASE_SLIDER_ITEM_HEIGHT + (EXPANDED_SLIDER_ITEM_HEIGHT - BASE_SLIDER_ITEM_HEIGHT) * hoverProgress;
                opacity = 0.5 + 0.5 * hoverProgress;
            } else if (i === selectionState.selectedIndex) {
                width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * effectiveSelectedProgress;
                height = BASE_SLIDER_ITEM_HEIGHT + (EXPANDED_SLIDER_ITEM_HEIGHT - BASE_SLIDER_ITEM_HEIGHT) * effectiveSelectedProgress;
                opacity = 0.5 + 0.5 * effectiveSelectedProgress;
            }
            return { width, height, opacity };
        });

        let dynamicInitialX = [];
        let currentX = 0;
        sliderItemData.forEach(data => {
            dynamicInitialX.push(currentX);
            currentX += data.width + CAROUSEL_GUTTER;
        });

        sliderItems.forEach((sliderItem, i) => {
            const data = sliderItemData[i];
            const x = dynamicInitialX[i] + dragX;
            gsap.set(sliderItem, { x, width: data.width, height: data.height, opacity: data.opacity });
        });
    };

    sliderItems.forEach((sliderItem, index) => {
        sliderItem.addEventListener('mouseenter', () => {
            if (!isHoverable.value || carousel.isPointerDown || selectionState.selectedIndex === null) return;

            // Update hover tracking
            hoverState.currentHoveredIndex = index;
            hoverState.isAnyDeskHovered = true;

            // ONLY animate NON-SELECTED desks
            // The selected desk should never respond to its own hover
            if (index !== selectionState.selectedIndex) {
                gsap.to(selectionState.hoverStates[index], {
                    progress: 1,
                    duration: HOVER_ANIMATION_DURATION,
                    ease: 'power2.out',
                    overwrite: 'auto',
                    onUpdate: markForUpdate
                });
            }

            // Clear hover states for all other items (except the one we're hovering)
            selectionState.hoverStates.forEach((state, i) => {
                if (i !== index) {
                    gsap.to(state, {
                        progress: 0,
                        duration: HOVER_ANIMATION_DURATION,
                        ease: 'power2.out',
                        overwrite: 'auto',
                        onUpdate: markForUpdate
                    });
                }
            });
        });
    });

    slider.addEventListener('mouseleave', () => {
        if (carousel.isPointerDown || selectionState.selectedIndex === null) return;

        // Reset hover tracking
        hoverState.currentHoveredIndex = null;
        hoverState.isAnyDeskHovered = false;

        // Clear all hover states when leaving the slider
        selectionState.hoverStates.forEach(state => {
            gsap.to(state, {
                progress: 0,
                duration: HOVER_ANIMATION_DURATION,
                ease: 'power2.out',
                overwrite: 'auto',
                onUpdate: markForUpdate
            });
        });
    });

    slider.addEventListener('pointerdown', handlePointerDown);
    positionSliderItems(0);
    markForUpdate();
});

onBeforeUnmount(() => {
    gsap.ticker.remove(onTick);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
});

</script>

<template>
    <div
        ref="sliderRef"
        class="slider"
        @mouseleave="handleSliderLeave"
    >
        <div
            class="slider-item"
            v-for="desk in desks"
            :key="desk.id"
            @click="handleItemClick(desk)"
            @mouseenter="(event) => showFloatingLabel(desk, event)"
            @mouseleave="hideFloatingLabel"
            @mousemove="updateFloatingLabel"
            :class="{ 'clickable': selectedDeskId && selectedDeskId !== desk.id && !isCarouselLocked }"
        >
            <div
                class="slider-item-content desk"
                :style="{ backgroundImage: 'url(../src/assets/desk.svg)' }"
            >
                <div
                    class="desk-decor"
                    :style="{ backgroundImage: `url(${desk.decor})` }"
                ></div>
                <div
                    class="desk-monitor"
                    :style="{ backgroundImage: `url(${desk.monitor.img})`, top: desk.monitor.y, left: desk.monitor.x, width: desk.monitor.width, height: desk.monitor.height }"
                >
                </div>
                <div
                    class="desk-screen"
                    :style="{ backgroundImage: `url(${desk.screen.img})`, top: desk.screen.y, left: desk.screen.x, width: desk.screen.width, height: desk.screen.height }"
                >
                </div>
                <div class="desk-name">{{ desk.name }}</div>
            </div>
        </div>
    </div>

    <!-- Floating Label -->
    <div
        v-if="floatingLabel.visible && isHoverable"
        class="floating-label"
        :style="{
            left: floatingLabel.x + 40 + 'px',
            top: floatingLabel.y - 60 + 'px'
        }"
    >
        <h3>{{ floatingLabel.name }}</h3>
        <h4>{{ floatingLabel.desc }}</h4>
    </div>

    <!-- Connecting Line -->
    <svg
        v-if="floatingLabel.visible && isHoverable"
        class="floating-label-line"
        :style="{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 999
        }"
    >
        <line
            :x1="floatingLabel.x + 40"
            :y1="floatingLabel.y - 30"
            :x2="floatingLabel.currentCursorX"
            :y2="floatingLabel.currentCursorY"
            stroke="rgba(255, 255, 255, 1)"
            stroke-width="1"
        />
    </svg>
</template>

<style scoped lang="scss">
.slider {
    position: fixed;
    left: 0;
    bottom: -5px;
    width: 100%;
    height: 110px;
    /* Increased to accommodate expanded desk height (136px) + some padding */
    overflow: visible;
    z-index: 25;
}

.slider-item {
    position: absolute;
    bottom: 0;
    left: 0;
    user-select: none;
    // display: flex;
    // align-items: center;
    // justify-content: center;
    transform-origin: center bottom;
    padding: 0;
    cursor: default;
    padding: 0 10px;
}

.slider-item.clickable {
    cursor: pointer;
}

.slider-item-content {
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center bottom;
    position: relative;
    width: 100%;
    height: 100%;

    img {
        pointer-events: none;
    }
}

.desk {
    font-size: 14px;
    color: #959595;

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
        z-index: 2;
    }

    .desk-screen {
        z-index: 3;
    }

    .desk-name {
        position: absolute;
        bottom: 4.5%;
        left: 13%;
        z-index: 4;
    }
}

.floating-label {
    position: fixed;
    color: white;
    z-index: 1000;
    pointer-events: none;
    white-space: nowrap;

    h3 {
        font-size: 14px;
        line-height: 12px;
    }

    h4 {
        font-size: 10px;
    }
}
</style>
