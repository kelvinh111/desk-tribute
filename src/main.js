import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import { audioManager } from './utils/audioManager.js';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Initialize audio manager globally
audioManager.initialize({
    gallery_click: '/src/assets/sounds/gallery_click.mp3',
    gallery_hover: '/src/assets/sounds/gallery_hover.mp3',
    gallery_shuffle: '/src/assets/sounds/gallery_shuffle.mp3',
    gallery_jump: '/src/assets/sounds/gallery_jump.mp3',
    header_click: '/src/assets/sounds/header_click.mp3',
    header_hover: '/src/assets/sounds/header_hover.mp3',
    photoviewer_click: '/src/assets/sounds/photoviewer_click.mp3',
    photoviewer_hover: '/src/assets/sounds/photoviewer_hover.mp3',
    photoviewer_load: '/src/assets/sounds/photoviewer_load.mp3'
});

app.mount('#app');
