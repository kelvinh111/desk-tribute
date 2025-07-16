<template>
    <div
        v-if="isLoading"
        class="loading-screen"
    >
        <div class="progress-display">{{ Math.round(progress) }}%</div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import deskData from '../model/desk.json';

// Define emits
const emit = defineEmits(['loading-complete']);

const isLoading = ref(true);
const progress = ref(0);

async function preloadImages() {
    // Collect all images to preload
    const imagesToLoad = [];

    deskData.forEach(desk => {
        // Add desk.screen.img
        if (desk.screen && desk.screen.img) {
            imagesToLoad.push(desk.screen.img);
        }

        // Add desk.screen.firstPhoto
        if (desk.screen && desk.screen.firstPhoto) {
            imagesToLoad.push(desk.screen.firstPhoto);
        }
    });

    // Remove duplicates
    const uniqueImages = [...new Set(imagesToLoad)];

    let loadedCount = 0;
    const totalImages = uniqueImages.length;

    if (totalImages === 0) {
        // No images to load, complete immediately
        progress.value = 100;
        completeLoading();
        return;
    }

    // Load each image and ensure it's cached
    const imagePromises = uniqueImages.map(imageUrl => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                // Force the browser to cache this image by creating a canvas with it
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Create invisible elements to force CSS background-image caching
                const cacheDiv = document.createElement('div');
                cacheDiv.style.position = 'absolute';
                cacheDiv.style.top = '-9999px';
                cacheDiv.style.left = '-9999px';
                cacheDiv.style.width = '1px';
                cacheDiv.style.height = '1px';
                cacheDiv.style.backgroundImage = `url(${imageUrl})`;
                cacheDiv.style.backgroundSize = 'contain';
                cacheDiv.style.backgroundRepeat = 'no-repeat';
                document.body.appendChild(cacheDiv);

                loadedCount++;
                progress.value = (loadedCount / totalImages) * 100;
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`Failed to load image: ${imageUrl}`);
                loadedCount++;
                progress.value = (loadedCount / totalImages) * 100;
                resolve(null); // Resolve with null to not block loading
            };

            img.src = imageUrl;
        });
    });

    // Wait for all images to load
    await Promise.all(imagePromises);

    // Small delay to show 100% for a moment
    setTimeout(() => {
        completeLoading();
    }, 500);
}

function completeLoading() {
    isLoading.value = false;
    emit('loading-complete');
}

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
    font-size: 3rem;
    font-weight: bold;
    color: #333;
    font-family: system-ui, -apple-system, sans-serif;
}
</style>
