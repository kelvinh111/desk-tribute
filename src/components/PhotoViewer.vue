<script setup>
import { ref, watch, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
    desk: Object,
    visible: Boolean
})

const emit = defineEmits(['close', 'photoVisible', 'firstPhotoLoaded'])

const photoGalleryEl = ref(null)
const progressBarEl = ref(null)
const progressLoadedEl = ref(null)
const isProgressBarActive = ref(false)
const currentIndex = ref(0)
const isTransitioning = ref(false)
const stripesRef = ref(null)
const sliderContainer = ref(null)

const SLIDER_WIDTH = 600
const SLIDER_HEIGHT = 400
const STRIPE_COUNT = 100
const STAGGER_DELAY = 0.02
const ANIMATION_DURATION = 1
const ANIMATION_EASE = "power2.out"

const sliderNaturalWidth = ref(600)
const sliderNaturalHeight = ref(400)
const nextNaturalWidth = ref(600)
const nextNaturalHeight = ref(400)
const STRIPE_HEIGHT = 5 // px

function showFirstPhoto(desk) {
    const gallery = photoGalleryEl.value;
    if (!gallery || !desk.photos || desk.photos.length === 0) return;

    gallery.innerHTML = '';

    const firstPhotoUrl = desk.photos[0];
    const imgEl = document.createElement('img');
    imgEl.src = firstPhotoUrl;
    gallery.appendChild(imgEl);

    const closeButton = document.createElement('button');
    closeButton.className = 'photo-close-button';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        emit('close');
    };
    gallery.appendChild(closeButton);

    setTimeout(() => {
        emit('firstPhotoLoaded', firstPhotoUrl);
    }, 1000);

    gsap.to([imgEl, closeButton], {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
        delay: 2,
        onComplete: () => {
            emit('photoVisible');
        }

    });
}

function preloadImagesAndUpdateProgress(desk) {
    const photos = desk.photos;
    const bar = progressBarEl.value;
    const loaded = progressLoadedEl.value;

    if (!bar || !loaded) return;

    gsap.set(loaded, { width: '0%' });
    gsap.set(bar, { opacity: 0 });

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

                photos.forEach(photoUrl => {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        loadedCount++;
                        const progress = loadedCount / totalImages;
                        gsap.to(loaded, {
                            width: `${progress * 100}%`,
                            duration: 0.5,
                            ease: 'power2.out'
                        });

                        if (loadedCount === totalImages) {
                            showFirstPhoto(desk);
                        }
                    };
                    img.src = photoUrl;
                });
            }, 1000);
        }
    });
}

function loadImageSize(url) {
    return new Promise((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.src = url
    })
}

function getDisplayedSize(naturalWidth, naturalHeight) {
    const maxW = window.innerWidth * 0.7;
    const maxH = window.innerHeight * 0.7;
    let w = naturalWidth, h = naturalHeight;
    const ratio = naturalWidth / naturalHeight;
    if (w > maxW) {
        w = maxW;
        h = w / ratio;
    }
    if (h > maxH) {
        h = maxH;
        w = h * ratio;
    }
    return { width: Math.round(w), height: Math.round(h) };
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
    if (isTransitioning.value || nextIdx === currentIndex.value) return

    const photos = props.desk?.photos || []
    const currentSlideUrl = photos[currentIndex.value]
    const nextSlideUrl = photos[nextIdx]

    // Get current and next image sizes
    const [currSize, nextSize] = await Promise.all([
        loadImageSize(currentSlideUrl),
        loadImageSize(nextSlideUrl)
    ])
    sliderNaturalWidth.value = currSize.width
    sliderNaturalHeight.value = currSize.height
    nextNaturalWidth.value = nextSize.width
    nextNaturalHeight.value = nextSize.height

    // Calculate displayed container size
    const containerW = sliderContainer.value.offsetWidth
    const containerH = sliderContainer.value.offsetHeight

    // Calculate displayed image boxes
    const currBox = getImageBoxInContainer(containerW, containerH, currSize.width, currSize.height)
    const nextBox = getImageBoxInContainer(containerW, containerH, nextSize.width, nextSize.height)

    // Stripe counts
    const currStripeCount = Math.ceil(currBox.height / STRIPE_HEIGHT)
    const nextStripeCount = Math.ceil(nextBox.height / STRIPE_HEIGHT)

    stripesRef.value.innerHTML = ""

    // Create current stripes (at displayed image box)
    for (let i = 0; i < currStripeCount; i++) {
        const stripe = document.createElement("div")
        stripe.className = "stripe current-stripe"
        stripe.style.position = "absolute"
        stripe.style.top = `${currBox.top + i * STRIPE_HEIGHT}px`
        stripe.style.left = `${currBox.left}px`
        stripe.style.width = `${currBox.width}px`
        stripe.style.height = `${STRIPE_HEIGHT}px`
        stripe.style.backgroundImage = `url(${currentSlideUrl})`
        stripe.style.backgroundSize = `${currBox.width}px ${currBox.height}px`
        stripe.style.backgroundPosition = `0px ${-i * STRIPE_HEIGHT}px`
        stripe.style.zIndex = 3
        stripe.style.transform = "translateX(0)"
        stripesRef.value.appendChild(stripe)
    }
    // Create next stripes (at displayed image box)
    for (let i = 0; i < nextStripeCount; i++) {
        const stripe = document.createElement("div")
        stripe.className = "stripe next-stripe"
        stripe.style.position = "absolute"
        stripe.style.top = `${nextBox.top + i * STRIPE_HEIGHT}px`
        stripe.style.left = `${nextBox.left}px`
        stripe.style.width = `${nextBox.width}px`
        stripe.style.height = `${STRIPE_HEIGHT}px`
        stripe.style.backgroundImage = `url(${nextSlideUrl})`
        stripe.style.backgroundSize = `${nextBox.width}px ${nextBox.height}px`
        stripe.style.backgroundPosition = `0px ${-i * STRIPE_HEIGHT}px`
        stripe.style.zIndex = 2
        stripe.style.transform = `translateX(-${containerW}px)`
        stripesRef.value.appendChild(stripe)
    }

    isTransitioning.value = true

    // Animate current stripes out
    const currentStripes = stripesRef.value.querySelectorAll(".current-stripe")
    gsap.to(currentStripes, {
        x: containerW,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        stagger: { each: STAGGER_DELAY, from: "random" }
    })
    // Animate next stripes in
    const nextStripes = stripesRef.value.querySelectorAll(".next-stripe")
    gsap.to(nextStripes, {
        x: 0,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        stagger: { each: STAGGER_DELAY, from: "random" },
        onComplete: () => {
            // After animation, update slider size and index
            sliderNaturalWidth.value = nextSize.width
            sliderNaturalHeight.value = nextSize.height
            currentIndex.value = nextIdx
            stripesRef.value.innerHTML = ""
            isTransitioning.value = false
        }
    })
}

function nextSlide() {
    const photos = props.desk?.photos || []
    goToSlide((currentIndex.value + 1) % photos.length)
}
function prevSlide() {
    const photos = props.desk?.photos || []
    goToSlide((currentIndex.value - 1 + photos.length) % photos.length)
}

function updateSliderSizeForCurrentImage() {
    console.log('Updating slider size for current image');
    const photos = props.desk?.photos || []
    const url = photos[currentIndex.value]
    if (!url) return
    const img = new window.Image()
    img.onload = () => {
        sliderNaturalWidth.value = img.naturalWidth
        sliderNaturalHeight.value = img.naturalHeight
    }
    img.src = url
}

watch([() => props.desk, currentIndex], () => {
    updateSliderSizeForCurrentImage()
}, { immediate: true });

watch(() => props.visible, (newVal) => {
    if (newVal && props.desk) {
        isProgressBarActive.value = true;
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
    }
});
watch(() => props.desk, () => {
    currentIndex.value = 0
})
</script>

<template>
    <div>
        <div v-if="isProgressBarActive" ref="progressBarEl" class="progress-bar">
            <div ref="progressLoadedEl" class="progress-loaded"></div>
        </div>
        <div style="position: fixed; top: 0; left: 0; z-index:99999;">{{ visible }}</div>
        <div v-if="visible && props.desk && props.desk.photos && props.desk.photos.length" class="slider-container"
            ref="sliderContainer" :style="{
                aspectRatio: sliderNaturalWidth + '/' + sliderNaturalHeight,
                width: 'min(70vw, ' + sliderNaturalWidth + 'px)',
                height: 'min(70vh, ' + sliderNaturalHeight + 'px)',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                // background: '#111',
                zIndex: 2500,
                display: visible ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                // boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }">
            <div v-for="(photo, idx) in props.desk.photos" :key="photo" class="slide" :style="{
                backgroundImage: `url(${photo})`,
                opacity: idx === currentIndex && !isTransitioning ? 1 : 0,
                // opacity: idx === currentIndex ? 1 : 0,
                zIndex: idx === currentIndex ? 1 : 0,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }"></div>
            <div class="stripes" ref="stripesRef"></div>
            <div class="nav-buttons" v-if="props.desk.photos.length > 1">
                <button @click="prevSlide" :disabled="isTransitioning">⟵ Prev</button>
                <button @click="nextSlide" :disabled="isTransitioning">Next ⟶</button>
            </div>
            <button class="photo-close-button" @click="emit('close')">&times;</button>
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

.slider-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 70vw;
    max-height: 70vh;
    width: 600px;
    height: 400px;
    // background: #111;
    // overflow: hidden;
    z-index: 2500;
    display: flex;
    align-items: center;
    justify-content: center;
    // box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
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

.nav-buttons {
    position: absolute;
    width: 100%;
    bottom: 10px;
    display: flex;
    justify-content: space-between;
    z-index: 4;
    padding: 0 20px;
}

.nav-buttons button {
    background: rgba(255, 255, 255, 0.8);
    border: none;
    padding: 10px 20px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 5px;
}

.photo-close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.8);
    color: #333;
    border: 1px solid #ccc;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 24px;
    line-height: 38px;
    text-align: center;
    cursor: pointer;
    z-index: 5;
}

.photo-close-button:hover {
    background: white;
    border-color: #999;
}
</style>
