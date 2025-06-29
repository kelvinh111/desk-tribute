<script setup>
import { ref, watch, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
    desk: Object,
    visible: Boolean
})

const emit = defineEmits(['close'])

const photoGalleryEl = ref(null)
const progressBarEl = ref(null)
const progressLoadedEl = ref(null)
const isProgressBarActive = ref(false)

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

    gsap.to([imgEl, closeButton], {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.3
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
        }
    });
}

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

</script>

<template>
    <div>
        <div v-if="isProgressBarActive" ref="progressBarEl" class="progress-bar">
            <div ref="progressLoadedEl" class="progress-loaded"></div>
        </div>
        <div ref="photoGalleryEl" class="photo-gallery" :class="{ show: visible }"></div>
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

.photo-gallery {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2500;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.4s ease, visibility 0s linear 0.4s;
}

.photo-gallery.show {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.4s ease;
}

:deep(.photo-gallery img) {
    max-width: 70%;
    max-height: 70%;
    object-fit: contain;
    opacity: 0;
    transform: scale(0);
}

:deep(.photo-close-button) {
    position: relative;
    margin-top: 20px;
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
    opacity: 0;
    transform: scale(0.7);
    transition: all 0.3s ease;
    pointer-events: auto;
}

:deep(.photo-close-button:hover) {
    background: white;
    border-color: #999;
}
</style>
