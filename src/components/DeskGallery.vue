<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Masonry from 'masonry-layout';

const props = defineProps({
    desks: Array,
    isGalleryFaded: Boolean,
    selectedDeskClone: Object
});

const emit = defineEmits(['pick']);

const COLUMN_WIDTH = 285; // This is the width of each column in the Masonry gallery.
const GUTTER = 35; // The space between gallery items in the Masonry layout.

const galleryRef = ref(null);
let masonryInstance = null;
const windowWidth = ref(window.innerWidth);

const galleryWidth = () => {
    if (typeof window === 'undefined') return '100%';
    const numberOfColumns = Math.min(props.desks.length, Math.floor(windowWidth.value / COLUMN_WIDTH));
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

onMounted(() => {
    nextTick(() => {
        masonryInstance = new Masonry(galleryRef.value, {
            itemSelector: '.gallery-item',
            columnWidth: COLUMN_WIDTH,
            gutter: GUTTER,
        });
    });
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (masonryInstance) {
        masonryInstance.destroy();
    }
});

defineExpose({
    galleryRef
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
                v-for="desk in desks"
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
                        @click="$emit('pick', desk)"
                    ></div>
                    <div
                        class="desk-screen"
                        :style="{
                            backgroundImage: `url(${desk.screen.img})`,
                            top: desk.screen.y,
                            left: desk.screen.x,
                            width: desk.screen.width,
                            height: desk.screen.height
                        }"
                    ></div>
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
    }

    .desk-screen {
        z-index: 3; // Higher z-index to appear on top
        pointer-events: none; // Allow clicks to pass through to monitor below
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
</style>
