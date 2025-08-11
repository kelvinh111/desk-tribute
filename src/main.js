/**
 * Application Entry Point
 * 
 * Initializes the Vue 3 application with Pinia state management, Vue Router,
 * and global audio system. This is where the core application services are
 * configured before mounting to the DOM.
 */

// Import CSS via HTML link tag instead of JS import to avoid MIME type issues
// import '@/assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import { audioManager } from './utils/audioManager.js';

// Create Vue application instance
const app = createApp(App);

// Configure application plugins and services
app.use(createPinia());  // State management with Pinia
app.use(router);         // Client-side routing with Vue Router

/**
 * Global Audio System Initialization
 * 
 * Pre-configure all sound effects used throughout the application.
 * This centralized approach ensures consistent audio management and
 * prevents audio initialization issues during user interactions.
 * 
 * Sound categories:
 * - gallery_*: Gallery interaction sounds (click, hover, shuffle, jump)
 * - header_*: Navigation header sounds (click, hover)
 * - photoviewer_*: Photo viewer sounds (click, hover, load)
 */
audioManager.initialize({
    gallery_click: new URL('./assets/sounds/gallery_click.mp3', import.meta.url).href,
    gallery_hover: new URL('./assets/sounds/gallery_hover.mp3', import.meta.url).href,
    gallery_shuffle: new URL('./assets/sounds/gallery_shuffle.mp3', import.meta.url).href,
    gallery_jump: new URL('./assets/sounds/gallery_jump.mp3', import.meta.url).href,
    header_click: new URL('./assets/sounds/header_click.mp3', import.meta.url).href,
    header_hover: new URL('./assets/sounds/header_hover.mp3', import.meta.url).href,
    photoviewer_click: new URL('./assets/sounds/photoviewer_click.mp3', import.meta.url).href,
    photoviewer_hover: new URL('./assets/sounds/photoviewer_hover.mp3', import.meta.url).href,
    photoviewer_load: new URL('./assets/sounds/photoviewer_load.mp3', import.meta.url).href
});

// Mount application to DOM
app.mount('#app');
