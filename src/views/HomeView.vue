<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { gsap } from 'gsap';
import { useDeskViewerStore } from '../stores/deskViewer.js';
import { audioManager } from '../utils/audioManager.js';
import { useGalleryEffects } from '../composables/useGalleryEffects.js';
import { useOverlays } from '../composables/useOverlays.js';
import DeskGallery from '../components/DeskGallery.vue';
import DeskSlider from '../components/DeskSlider.vue';
import PhotoViewer from '../components/PhotoViewer.vue';
import LoadingScreen from '../components/LoadingScreen.vue';
import DeskSubmissionForm from '../components/DeskSubmissionForm.vue';
import IconSpeakerOn from '../assets/icon_speaker_on.svg';
import IconSpeakerOff from '../assets/icon_speaker_off.svg';

// Constants
const ANIMATION_DURATION = 0.6;
const DIRECT_LOADING_DELAY = 100;

// Initialize services
const store = useDeskViewerStore();
const router = useRouter();
const route = useRoute();

// Component refs
const galleryComponentRef = ref(null);
const deskSliderRef = ref(null);

// Composables
const galleryEffects = useGalleryEffects(galleryComponentRef);
const overlays = useOverlays((action) => {
  if (action === 'pause') {
    galleryEffects.pauseEffects();
  } else if (action === 'resume') {
    galleryEffects.resumeEffects(overlays.isAnyOverlayVisible.value, store.isPhotoViewerVisible);
  }
});

// State management
const isAppLoaded = ref(false);
const isAudioMuted = ref(false);

// Computed properties
const shouldStartGalleryEffects = computed(() => {
  return galleryEffects.shouldGalleryEffectsRun.value &&
    !store.isPhotoViewerVisible &&
    !overlays.isAnyOverlayVisible.value;
});

// ==========================================
// SCROLL MANAGEMENT FOR OVERLAYS
// ==========================================

// Watch for overlay visibility changes to manage body scroll
watch(() => overlays.isAnyOverlayVisible.value, (isVisible) => {
  if (isVisible) {
    // Disable body scroll when overlay is shown
    document.body.style.overflow = 'hidden';
  } else {
    // Re-enable body scroll when overlay is hidden, but only if PhotoViewer is not active
    // If PhotoViewer is active, it should manage its own scroll state
    if (!store.isPhotoViewerVisible) {
      document.body.style.overflow = '';
    }
  }
});

// Also watch for PhotoViewer state changes to ensure proper scroll management
watch(() => store.isPhotoViewerVisible, (isPhotoViewerVisible) => {
  // If PhotoViewer becomes visible while an overlay is also visible, let overlay take precedence
  // If PhotoViewer becomes hidden while overlay is visible, ensure scroll remains disabled
  if (!isPhotoViewerVisible && overlays.isAnyOverlayVisible.value) {
    document.body.style.overflow = 'hidden';
  }
});

// ==========================================
// METHODS
// ==========================================

/**
 * Toggle audio mute state
 */
function toggleAudioMute() {
  isAudioMuted.value = audioManager.toggleMute();
}

// --- Loading Screen Handler ---
function onLoadingComplete() {
  isAppLoaded.value = true;

  // After loading is complete, handle any direct desk loading
  nextTick(() => {
    // Add a small delay to ensure all components are mounted
    setTimeout(() => {
      handleDirectDeskLoading();
    }, DIRECT_LOADING_DELAY);
  });
}

function handleDirectDeskLoading() {
  if (route.params.deskId) {
    const deskId = parseInt(route.params.deskId, 10);
    const desk = store.desks.find(d => d.id === deskId);
    if (desk) {
      galleryEffects.setEffectsEnabled(false);

      // Immediately fade the gallery to hide it
      store.setGalleryFaded(true);

      // Ensure gallery is mounted before trying to pick
      const checkGalleryAndPick = () => {
        const galleryRef = galleryComponentRef.value?.galleryRef;
        if (galleryRef) {
          const deskElement = galleryRef.querySelector(`.gallery-item[data-desk-id="${deskId}"]`);
          if (deskElement) {
            // For direct loading, call pick with a flag to skip animation
            pick(desk, true); // true = direct loading, skip gallery animation
          } else {
            // If desk element not found, try again after a short delay
            setTimeout(checkGalleryAndPick, 100);
          }
        } else {
          // If gallery ref not available, try again after a short delay
          setTimeout(checkGalleryAndPick, 100);
        }
      };

      // Start checking for gallery availability immediately
      checkGalleryAndPick();
    } else {
      console.warn('Desk not found with ID:', deskId);
      // If desk not found, redirect to home
      router.push('/');
    }
  }
}

const handleResize = () => {
  store.setWindowWidth(window.innerWidth);
  updateCloneCenterTransform();
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);

  // Initialize audio muted state
  isAudioMuted.value = audioManager.isMutedState();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  // Ensure body scroll is restored when component unmounts
  document.body.style.overflow = '';
});

function handlePhotoViewerClose() {
  if (!store.isLogoClickable) return; // Prevent closing during transitions

  // If any overlay is visible, close it first, then continue with normal behavior
  if (overlays.isAnyOverlayVisible.value) {
    overlays.hideAboutOverlay();
    overlays.hideSubmitDeskOverlay();
    // Don't return here - continue with the normal photo viewer close logic
  }

  if (store.selectedDesk) {
    pick(store.selectedDesk);
  }
}

/**
 * Handle desk submission from the form
 * @param {FormData} formData - The submitted desk data with images
 */
function handleDeskSubmission(formData) {
  console.log('Desk submission received:', formData);

  // TODO: Implement submission to backend (Supabase)
  // For now, just log the data and show a success message
  alert('Thank you for your submission! We\'ll review your desk and get back to you soon.');
}

function changeDesk(desk) {
  store.setDeskSwitching(true); // Lock UI during desk switching
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
      // Desk switching will be unlocked when the first photo loads
    }, 100);
  }, 400); // Wait for fade-out transition (0.4s)
}

// This is the main function that orchestrates the opening and closing of a desk item.
function pick(desk, isDirectLoading = false) {
  const galleryRef = galleryComponentRef.value?.galleryRef;
  if (!galleryRef) return;
  const deskElement = galleryRef.querySelector(`.gallery-item[data-desk-id="${desk.id}"]`);
  if (!deskElement) return;

  const isClosing = store.selectedDeskClone && store.selectedDeskClone.desk.id === desk.id;

  if (isClosing) {
    document.body.style.overflow = ''; // Re-enable scrolling
    router.push('/'); // Change the URL back to the root.
    store.setSelectedDeskId(null);
    // Clear any pending flash effect when closing
    store.setPendingFlashEffect(null);
  } else {
    document.body.style.overflow = 'hidden'; // Disable scrolling
    if (route.path !== '/' + desk.id) {
      router.push('/' + desk.id); // Change the URL to the specific desk.
    }
    store.setSelectedDeskId(desk.id);
    store.setInitialPhotoLoading(true); // Lock UI until first photo loads
    store.setPhotoViewerReady(false); // Ensure PhotoViewer is not ready until fully loaded
  }

  // --- Pop-in/Pop-out Animation Logic ---

  // If we are closing an item (the clone already exists).
  if (store.selectedDeskClone && store.selectedDeskClone.desk.id === desk.id) {
    const { cloneEl } = store.selectedDeskClone;
    const finalRect = deskElement.getBoundingClientRect(); // Get final position

    // Hide the photo viewer, which will trigger its own internal animations
    store.setPhotoViewerVisible(false);
    store.setPhotoViewerReady(false);

    // Restore the clone's screen to the original desk screen image
    const screenEl = cloneEl.querySelector('.desk-screen');
    if (screenEl && desk.profile) {
      screenEl.style.backgroundImage = `url(${desk.profile})`;
    }

    // Animate the clone back to its original position in the grid.
    gsap.to(cloneEl, {
      top: finalRect.top + window.scrollY,
      left: finalRect.left,
      width: finalRect.width,
      height: finalRect.height,
      opacity: 1,
      duration: 1,
      ease: 'bounce.out',
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

        // Resume gallery effects when returning to gallery view
        if (galleryComponentRef.value?.resumeGalleryEffects) {
          galleryComponentRef.value.resumeGalleryEffects();
        }

        // Re-enable gallery effects for future interactions
        galleryEffects.setEffectsEnabled(true);

        // Delay the removal of the clone to allow the gallery to fade in
        setTimeout(() => {
          cloneEl.remove(); // Remove the clone from the DOM.
        }, ANIMATION_DURATION * 1000); // Match the transition duration
      }
    });

    // Auto-scroll to ensure the original desk position will be visible in viewport
    // This happens simultaneously with the clone animation
    const currentDeskRect = deskElement.getBoundingClientRect();
    const isCurrentlyVisible = (
      currentDeskRect.top >= 0 &&
      currentDeskRect.left >= 0 &&
      currentDeskRect.bottom <= window.innerHeight &&
      currentDeskRect.right <= window.innerWidth
    );

    if (!isCurrentlyVisible) {
      // Calculate the scroll position to center the desk in the viewport
      const scrollTop = currentDeskRect.top + window.scrollY - (window.innerHeight / 2) + (currentDeskRect.height / 2);

      // Smooth scroll to the desk position (happens simultaneously with clone animation)
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }

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

  // Force default cursor on clone and all its children
  cloneEl.style.cursor = 'default';
  const allElements = cloneEl.querySelectorAll('*');
  allElements.forEach(el => {
    el.style.cursor = 'default';
  });

  // Style the clone to be positioned exactly on top of the original.
  cloneEl.style.position = 'absolute'; // Use absolute positioning
  cloneEl.style.zIndex = '10'; // Ensure it's above the backdrop and everything else
  document.body.appendChild(cloneEl);
  deskElement.style.visibility = 'hidden'; // Hide the original item.
  store.addHiddenDeskId(desk.id); // Track this desk as hidden

  // Show the photo viewer immediately when clone is created
  store.setPhotoViewerVisible(true);

  if (isDirectLoading) {
    // For direct loading: Position clone immediately at center and skip animations
    const cloneWidth = cloneEl.offsetWidth;
    const cloneHeight = cloneEl.offsetHeight;
    const targetLeft = (window.innerWidth - cloneWidth) / 2;
    const targetTop = (window.innerHeight - cloneHeight) / 2 + window.scrollY;

    // Set clone immediately to center position
    cloneEl.style.top = targetTop + 'px';
    cloneEl.style.left = targetLeft + 'px';
    cloneEl.style.width = rect.width + 'px';
    cloneEl.style.height = rect.height + 'px';

    // Set text color to white immediately
    const nameEl = cloneEl.querySelector('.desk-name');
    const descEl = cloneEl.querySelector('.desk-desc');
    if (nameEl) nameEl.style.color = 'white';
    if (descEl) descEl.style.color = 'white';

    // Fade out the gallery immediately
    store.setGalleryFaded(true);
    store.setSelectedDeskClone({ desk, originalRect: rect, cloneEl }); // Store the clone's state.

    // Set up flashing effect immediately
    if (cloneEl.querySelector('.desk-screen') && desk.screen && desk.screen.firstPhoto) {
      store.setPendingFlashEffect({
        screenEl: cloneEl.querySelector('.desk-screen'),
        firstPhotoUrl: desk.screen.firstPhoto
      });
    }
  } else {
    // For normal gallery clicks: Animate from gallery position to center
    cloneEl.style.top = rect.top + window.scrollY + 'px';
    cloneEl.style.left = rect.left + 'px';
    cloneEl.style.width = rect.width + 'px';
    cloneEl.style.height = rect.height + 'px';

    // Fade out the rest of the gallery.
    store.setGalleryFaded(true);
    store.setSelectedDeskClone({ desk, originalRect: rect, cloneEl }); // Store the clone's state.

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
        // Store the desk and screen element for later use when photos are loaded
        if (cloneEl.querySelector('.desk-screen') && desk.screen && desk.screen.firstPhoto) {
          // Store the flashing effect data to be triggered when photos finish loading
          store.setPendingFlashEffect({
            screenEl: cloneEl.querySelector('.desk-screen'),
            firstPhotoUrl: desk.screen.firstPhoto
          });
        }
      }
    });

    gsap.to([cloneEl.querySelector('.desk-name'), cloneEl.querySelector('.desk-desc')], {
      color: 'white',
      duration: ANIMATION_DURATION,
      ease: 'power2.inOut',
      delay: 0.2, // Slight delay to allow the gallery to fade out
    });
  }

}

function onFirstPhotoLoaded(photoUrl) {
  // Unlock UI states when first photo is loaded
  store.setInitialPhotoLoading(false);
  store.setDeskSwitching(false);

  // Complete the desk slider animation when photo is loaded
  if (deskSliderRef.value) {
    setTimeout(() => {
      deskSliderRef.value.completePhotoLoadAnimation();
    }, 500); // Delay slightly to ensure the photo is fully loaded
  }
}

function onPhotoViewerReady() {
  // Trigger the flashing effect when PhotoViewer is ready (all photos loaded)
  const pendingFlash = store.pendingFlashEffect;
  if (pendingFlash && pendingFlash.screenEl && pendingFlash.firstPhotoUrl) {
    // Play photoviewer load sound effect
    audioManager.play('photoviewer_load');

    // Update the reactive screen image using the callback (if available) or fallback to direct DOM manipulation
    if (pendingFlash.updateScreenImage && pendingFlash.deskId) {
      pendingFlash.updateScreenImage(pendingFlash.deskId, pendingFlash.firstPhotoUrl);
    } else {
      // Fallback for gallery → PhotoViewer (where there's no reactive state)
      pendingFlash.screenEl.style.backgroundImage = `url(${pendingFlash.firstPhotoUrl})`;
    }

    // Create a longer lasting flashing effect using GSAP timeline for better control
    const flashTl = gsap.timeline();

    // Create multiple flash cycles explicitly
    for (let i = 0; i < 5; i++) {
      flashTl
        .to(pendingFlash.screenEl, { filter: 'brightness(0)', duration: 0.02, ease: 'none' })
        .to(pendingFlash.screenEl, { filter: 'brightness(1)', duration: 0.02, ease: 'none' });
    }

    // Ensure it ends with the image visible
    flashTl.to(pendingFlash.screenEl, { filter: 'brightness(1)', duration: 0.05, ease: 'none' });

    // Clear the pending flash effect
    store.setPendingFlashEffect(null);
  }
}

function onFlashingComplete() {
  // Now that the flashing effect is complete and slider is visible, handle cleanup

  // If there's a clone element (from gallery selection), fade it out
  if (store.selectedDeskClone) {
    gsap.to(store.selectedDeskClone.cloneEl, {
      opacity: 0,
      // duration: 0.8,
      duration: 0,
      delay: 0.3, // Small delay after slider appears for smooth transition
      ease: 'power2.inOut',
      onComplete: () => {
        // Cleanup after fade out

        // If there's a pending DeskSlider animation (from desk switching), complete it
        if (deskSliderRef.value) {
          deskSliderRef.value.completeFlashingAnimation();
        }
      }
    });
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
    <!-- Loading Screen (show until all images are loaded) -->
    <LoadingScreen
      v-if="!isAppLoaded"
      @loading-complete="onLoadingComplete"
    />

    <!-- Main App Content (show only after loading is complete) -->
    <Transition
      name="app-fade"
      appear
    >
      <div
        v-if="isAppLoaded"
        class="app-content"
      >
        <header class="header">
          <div
            class="logo"
            :class="{
              'viewer-active': store.isPhotoViewerVisible || overlays.isAnyOverlayVisible.value,
              'logo-disabled': !store.isLogoClickable
            }"
            aria-label="Desk Tribute Home (click to close viewer)"
            @click="store.isLogoClickable && (store.isPhotoViewerVisible || overlays.isAnyOverlayVisible.value) && (audioManager.play('header_click'), handlePhotoViewerClose())"
            @mouseenter="store.isLogoClickable && (store.isPhotoViewerVisible || overlays.isAnyOverlayVisible.value) && audioManager.play('header_hover')"
          >DESK <em>Tribute</em> <span>WHERE CREATIVITY IS BORN</span></div>

          <nav class="nav-menu">
            <a
              href="#"
              class="nav-item back-to-list"
              :class="{
                'visible': store.isPhotoViewerVisible || (overlays.isAnyOverlayVisible.value && store.isPhotoViewerVisible),
                'disabled': !store.isLogoClickable
              }"
              @click="store.isLogoClickable && (store.isPhotoViewerVisible || overlays.isAnyOverlayVisible.value) && (audioManager.play('header_click'), handlePhotoViewerClose())"
              @mouseenter="store.isLogoClickable && (store.isPhotoViewerVisible || overlays.isAnyOverlayVisible.value) && audioManager.play('header_hover')"
            >BACK TO LIST</a>
            <a
              href="#"
              class="nav-item"
              :class="{ 'active': overlays.isAboutOverlayVisible.value }"
              @click="audioManager.play('header_click'), overlays.showAboutOverlay()"
              @mouseenter="audioManager.play('header_hover')"
            >ABOUT</a>
            <a
              href="#"
              class="nav-item"
              :class="{ 'active': overlays.isSubmitDeskOverlayVisible.value }"
              @click="audioManager.play('header_click'), overlays.showSubmitDeskOverlay()"
              @mouseenter="audioManager.play('header_hover')"
            >SUBMIT YOUR DESK</a>
            <a
              href="#"
              class="nav-item audio-toggle"
              :class="{ 'muted': isAudioMuted }"
              @click="toggleAudioMute()"
              @mouseenter="!isAudioMuted && audioManager.play('header_hover')"
              title="Toggle Sound Effects"
            >
              <img
                :src="isAudioMuted ? IconSpeakerOff : IconSpeakerOn"
                alt="Speaker"
                width="15"
                height="15"
              />
            </a>
          </nav>
        </header>

        <DeskGallery
          ref="galleryComponentRef"
          :desks="store.desks"
          :is-gallery-faded="store.isGalleryFaded"
          :selected-desk-clone="store.selectedDeskClone"
          :should-start-effects="shouldStartGalleryEffects"
          @pick="pick"
        />

        <DeskSlider
          ref="deskSliderRef"
          :desks="store.desks"
          :selected-desk-id="store.selectedDeskId"
          :is-interactive="store.isDeskSliderInteractive"
          @change-desk="changeDesk"
        />

        <PhotoViewer
          :desk="store.selectedDesk"
          :visible="store.isPhotoViewerVisible"
          :is-slider-visible="store.isPhotoSliderVisible"
          @close="handlePhotoViewerClose"
          @first-photo-loaded="onFirstPhotoLoaded"
          @flashing-complete="onFlashingComplete"
          @is-transitioning="isTransitioning => store.setPhotoSliderTransitioning(isTransitioning)"
          @photo-viewer-ready="ready => {
            store.setPhotoViewerReady(ready);
            if (ready) onPhotoViewerReady();
          }"
        />

        <!-- Unified Overlay -->
        <Transition name="overlay-fade">
          <div
            v-if="overlays.isAnyOverlayVisible.value"
            class="overlay"
          >
            <!-- About Content -->
            <Transition name="content-fade">
              <div
                v-if="overlays.isAboutOverlayVisible.value"
                key="about"
                class="overlay-content about-content"
              >
                <button
                  class="close-button"
                  @click="audioManager.play('photoviewer_click'), overlays.hideAboutOverlay()"
                  @mouseenter="audioManager.play('photoviewer_hover')"
                >✕</button>
                <div class="overlay-text about-text">
                  <h2>About Desk Tribute</h2>
                  <h3>Preserving a 2011 creative web idea</h3>
                  <p class="about-body">People who create spend long hours at a desk. The tools, screens and small
                    artifacts gathered there quietly express process, taste and intent. This project rebuilds (for
                    modern browsers) the mood of the original 2011 Flash site <a
                      href="https://desk.cmiscm.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >Desk</a> by Jongmin Kim. It is independent, unofficial and strictly non‑commercial - no ads,
                    tracking
                    or monetization. Original concept & design: Jongmin Kim (2011). New code implementation © 2025.
                    Submitted photos remain the property of their creators. For inclusion, removal, attribution changes
                    or takedown requests email <a href="mailto:admin@example.com">admin@example.com</a>. If the original
                    creator requests, this tribute will be modified or withdrawn.</p>
                  <p class="small-attrib">Unofficial homage. All trademarks & copyrights belong to their respective
                    owners.</p>
                </div>
              </div>
            </Transition>

            <!-- Submit Desk Content -->
            <Transition name="content-fade">
              <div
                v-if="overlays.isSubmitDeskOverlayVisible.value"
                key="submit"
                class="overlay-content"
              >
                <button
                  class="close-button"
                  @click="audioManager.play('photoviewer_click'), overlays.hideSubmitDeskOverlay()"
                  @mouseenter="audioManager.play('photoviewer_hover')"
                >✕</button>
                <DeskSubmissionForm
                  @close="overlays.hideSubmitDeskOverlay"
                  @submit="handleDeskSubmission"
                />
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </Transition>
  </main>
</template>

<style scoped lang="scss">
main {
  background-color: #E8E8E8;
  padding-bottom: 3rem; // Add some padding to the bottom
  min-width: 650px;
}

/* App fade-in transition */
.app-fade-enter-active {
  transition: opacity 0.6s ease-in;
}

.app-fade-leave-active {
  transition: opacity 0.4s ease-out;
}

.app-fade-enter-from,
.app-fade-leave-to {
  opacity: 0;
}

.app-fade-enter-to,
.app-fade-leave-from {
  opacity: 1;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  min-width: 650px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px 20px 0 20px;
  z-index: 200;
  pointer-events: none; // Allow clicks to pass through to content below
}

.logo {
  position: static; // Changed from fixed
  font-size: 1.2rem;
  letter-spacing: 0.05rem;
  font-weight: bold;
  color: black; // Dark gray
  transition: color 0.4s ease;
  cursor: default;
  pointer-events: auto; // Enable clicks on logo

  span {
    padding-left: 0.5rem;
    font-size: 0.6rem;
    font-weight: bold;
    letter-spacing: normal;
    opacity: 0.7;
    color: #666;
    transition: color 0.4s ease;
  }

  &.viewer-active {
    color: white;
    cursor: pointer;

    span {
      color: white;
    }
  }

  &.logo-disabled {
    cursor: not-allowed;
  }
}

.nav-menu {
  position: static; // Changed from fixed
  margin-top: 9px; // Adjust to align with logo baseline
  display: flex;
  gap: 30px;
  pointer-events: auto; // Enable clicks on nav items

  .nav-item {
    color: black;
    text-decoration: none;
    font-size: 0.7rem;
    font-weight: bold;
    transition: color 0.4s ease, opacity 0.3s ease;
    cursor: pointer;
    opacity: 1;

    &.back-to-list {
      opacity: 0;
      visibility: hidden;
      transition: color 0.4s ease, opacity 0.3s ease, visibility 0.3s ease;

      &.visible {
        opacity: 0.4;
        visibility: visible;

        &:hover {
          opacity: 1;
        }
      }

      &.disabled {
        cursor: not-allowed;
      }
    }
  }

  // Hover effect: fade non-hovered items (but not when overlay is visible)
  &:hover:not(:has(~ .overlay)) .nav-item:not(:hover) {
    opacity: 0.4;
  }

  // When overlay is visible, special hover behavior
  &:has(~ .overlay) {
    .nav-item {
      opacity: 0.4;

      &.active {
        opacity: 1;
      }
    }

    // Override hover behavior when overlay is visible
    &:hover .nav-item:not(:hover) {
      opacity: 0.4;
    }

    &:hover .nav-item:hover {
      opacity: 1;
    }
  }

  // When photo viewer is active OR any overlay is visible, change nav items to white
  .app-content:has(.logo.viewer-active) & .nav-item,
  .app-content:has(.overlay) & .nav-item {
    color: white;

    // Make speaker icon white when viewer is active or overlay is visible
    &.audio-toggle img {
      filter: brightness(0) invert(1); // Convert black to white
    }
  }
}

// Audio toggle specific styles
.nav-item.audio-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  margin-top: 1px;

  img {
    transition: opacity 0.3s ease, filter 0.4s ease;
    filter: brightness(0); // Make the black SVG appear as the current text color
  }

  &:hover {
    img {
      opacity: 0.8;
    }
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
    z-index: 2; // Lower z-index but still clickable
    // cursor: pointer; // Visual indication that it's clickable
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

.desk-clone {
  cursor: default !important;

  .desk-monitor,
  .desk-screen,
  .desk-decor,
  .desk-name,
  .desk-desc,
  * {
    cursor: default !important;
  }
}

/* Unified Overlay Styles */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  min-width: 650px;
}

.overlay-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

.overlay-text {
  color: white;
  text-align: left;
}

.overlay-text h2 {
  font-size: 2.2rem;
  font-weight: 200;
}

.overlay-text h3 {
  font-size: 1.2rem;
  font-weight: 200;
  color: #999;
  margin-bottom: 2rem;
}

.overlay-text p {
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.5rem;
  margin-bottom: 1.5rem;
  max-width: 600px;
}

.overlay-text .disclaimer {
  font-size: 0.8rem;
  color: #999;
  margin-top: 1rem;
}

.overlay-text a {
  color: #ccc;
  font-weight: bold;
}

.overlay-text .small-attrib {
  font-size: 0.7rem;
  color: #777;
  margin-top: .5rem;
}

.close-button {
  position: absolute;
  top: -1rem;
  right: -1rem;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  z-index: 1;
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), color 0.5s ease;
}

.close-button:hover {
  color: #ccc;
  transform: rotate(180deg);
}

/* Transition animations */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.content-fade-enter-active,
.content-fade-leave-active {
  transition: opacity 0.5s ease;
}

.content-fade-enter-from,
.content-fade-leave-to {
  opacity: 0;
}
</style>