<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { gsap } from 'gsap';
import { useDeskViewerStore } from '../stores/deskViewer.js';
import DeskGallery from '../components/DeskGallery.vue';
import DeskSlider from '../components/DeskSlider.vue';
import PhotoViewer from '../components/PhotoViewer.vue';

// --- Configuration Constants ---
const ANIMATION_DURATION = 0.6;

// --- Store ---
const store = useDeskViewerStore();

// --- Refs for DOM Elements ---
const galleryComponentRef = ref(null); // Ref for the gallery component
const deskSliderRef = ref(null);

// --- Vue Router ---
const router = useRouter(); // Used to programmatically change the URL (e.g., router.push('/'.
const route = useRoute(); // Used to read information from the current URL (e.g., route.params.deskId).

const handleResize = () => {
  store.setWindowWidth(window.innerWidth);
  updateCloneCenterTransform();
};

onMounted(() => {
  // This logic handles loading the page directly with a deskId in the URL (e.g., from a bookmark or refresh).
  if (route.params.deskId) {
    const desk = store.desks.find(d => d.id === route.params.deskId);
    if (desk) {
      // Use a small timeout to ensure Masonry has finished its initial layout.
      setTimeout(() => {
        pick(desk);
      }, 150);
    }
  }

  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

function handlePhotoViewerClose() {
  if (store.selectedDesk) {
    pick(store.selectedDesk);
  }
}

function changeDesk(desk) {
  store.setPhotoSliderVisible(false);

  // Wait for fade-out animation to complete, then change the selected desk
  setTimeout(() => {
    // Track the current desk as hidden before switching
    if (store.selectedDeskId) {
      store.addHiddenDeskId(store.selectedDeskId);
    }

    // Update the clone to reference the new desk
    if (store.selectedDeskClone) {
      store.selectedDeskClone.desk = desk;
    }

    store.setSelectedDeskId(desk.id);
    router.push('/' + desk.id);

    // Wait a moment, then fade the slider back in
    setTimeout(() => {
      store.setPhotoSliderVisible(true);
    }, 100);
  }, 400); // Wait for fade-out transition (0.4s)
}

// This is the main function that orchestrates the opening and closing of a desk item.
function pick(desk) {
  const galleryRef = galleryComponentRef.value?.galleryRef;
  if (!galleryRef) return;
  const deskElement = galleryRef.querySelector(`.gallery-item[data-desk-id="${desk.id}"]`);
  if (!deskElement) return;

  const isClosing = store.selectedDeskClone && store.selectedDeskClone.desk.id === desk.id;

  if (isClosing) {
    document.body.style.overflow = ''; // Re-enable scrolling
    router.push('/'); // Change the URL back to the root.
    store.setSelectedDeskId(null);
  } else {
    document.body.style.overflow = 'hidden'; // Disable scrolling
    if (route.path !== '/' + desk.id) {
      router.push('/' + desk.id); // Change the URL to the specific desk.
    }
    store.setSelectedDeskId(desk.id);
  }

  // --- Pop-in/Pop-out Animation Logic ---

  // If we are closing an item (the clone already exists).
  if (store.selectedDeskClone && store.selectedDeskClone.desk.id === desk.id) {
    const { cloneEl } = store.selectedDeskClone;
    const finalRect = deskElement.getBoundingClientRect(); // Get final position

    // Hide the photo viewer, which will trigger its own internal animations
    store.setPhotoViewerVisible(false);

    // Restore the clone's screen to the original desk screen image
    const screenEl = cloneEl.querySelector('.desk-screen');
    if (screenEl && desk.screen && desk.screen.img) {
      screenEl.style.backgroundImage = `url(${desk.screen.img})`;
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

        // Restore visibility for all hidden desks
        const galleryRef = galleryComponentRef.value?.galleryRef;
        if (galleryRef) {
          // Restore the current desk
          deskElement.style.visibility = 'visible';

          // Restore all previously hidden desks
          store.hiddenDeskIds.forEach(deskId => {
            const hiddenDeskElement = galleryRef.querySelector(`.gallery-item[data-desk-id="${deskId}"]`);
            if (hiddenDeskElement) {
              hiddenDeskElement.style.visibility = 'visible';
            }
          });

          // Clear the hidden desks set
          store.clearHiddenDeskIds();
        }

        store.setSelectedDeskClone(null); // Clear the clone state.
        store.setGalleryFaded(false);
        if (deskSliderRef.value) {
          deskSliderRef.value.reset();
        }
        // Delay the removal of the clone to allow the gallery to fade in
        setTimeout(() => {
          cloneEl.remove(); // Remove the clone from the DOM.
        }, ANIMATION_DURATION * 1000); // Match the transition duration
      }
    });

    gsap.to([cloneEl.querySelector('.desk-name'), cloneEl.querySelector('.desk-desc')], {
      color: '#959595', // Reset the text color
      duration: ANIMATION_DURATION,
      ease: 'power2.inOut'
    });
    return;
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
  cloneEl.style.zIndex = '10'; // Ensure it's above the backdrop and everything else
  document.body.appendChild(cloneEl);
  deskElement.style.visibility = 'hidden'; // Hide the original item.
  store.addHiddenDeskId(desk.id); // Track this desk as hidden
  // Fade out the rest of the gallery.
  store.setGalleryFaded(true);
  store.setSelectedDeskClone({ desk, originalRect: rect, cloneEl }); // Store the clone's state.

  // Show the photo viewer immediately when clone is created
  store.setPhotoViewerVisible(true);

  // Animate the clone from its starting position to the center of the screen.
  const cloneWidth = cloneEl.offsetWidth;
  const cloneHeight = cloneEl.offsetHeight;
  const targetLeft = (window.innerWidth - cloneWidth) / 2;
  const targetTop = (window.innerHeight - cloneHeight) / 2 + window.scrollY;

  gsap.to(cloneEl, {
    top: targetTop,
    left: targetLeft,
    duration: 1,
    // ease: 'power2.inOut',
    ease: 'bounce.out', // Use a bounce effect for a more dynamic feel
    delay: 0.5, // Slight delay to allow the gallery to fade out
    onComplete: () => {
      // Animation complete - clone is now at center
    }
  });

  gsap.to([cloneEl.querySelector('.desk-name'), cloneEl.querySelector('.desk-desc')], {
    color: 'white',
    duration: ANIMATION_DURATION,
    ease: 'power2.inOut',
    delay: 0.2, // Slight delay to allow the gallery to fade out
  });

}

function onPhotoVisible() {
  if (store.selectedDeskClone) {
    store.selectedDeskClone.cloneEl.style.opacity = '0';
  }
}

function onFirstPhotoLoaded(photoUrl) {
  if (store.selectedDeskClone) {
    const screenEl = store.selectedDeskClone.cloneEl.querySelector('.desk-screen');
    if (screenEl) {
      screenEl.style.backgroundImage = `url(${photoUrl})`;
    }
  }

  // Complete the desk slider animation when photo is loaded
  if (deskSliderRef.value) {
    setTimeout(() => {
      deskSliderRef.value.completePhotoLoadAnimation();
    }, 500); // Delay slightly to ensure the photo is fully loaded
    // deskSliderRef.value.completePhotoLoadAnimation();
  }
}

const updateCloneCenterTransform = () => {
  if (!store.selectedDeskClone) return;
  const { cloneEl } = store.selectedDeskClone;
  const cloneWidth = cloneEl.offsetWidth;
  const cloneHeight = cloneEl.offsetHeight;
  const targetLeft = (window.innerWidth - cloneWidth) / 2;
  const targetTop = (window.innerHeight - cloneHeight) / 2 + window.scrollY;
  gsap.to(cloneEl, {
    left: targetLeft,
    top: targetTop,
    duration: 0, // Instantly move it
  });
};
</script>

<template>
  <main>
    <div
      class="logo"
      :class="{ 'viewer-active': store.isPhotoViewerVisible }"
      @click="handlePhotoViewerClose"
    >DESK</div>

    <DeskGallery
      ref="galleryComponentRef"
      :desks="store.desks"
      :is-gallery-faded="store.isGalleryFaded"
      :selected-desk-clone="store.selectedDeskClone"
      @pick="pick"
    />

    <DeskSlider
      ref="deskSliderRef"
      :desks="store.desks"
      :selected-desk-id="store.selectedDeskId"
      @change-desk="changeDesk"
    />

    <PhotoViewer
      :desk="store.selectedDesk"
      :visible="store.isPhotoViewerVisible"
      :is-slider-visible="store.isPhotoSliderVisible"
      @close="handlePhotoViewerClose"
      @photo-visible="onPhotoVisible"
      @first-photo-loaded="onFirstPhotoLoaded"
      @is-transitioning="isTransitioning => store.setCarouselLocked(isTransitioning)"
    />
  </main>
</template>

<style scoped lang="scss">
main {
  background-color: #E8E8E8;
}

.logo {
  position: fixed;
  top: 20px;
  left: 20px;
  font-size: 1.5rem;
  font-weight: bold;
  color: black; // Dark gray
  transition: color 0.4s ease;
  z-index: 30;
}

.logo.viewer-active {
  color: white;
  cursor: pointer;
  /* Ensure it's above the photo viewer */
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
</style>