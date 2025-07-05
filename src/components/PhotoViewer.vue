<script setup>
import { ref, watch, nextTick } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
    desk: Object,
    visible: Boolean,
    isSliderVisible: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['close', 'photoVisible', 'firstPhotoLoaded']);

const photoGalleryEl = ref(null);
const progressBarEl = ref(null);
const progressLoadedEl = ref(null);
const isProgressBarActive = ref(false);
const currentIndex = ref(0);
const isTransitioning = ref(false);
const stripesRef = ref(null);
const sliderContainer = ref(null);

const STAGGER_DELAY = 0.01;
const ANIMATION_DURATION = 1;
const ANIMATION_EASE = "power2.out";

const sliderNaturalWidth = ref(600);
const sliderNaturalHeight = ref(400);
const nextNaturalWidth = ref(600);
const nextNaturalHeight = ref(400);
const STRIPE_HEIGHT = 4; // px
const transitionDirection = ref(1); // 1 for next (right-to-left), -1 for prev (left-to-right)

const photoSizeCache = {}; // url -> {width, height}
const isSliderReady = ref(false);
const isProgressBarComplete = ref(false);

function preloadImagesAndUpdateProgress(desk) {
    const photos = desk.photos;
    const bar = progressBarEl.value;
    const loaded = progressLoadedEl.value;

    if (!bar || !loaded) return;

    gsap.set(loaded, { width: '0%' });
    gsap.set(bar, { opacity: 0 });
    isProgressBarComplete.value = false;

    // If all images are already cached, still show progress bar animation
    const allCached = photos.every(url => photoSizeCache[url]);
    if (allCached) {
        const firstPhotoUrl = photos[0];
        const size = photoSizeCache[firstPhotoUrl];
        if (size) {
            sliderNaturalWidth.value = size.width;
            sliderNaturalHeight.value = size.height;
        }

        // Show progress bar animation even for cached images
        gsap.to(bar, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.inOut',
            onComplete: () => {
                setTimeout(() => {
                    // Animate progress bar to 100%
                    gsap.to(loaded, {
                        width: '100%',
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => {
                            // Emit first photo loaded event when progress reaches 100%
                            emit('firstPhotoLoaded', firstPhotoUrl);

                            // Wait a bit more then show slider
                            setTimeout(() => {
                                isSliderReady.value = true;
                            }, 500);

                            setTimeout(() => {
                                emit('photoVisible');
                            }, 2000);
                        }
                    });
                }, 1000);
            }
        });
        return;
    }

    gsap.to(bar, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
            setTimeout(() => {
                if (!photos || photos.length === 0) {
                    gsap.to(loaded, { width: '100%', duration: 0.5, delay: 0.5 });
                    return;
                }

                let loadedCount = 0;
                const totalImages = photos.length;
                let firstImageSizeSet = false;

                photos.forEach((photoUrl, idx) => {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        if (!photoSizeCache[photoUrl] && img.naturalWidth && img.naturalHeight) {
                            photoSizeCache[photoUrl] = { width: img.naturalWidth, height: img.naturalHeight };
                        }
                        loadedCount++;
                        const progress = loadedCount / totalImages;

                        // Set slider size from first image
                        if (!firstImageSizeSet && idx === 0 && img.naturalWidth && img.naturalHeight) {
                            sliderNaturalWidth.value = img.naturalWidth;
                            sliderNaturalHeight.value = img.naturalHeight;
                            firstImageSizeSet = true;
                        }

                        gsap.to(loaded, {
                            width: `${progress * 100}%`,
                            duration: 0.5,
                            ease: 'power2.out',
                            onComplete: () => {
                                // Only show slider when ALL images are loaded AND progress animation is complete
                                if (loadedCount === totalImages) {
                                    // Emit first photo loaded event when progress reaches 100%
                                    emit('firstPhotoLoaded', photos[0]);

                                    setTimeout(() => {
                                        // Ensure slider size is set
                                        if (!firstImageSizeSet) {
                                            const firstPhotoUrl = photos[0];
                                            const size = photoSizeCache[firstPhotoUrl];
                                            if (size) {
                                                sliderNaturalWidth.value = size.width;
                                                sliderNaturalHeight.value = size.height;
                                            }
                                        }
                                        isSliderReady.value = true;
                                    }, 500);

                                    setTimeout(() => {
                                        emit('photoVisible');
                                    }, 2000);
                                }
                            }
                        });
                    };
                    img.src = photoUrl;
                });
            }, 1000);
        }
    });
}

function loadImageSize(url) {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;
    });
}

function getImageBoxInContainer(containerW, containerH, imageW, imageH) {
    // Returns {left, top, width, height} of the image as displayed in the container (background-size: contain)
    const containerRatio = containerW / containerH;
    const imageRatio = imageW / imageH;
    let width, height, left, top;
    if (imageRatio > containerRatio) {
        // Image fills width
        width = containerW;
        height = width / imageRatio;
        left = 0;
        top = (containerH - height) / 2;
    } else {
        // Image fills height
        height = containerH;
        width = height * imageRatio;
        top = 0;
        left = (containerW - width) / 2;
    }
    return { left, top, width, height };
}

async function goToSlide(nextIdx) {
    if (isTransitioning.value || nextIdx === currentIndex.value) return;

    const photos = props.desk?.photos || [];
    const currentSlideUrl = photos[currentIndex.value];
    const nextSlideUrl = photos[nextIdx];

    // Use cached sizes if available
    let currSize = photoSizeCache[currentSlideUrl];
    let nextSize = photoSizeCache[nextSlideUrl];

    // Fallback: if not cached (shouldn't happen after preload), load
    if (!currSize) currSize = await loadImageSize(currentSlideUrl);
    if (!nextSize) nextSize = await loadImageSize(nextSlideUrl);

    sliderNaturalWidth.value = currSize.width;
    sliderNaturalHeight.value = currSize.height;
    nextNaturalWidth.value = nextSize.width;
    nextNaturalHeight.value = nextSize.height;

    // Calculate displayed container size (current)
    const containerW = sliderContainer.value.offsetWidth;
    const containerH = sliderContainer.value.offsetHeight;

    // Calculate displayed image box for current image (in current container)
    const currBox = getImageBoxInContainer(containerW, containerH, currSize.width, currSize.height);

    // Calculate what the container size will be for the next image
    const nextContainerW = Math.min(window.innerWidth * 0.7, nextSize.width);
    const nextContainerH = Math.min(window.innerHeight * 0.7, nextSize.height);
    // Calculate displayed image box for next image (in next container)
    const nextBox = getImageBoxInContainer(nextContainerW, nextContainerH, nextSize.width, nextSize.height);

    // Stripe counts
    const currStripeCount = Math.ceil(currBox.height / STRIPE_HEIGHT);
    const nextStripeCount = Math.ceil(nextBox.height / STRIPE_HEIGHT);

    stripesRef.value.innerHTML = "";

    // Create current stripes (at displayed image box)
    for (let i = 0; i < currStripeCount; i++) {
        const stripe = document.createElement("div");
        stripe.className = "stripe current-stripe";
        stripe.style.position = "absolute";
        stripe.style.top = `${currBox.top + i * STRIPE_HEIGHT}px`;
        stripe.style.left = `${currBox.left}px`;
        stripe.style.width = `${currBox.width}px`;
        stripe.style.height = `${STRIPE_HEIGHT}px`;
        stripe.style.backgroundImage = `url(${currentSlideUrl})`;
        stripe.style.backgroundSize = `${currBox.width}px ${currBox.height}px`;
        stripe.style.backgroundPosition = `0px ${-i * STRIPE_HEIGHT}px`;
        stripe.style.zIndex = 3;
        // Set initial transform based on direction
        stripe.style.transform = "translateX(0)";
        stripesRef.value.appendChild(stripe);
    }
    // Create next stripes (at next image's displayed box in next container size, but overlayed in current container)
    // Center the next stripes in the current container
    const offsetTop = (containerH - nextBox.height) / 2;
    const offsetLeft = (containerW - nextBox.width) / 2;
    for (let i = 0; i < nextStripeCount; i++) {
        const stripe = document.createElement("div");
        stripe.className = "stripe next-stripe";
        stripe.style.position = "absolute";
        stripe.style.top = `${offsetTop + i * STRIPE_HEIGHT}px`;
        stripe.style.left = `${offsetLeft}px`;
        stripe.style.width = `${nextBox.width}px`;
        stripe.style.height = `${STRIPE_HEIGHT}px`;
        stripe.style.backgroundImage = `url(${nextSlideUrl})`;
        stripe.style.backgroundSize = `${nextBox.width}px ${nextBox.height}px`;
        stripe.style.backgroundPosition = `0px ${-i * STRIPE_HEIGHT}px`;
        stripe.style.zIndex = 2;
        // Set initial transform based on direction
        const slideDistance = (transitionDirection.value === 1
            ? nextBox.width + sliderContainer.value.offsetWidth
            : -nextBox.width - sliderContainer.value.offsetWidth);
        stripe.style.transform = `translateX(${slideDistance}px)`;
        stripesRef.value.appendChild(stripe);
    }

    isTransitioning.value = true;

    // Animate current stripes out
    const currentStripes = stripesRef.value.querySelectorAll(".current-stripe");
    gsap.to(currentStripes, {
        x: transitionDirection.value === 1 ? -window.innerWidth : window.innerWidth,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        stagger: { each: STAGGER_DELAY, from: "random" }
    });
    // Animate next stripes in
    const nextStripes = stripesRef.value.querySelectorAll(".next-stripe");
    gsap.to(nextStripes, {
        x: 0,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        stagger: { each: STAGGER_DELAY, from: "random" },
        onComplete: () => {
            // After animation, update slider size and index
            sliderNaturalWidth.value = nextSize.width;
            sliderNaturalHeight.value = nextSize.height;
            currentIndex.value = nextIdx;
            stripesRef.value.innerHTML = "";
            isTransitioning.value = false;
        }
    });
}

function nextSlide() {
    if (isTransitioning.value || currentIndex.value >= props.desk.photos.length - 1) return;
    transitionDirection.value = 1;
    const photos = props.desk?.photos || [];
    goToSlide((currentIndex.value + 1) % photos.length);
}
function prevSlide() {
    if (isTransitioning.value || currentIndex.value <= 0) return;
    transitionDirection.value = -1;
    const photos = props.desk?.photos || [];
    goToSlide((currentIndex.value - 1 + photos.length) % photos.length);
}

function updateSliderSizeForCurrentImage() {
    const photos = props.desk?.photos || [];
    const url = photos[currentIndex.value];
    if (!url) return;
    const size = photoSizeCache[url];
    if (size) {
        sliderNaturalWidth.value = size.width;
        sliderNaturalHeight.value = size.height;
    }
}

watch([() => props.desk, currentIndex], () => {
    updateSliderSizeForCurrentImage();
}, { immediate: true });

watch(() => props.visible, (newVal) => {
    if (newVal && props.desk) {
        // Set slider size to first photo's natural size from cache immediately (prevents initial layout shift)
        const photos = props.desk.photos || [];
        const url = photos[0];
        const size = photoSizeCache[url];
        if (size) {
            sliderNaturalWidth.value = size.width;
            sliderNaturalHeight.value = size.height;
        }
        isProgressBarActive.value = true;
        isSliderReady.value = false;
        isProgressBarComplete.value = false;
        nextTick(() => {
            preloadImagesAndUpdateProgress(props.desk);
        });
    } else {
        const gallery = photoGalleryEl.value;
        if (gallery) {
            setTimeout(() => {
                if (gallery) {
                    gallery.innerHTML = '';
                }
            }, 400);
        }
        const bar = progressBarEl.value;
        if (bar) {
            gsap.to(bar, {
                opacity: 0,
                duration: 0.6, // ANIMATION_DURATION
                ease: 'power2.inOut',
                onComplete: () => {
                    isProgressBarActive.value = false;
                }
            });
        } else {
            isProgressBarActive.value = false;
        }
        isSliderReady.value = false;
        isProgressBarComplete.value = false;
    }
});
watch(() => props.desk, () => {
    currentIndex.value = 0;
});
</script>

<template>
    <div>
        <div
            v-if="isProgressBarActive"
            ref="progressBarEl"
            class="progress-bar"
        >
            <div
                ref="progressLoadedEl"
                class="progress-loaded"
            ></div>
        </div>
        <transition name="fade-scale">
            <div
                v-if="isSliderReady && visible && props.isSliderVisible"
                class="slider-wrapper"
            >
                <div
                    v-if="props.desk && props.desk.photos && props.desk.photos.length"
                    class="slider-container"
                    ref="sliderContainer"
                    :style="{
                        aspectRatio: sliderNaturalWidth + '/' + sliderNaturalHeight,
                        width: 'min(70vw, ' + sliderNaturalWidth + 'px)',
                        height: 'min(70vh, ' + sliderNaturalHeight + 'px)',
                    }"
                >
                    <div
                        v-for="(photo, idx) in props.desk.photos"
                        :key="photo"
                        class="slide"
                        :style="{
                            backgroundImage: `url(${photo})`,
                            opacity: idx === currentIndex && !isTransitioning ? 1 : 0,
                            zIndex: idx === currentIndex ? 1 : 0,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }"
                    ></div>
                    <div
                        class="stripes"
                        ref="stripesRef"
                    ></div>
                </div>
            </div>
        </transition>
        <div
            class="nav-button prev"
            :class="{ 'disabled': isTransitioning || currentIndex === 0 }"
            @click="prevSlide"
            v-if="props.desk && props.desk.photos && props.desk.photos.length > 1"
        >
            <div class="icon-wrapper">
                <div class="icon-line top"></div>
                <div class="icon-line bottom"></div>
            </div>
        </div>
        <div
            class="nav-button next"
            @click="nextSlide"
            v-if="props.desk && props.desk.photos && props.desk.photos.length > 1"
            :class="{ 'disabled': isTransitioning || currentIndex === (props.desk.photos.length - 1) }"
        >
            <div class="icon-wrapper">
                <div class="icon-line top"></div>
                <div class="icon-line bottom"></div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.progress-bar {
    position: fixed;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    /* Below photo gallery but above clone */
    background: #222222;
    top: 0;
    left: 0;
    opacity: 0;
}

.progress-loaded {
    width: 0;
    height: 100%;
    background-color: lime;
    transition: width 0.1s ease-out;
}

.slider-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
}

.slider-container {
    position: relative;
    max-width: 70vw;
    max-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    // transition: opacity 0.3s;
}

.stripes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
}

.stripe {
    position: absolute;
    left: 0;
    width: 100%;
    /* height and background-size set dynamically */
}

.nav-button {
    position: fixed;
    border: none;
    padding: 15px;
    cursor: pointer;
    z-index: 22;
    top: 50%;
    transform: translateY(-50%);

    &.prev {
        left: 5px;

        .icon-line.top {
            transform: translateY(-5px) rotate(-45deg);
        }

        .icon-line.bottom {
            transform: translateY(5px) rotate(45deg);
        }
    }

    &.next {
        right: 5px;

        .icon-line.top {
            transform: translateY(-5px) rotate(45deg);
        }

        .icon-line.bottom {
            transform: translateY(5px) rotate(-45deg);
        }
    }

    &.disabled {
        pointer-events: none;
    }
}

.icon-wrapper {
    width: 20px;
    height: 20px;
    position: relative;
}

.icon-line {
    position: absolute;
    width: 80%;
    height: 3px;
    background-color: white;
    top: 50%;
    left: 0;
    border-radius: 1px;
    transform-origin: center;
    transition: transform 0.4s ease, top 0.4s ease;
}


/* CHEVRON -> BAR (on hover) */
.nav-button:not(.disabled):hover .icon-line.top {
    transform: translateY(-5px) rotate(-90deg);
    width: 70%;
}

.nav-button:not(.disabled):hover .icon-line.bottom {
    transform: translateY(5px) rotate(90deg);
    width: 70%;
}

.nav-button.next:not(.disabled):hover .icon-line.top {
    transform: translateY(-5px) rotate(90deg);
    width: 70%;
}

.nav-button.next:not(.disabled):hover .icon-line.bottom {
    transform: translateY(5px) rotate(-90deg);
    width: 70%;
}

/* CHEVRON -> BAR (when disabled) */
.nav-button.disabled .icon-line.top {
    transform: translateY(-5px) rotate(-90deg);
    width: 70%;
}

.nav-button.disabled .icon-line.bottom {
    transform: translateY(5px) rotate(90deg);
    width: 70%;
}

.nav-button.next.disabled .icon-line.top {
    transform: translateY(-5px) rotate(90deg);
    width: 70%;
}

.nav-button.next.disabled .icon-line.bottom {
    transform: translateY(5px) rotate(-90deg);
    width: 70%;
}


.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.5);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
    opacity: 1;
    transform: scale(1);
}
</style>
