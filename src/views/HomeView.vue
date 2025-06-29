<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import itemsData from '../model/desk.json'
import { useRouter, useRoute } from 'vue-router'
import { gsap } from 'gsap'
import DeskGallery from '../components/DeskGallery.vue'
import DeskSlider from '../components/DeskSlider.vue'

// --- Configuration Constants ---
const ANIMATION_DURATION = 0.6;

const windowWidth = ref(0)

// --- Refs for DOM Elements ---
const galleryComponentRef = ref(null) // Ref for the gallery component
const deskSliderRef = ref(null)
const desks = ref(itemsData) // Reactive ref holding the array of desk data.
let selectedDeskClone = null // Will hold the cloned element for the pop-out animation.
let isCarouselLocked = ref(false); // Flag to prevent carousel interaction during animations.
const isGalleryFaded = ref(false); // Controls the faded state of the gallery
const isPhotoGalleryVisible = ref(false); // Controls the visibility of the photo gallery
const selectedDeskId = ref(null);

// --- Vue Router ---
const router = useRouter() // Used to programmatically change the URL (e.g., router.push('/')).
const route = useRoute() // Used to read information from the current URL (e.g., route.params.deskId).

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const shuffleArray = () => {
  desks.value = desks.value
    .map(desk => ({ desk, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ desk }) => desk)
  nextTick(() => {
  })
}

const updateCloneCenterTransform = () => {
  if (!selectedDeskClone) return
  const { cloneEl } = selectedDeskClone
  const cloneWidth = cloneEl.offsetWidth
  const cloneHeight = cloneEl.offsetHeight
  const targetLeft = (window.innerWidth - cloneWidth) / 2
  const targetTop = (window.innerHeight - cloneHeight) / 2 + window.scrollY
  gsap.to(cloneEl, {
    duration: 0, // Instantly move it
  });
}

onMounted(() => {
  // This logic handles loading the page directly with a deskId in the URL (e.g., from a bookmark or refresh).
  if (route.params.deskId) {
    const desk = desks.value.find(d => d.id === route.params.deskId);
    if (desk) {
      // Use a small timeout to ensure Masonry has finished its initial layout.
      setTimeout(() => {
        pick(desk);
      }, 150);
    }
  }

  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

function showFirstPhoto(desk) {
  const photoGalleryEl = document.querySelector('.photo-gallery');
  if (!photoGalleryEl || !desk.photos || desk.photos.length === 0) return;

  // Make the gallery visible
  isPhotoGalleryVisible.value = true;

  // Clear any previous photo
  photoGalleryEl.innerHTML = '';

  const firstPhotoUrl = desk.photos[0];
  const imgEl = document.createElement('img');
  imgEl.src = firstPhotoUrl;

  photoGalleryEl.appendChild(imgEl);

  const closeButton = document.createElement('button');
  closeButton.className = 'photo-close-button'; // Use className for dynamically created element
  closeButton.innerHTML = '&times;'; // A simple 'X' for the close button
  closeButton.onclick = () => {
    if (selectedDeskClone) {
      pick(selectedDeskClone.desk);
    }
  };
  photoGalleryEl.appendChild(closeButton);

  // Animate the photo and button in
  gsap.to([imgEl, closeButton], {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: 'power2.out',
    delay: 0.3 // A small delay after the progress bar finishes
  });
}

function preloadImagesAndUpdateProgress(desk) {
  const photos = desk.photos;
  const progressBarEl = document.querySelector('.progress-bar');
  const progressLoadedEl = document.querySelector('.progress-loaded');

  if (!progressBarEl || !progressLoadedEl) return;

  // Reset progress bar
  gsap.set(progressLoadedEl, { width: '0%' });
  gsap.set(progressBarEl, { opacity: 0 }); // Ensure it's hidden initially

  // First, fade in the progress bar background
  gsap.to(progressBarEl, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.inOut',
    onComplete: () => {
      // Then, start loading images and updating the progress
      if (!photos || photos.length === 0) {
        // If no photos, maybe we want to show it as complete instantly
        gsap.to(progressLoadedEl, { width: '100%', duration: 0.5, delay: 0.5 });
        return;
      }

      let loadedCount = 0;
      const totalImages = photos.length;

      photos.forEach(photoUrl => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          const progress = loadedCount / totalImages;
          gsap.to(progressLoadedEl, {
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

// This is the main function that orchestrates the opening and closing of a desk item.
function pick(desk) {
  const galleryRef = galleryComponentRef.value?.galleryRef;
  if (!galleryRef) return;
  const deskElement = galleryRef.querySelector(`.gallery-item[data-desk-id="${desk.id}"]`)
  if (!deskElement) return

  const isClosing = selectedDeskClone && selectedDeskClone.desk.id === desk.id;

  if (isClosing) {
    document.body.style.overflow = ''; // Re-enable scrolling
    router.push('/'); // Change the URL back to the root.
    selectedDeskId.value = null;
  } else {
    document.body.style.overflow = 'hidden'; // Disable scrolling
    if (route.path !== '/' + desk.id) {
      router.push('/' + desk.id); // Change the URL to the specific desk.
    }
    selectedDeskId.value = desk.id;
  }

  // --- Pop-in/Pop-out Animation Logic ---

  // If we are closing an item (the clone already exists).
  if (selectedDeskClone && selectedDeskClone.desk.id === desk.id) {
    const { cloneEl } = selectedDeskClone
    const finalRect = deskElement.getBoundingClientRect(); // Get final position

    // Fade out the displayed photo gallery
    isPhotoGalleryVisible.value = false;
    const photoGalleryEl = document.querySelector('.photo-gallery');
    if (photoGalleryEl) {
      // After the fade-out transition, clear the content.
      setTimeout(() => {
        photoGalleryEl.innerHTML = '';
      }, 400); // Match CSS transition duration
    }

    // Fade out the progress bar
    const progressBarEl = document.querySelector('.progress-bar');
    if (progressBarEl) {
      gsap.to(progressBarEl, {
        opacity: 0,
        duration: ANIMATION_DURATION,
        ease: 'power2.inOut'
      });
    }

    // Animate the clone back to its original position in the grid.
    gsap.to(cloneEl, {
      top: finalRect.top + window.scrollY,
      left: finalRect.left,
      width: finalRect.width,
      height: finalRect.height,
      opacity: 1,
      duration: ANIMATION_DURATION,
      ease: 'power2.inOut',
      onComplete: () => {
        document.body.style.overflow = ''; // Also re-enable scrolling here for safety
        deskElement.style.visibility = 'visible'; // Make the original gallery item visible again.
        selectedDeskClone = null; // Clear the clone state.
        isGalleryFaded.value = false;
        if (deskSliderRef.value) {
          deskSliderRef.value.reset();
        }
        // Delay the removal of the clone to allow the gallery to fade in
        setTimeout(() => {
          cloneEl.remove(); // Remove the clone from the DOM.
        }, ANIMATION_DURATION * 1000); // Match the transition duration
      }
    })
    return
  }

  // If we are opening an item.
  const rect = deskElement.getBoundingClientRect(); // Get the position of the original grid item.
  const cloneEl = deskElement.cloneNode(true); // Create a clone.
  cloneEl.classList.add('desk-clone');
  // Style the clone to be positioned exactly on top of the original.
  cloneEl.style.position = 'absolute'; // Use absolute positioning
  cloneEl.style.top = rect.top + window.scrollY + 'px';
  cloneEl.style.left = rect.left + 'px';
  cloneEl.style.width = rect.width + 'px';
  cloneEl.style.height = rect.height + 'px';
  document.body.appendChild(cloneEl);
  deskElement.style.visibility = 'hidden'; // Hide the original item.
  // Fade out the rest of the gallery.
  isGalleryFaded.value = true;
  selectedDeskClone = { desk, originalRect: rect, cloneEl }; // Store the clone's state.

  // Animate the clone from its starting position to the center of the screen.
  const cloneWidth = cloneEl.offsetWidth;
  const cloneHeight = cloneEl.offsetHeight;
  const targetLeft = (window.innerWidth - cloneWidth) / 2;
  const targetTop = (window.innerHeight - cloneHeight) / 2 + window.scrollY;

  gsap.to(cloneEl, {
    top: targetTop,
    left: targetLeft,
    duration: ANIMATION_DURATION,
    ease: 'power2.inOut'
  });

  preloadImagesAndUpdateProgress(desk);
}
</script>

<template>
  <main>
    <DeskGallery ref="galleryComponentRef" :desks="desks" :is-gallery-faded="isGalleryFaded"
      :selected-desk-clone="selectedDeskClone" @pick="pick" />

    <DeskSlider ref="deskSliderRef" :desks="desks" :selected-desk-id="selectedDeskId"
      v-model:is-carousel-locked="isCarouselLocked" />

    <div class="progress-bar">
      <div class="progress-loaded"></div>
    </div>

    <div class="photo-gallery" :class="{ show: isPhotoGalleryVisible }"></div>

    <div class="photo-overlay"></div>
  </main>
</template>

<style scoped lang="scss">
main {
  background-color: #E8E8E8;
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
    z-index: 2; // Lower z-index but still clickable
    cursor: pointer; // Visual indication that it's clickable
  }

  .desk-screen {
    z-index: 3; // Higher z-index to appear on top
    pointer-events: none; // Allow clicks to pass through to monitor below
  }

  .desk-name {
    position: absolute;
    bottom: 4.5%;
    left: 13%;
    z-index: 4; // Above everything else
  }

  .desk-desc {
    position: absolute;
    bottom: 0.5%;
    left: 13%;
    z-index: 4; // Above everything else
    font-size: 10px;
  }
}

button {
  display: block;
  margin-top: 1.5rem;
  background-color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  margin-left: auto;
  margin-right: auto;
  color: #d1d5db;
  font-weight: 600;
  transition: all 0.5s ease;
}

.btn:active {
  background-color: #6B7280;
}

.unclickable {
  pointer-events: none;
}

.progress-bar {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 0;
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
  /* Align items vertically */
  justify-content: center;
  align-items: center;
  z-index: 2500;
  visibility: hidden;
  /* Hidden by default */
  opacity: 0;
  transition: opacity 0.4s ease, visibility 0s linear 0.4s;
  /* Delay visibility change */
  // pointer-events: none;
  /* Allow clicks to pass through the container */
}

.photo-gallery.show {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.4s ease;
}

::v-deep(.photo-gallery img) {
  max-width: 70%;
  max-height: 70%;
  object-fit: contain;
  opacity: 0.5;
  transform: scale(0);
}

.photo-close-button {
  position: relative;
  /* Change from absolute */
  margin-top: 20px;
  /* Space between photo and button */
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 24px;
  line-height: 38px;
  /* Center the 'X' */
  text-align: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.7);
  transition: all 0.3s ease;
  pointer-events: auto;
  /* Make button clickable */
}

.photo-close-button:hover {
  background: white;
  border-color: #999;
}

.photo-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2400;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.photo-overlay.show {
  opacity: 1;
  pointer-events: auto;
}
</style>