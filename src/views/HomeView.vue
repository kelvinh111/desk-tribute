<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, reactive } from 'vue'
import Masonry from 'masonry-layout'
import itemsData from '../model/desk.json'
import { useRouter, useRoute } from 'vue-router'
import { gsap } from 'gsap'

// --- Configuration Constants ---
const BASE_SLIDER_ITEM_WIDTH = 70;
const EXPANDED_SLIDER_ITEM_WIDTH = 140;
const BASE_SLIDER_ITEM_HEIGHT = 68;
const EXPANDED_SLIDER_ITEM_HEIGHT = 136;
const ANIMATION_DURATION = 0.6;
const HOVER_ANIMATION_DURATION = 0.4;
const THROW_MULTIPLIER = 400; // Restored for longer throw distance
const COLUMN_WIDTH = 285; // This is the width of each column in the Masonry gallery.
const GUTTER = 35; // The space between gallery items in the Masonry layout.
const CAROUSEL_GUTTER = 20; // The space between slider items in the carousel.

const windowWidth = ref(0)

// --- Refs for DOM Elements ---
const galleryRef = ref(null) // Ref for the main masonry gallery container.
const desks = ref(itemsData) // Reactive ref holding the array of desk data.
let masonryInstance = null // Will hold the Masonry layout instance.
let selectedDeskClone = null // Will hold the cloned element for the pop-out animation.
const sliderRef = ref(null) // Ref for the carousel container at the bottom.
let positionSliderItems = null; // Will hold the function that calculates and sets slider item positions.
let needsPositionUpdate = false; // Flag to track when positioning update is needed.
let isCarouselLocked = false; // Flag to prevent carousel interaction during animations.

// --- State Management ---

// Manages the selection and hover state of the carousel.
const selectionState = reactive({
  selectedIndex: null, // The index of the currently "picked" desk.
  progress: 0, // An animation progress value (0 to 1) for the selected desk's expansion.
  hoverStates: [], // An array to track the hover progress for each slider item individually.
})

// Manages the state of our custom draggable carousel.
const carousel = reactive({
  x: 0, // The current horizontal scroll position of the carousel.
  isDragging: false, // True if the user is currently dragging the carousel.
  hasDragged: false, // True if the user has moved the pointer more than the threshold, distinguishing a drag from a click.
  isPointerDown: false, // True for the entire duration from pointerdown to pointerup, used to freeze hover effects.
  startX: 0, // The initial clientX position of the pointer on pointerdown.
  startScrollX: 0, // The value of carousel.x on pointerdown.
  lastX: 0, // The last recorded x position during a drag, used for velocity calculation.
  lastTime: 0, // The timestamp of the last recorded position, for velocity calculation.
  velocityX: 0, // The calculated velocity of the drag, used for the "flick" animation on release.
})

// --- Vue Router ---
const router = useRouter() // Used to programmatically change the URL (e.g., router.push('/')).
const route = useRoute() // Used to read information from the current URL (e.g., route.params.deskId).

const handleResize = () => {
  windowWidth.value = window.innerWidth
  // Update Masonry layout
  if (masonryInstance) masonryInstance.layout()
  // If a clone exists, keep it centered.
  if (selectedDeskClone) {
    updateCloneCenterTransform()
  }
  // Reposition slider items on resize
  if (positionSliderItems && carousel) {
    positionSliderItems(carousel.x);
    markForUpdate();
  }
}

const shuffleArray = () => {
  desks.value = desks.value
    .map(desk => ({ desk, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ desk }) => desk)
  nextTick(() => {
    if (masonryInstance) {
      masonryInstance.reloadItems()
      masonryInstance.layout()
    }
  })
}

const galleryWidth = () => {
  const numberOfColumns = Math.min(desks.value.length, Math.floor(windowWidth.value / COLUMN_WIDTH));
  const calculatedWidth = COLUMN_WIDTH * numberOfColumns + GUTTER * (numberOfColumns - 1);

  if (calculatedWidth <= windowWidth.value) {
    // If the calculated width is less than or equal to the window width, return it directly.
    return `${calculatedWidth}px`
  } else {
    return `${calculatedWidth - COLUMN_WIDTH - GUTTER}px`
  }
}

const updateCloneCenterTransform = () => {
  if (!selectedDeskClone) return
  const { cloneEl } = selectedDeskClone
  const cloneWidth = cloneEl.offsetWidth
  const cloneHeight = cloneEl.offsetHeight
  const targetLeft = (window.innerWidth - cloneWidth) / 2
  const targetTop = (window.innerHeight - cloneHeight) / 2 + window.scrollY
  gsap.to(cloneEl, {
    top: targetTop,
    left: targetLeft,
    duration: 0, // Instantly move it
  });
}

// The main animation loop, powered by GSAP's ticker for performance.
function onTick() {
  // Only update positions when necessary instead of every frame
  if (needsPositionUpdate && positionSliderItems) {
    positionSliderItems(carousel.x);
    needsPositionUpdate = false;
  }
}

// Helper function to mark that positions need updating
function markForUpdate() {
  needsPositionUpdate = true;
}

// A helper function to calculate the carousel's total width and valid drag range.
function getCarouselBounds() {
  const slider = sliderRef.value;
  if (!slider) return { minX: 0, maxX: 0 };

  const numSliderItems = desks.value.length;

  // This logic is crucial. It calculates the carousel's total width at any given moment,
  // accounting for the expansion of both the selected item and any hovered item.
  const totalHoverProgress = selectionState.hoverStates.reduce((sum, state) => sum + state.progress, 0);
  const suppressionFactor = 1 - Math.min(1, totalHoverProgress); // If something is hovered, suppress the selected item's expansion.
  const effectiveSelectedProgress = selectionState.progress * suppressionFactor;

  let dynamicContentWidth = 0;
  for (let i = 0; i < numSliderItems; i++) {
    const hoverProgress = selectionState.hoverStates[i]?.progress || 0;
    let width = BASE_SLIDER_ITEM_WIDTH;
    if (hoverProgress > 0) {
      // If a slider item is hovered, calculate its width based on its hover progress.
      width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * hoverProgress;
    } else if (i === selectionState.selectedIndex) {
      // Otherwise, if it's the selected slider item, calculate its width based on its selection progress.
      width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * effectiveSelectedProgress;
    }
    dynamicContentWidth += width;
  }

  if (numSliderItems > 0) {
    dynamicContentWidth += (numSliderItems - 1) * CAROUSEL_GUTTER;
  }

  const sliderWidth = slider.offsetWidth;
  // The minimum X is the negative difference between the content width and the container width.
  // This prevents dragging past the last item. It's clamped at 0 for the case where content is smaller than the container.
  const minX = Math.min(0, -(dynamicContentWidth - sliderWidth));
  return { minX, maxX: 0 }; // maxX is always 0 because we can't drag past the beginning.
}

// --- Custom Pointer Handlers for the Carousel ---

// Called when the user presses down on the carousel.
function handlePointerDown(event) {
  if (isCarouselLocked) return; // Prevent interaction when carousel is locked

  gsap.killTweensOf(carousel); // Stop any ongoing "flick" animation immediately.
  carousel.isDragging = true; // Set the main dragging flag.
  carousel.isPointerDown = true; // Set the flag to freeze hover effects.
  carousel.hasDragged = false; // Reset the "hasDragged" flag for the new interaction.
  // Record the starting position of the pointer and the carousel.
  carousel.startX = event.clientX;
  carousel.startScrollX = carousel.x;
  // Reset velocity tracking.
  carousel.lastX = carousel.x;
  carousel.lastTime = Date.now();
  carousel.velocityX = 0;
  // Add global listeners to track the pointer's movement and release anywhere on the page.
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

// Called whenever the user moves the pointer after pressing down.
function handlePointerMove(event) {
  if (!carousel.isDragging) return;

  const dx = event.clientX - carousel.startX; // Calculate the distance moved from the start.

  // This is the logic that distinguishes a "click" from a "drag".
  // If the pointer has moved more than 5 pixels, we set hasDragged to true.
  if (!carousel.hasDragged && Math.abs(dx) > 5) {
    carousel.hasDragged = true;
  }

  // Prevent default browser behavior (like selecting text) only if it's a real drag.
  if (carousel.hasDragged) {
    event.preventDefault();
  }

  const newX = carousel.startScrollX + dx; // Calculate the new target scroll position.

  const bounds = getCarouselBounds(); // Get the current valid drag range.
  carousel.x = gsap.utils.clamp(bounds.minX, bounds.maxX, newX); // Clamp the position within the bounds.
  markForUpdate(); // Mark that positions need updating

  // Continuously calculate the velocity for the "flick" effect.
  const now = Date.now();
  const dt = now - carousel.lastTime;
  if (dt > 0) {
    carousel.velocityX = (carousel.x - carousel.lastX) / dt;
  }
  carousel.lastX = carousel.x;
  carousel.lastTime = now;
}

// Called when the user releases the pointer.
function handlePointerUp() {
  if (!carousel.isDragging) return;
  carousel.isDragging = false; // Unset the main dragging flag.
  carousel.isPointerDown = false; // Unfreeze the hover effects.

  // Clean up the global listeners.
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);

  // If the user was dragging, create a "flick" or "inertia" animation.
  const throwDistance = carousel.velocityX * THROW_MULTIPLIER; // Calculate how far to throw based on final velocity.
  let targetX = carousel.x + throwDistance;

  const bounds = getCarouselBounds(); // Get the final bounds.
  const originalTargetX = targetX; // Store the unclamped target for bounce detection
  targetX = gsap.utils.clamp(bounds.minX, bounds.maxX, targetX); // Clamp the target within bounds.

  // Check if we hit a boundary and add bounce effect
  const hitLeftBound = originalTargetX < bounds.minX;
  const hitRightBound = originalTargetX > bounds.maxX;
  const hitBoundary = hitLeftBound || hitRightBound;

  // Animate the carousel to the final target position.
  gsap.to(carousel, {
    x: targetX,
    duration: hitBoundary ? ANIMATION_DURATION : ANIMATION_DURATION * 1.5, // Longer duration for smooth throw
    ease: hitBoundary ? 'back.out(1.7)' : 'power3.out', // Use bounce easing when hitting boundary
    onUpdate: markForUpdate, // Mark for update during animation
  });
}


onMounted(() => {
  // Add our onTick function to GSAP's global ticker.
  gsap.ticker.add(onTick);

  // nextTick ensures that the component has been rendered to the DOM before we try to access its elements.
  nextTick(() => {
    // Initialize the Masonry gallery layout.
    masonryInstance = new Masonry(galleryRef.value, {
      itemSelector: '.gallery-item',
      columnWidth: COLUMN_WIDTH,
      gutter: GUTTER,
    });

    // --- Carousel Initialization ---
    const slider = sliderRef.value;
    if (!slider) return;
    gsap.set(slider, { autoAlpha: 0 }); // Hide slider initially.

    const sliderItems = gsap.utils.toArray(slider.querySelectorAll('.slider-item'));
    const numSliderItems = sliderItems.length;

    selectionState.hoverStates = sliderItems.map(() => ({ progress: 0 })); // Initialize hover state for each slider item.

    // Set the initial visual state of all slider items.
    gsap.set(sliderItems, {
      width: BASE_SLIDER_ITEM_WIDTH,
      height: BASE_SLIDER_ITEM_HEIGHT,
      x: (i) => i * (BASE_SLIDER_ITEM_WIDTH + CAROUSEL_GUTTER),
    });

    // This is the core layout function for the carousel.
    positionSliderItems = (dragX) => {
      // It calculates the width, scale, and position of every slider item based on the
      // current selection and hover states. This function is called on every frame by onTick.
      const totalHoverProgress = selectionState.hoverStates.reduce((sum, state) => sum + state.progress, 0);
      const suppressionFactor = 1 - Math.min(1, totalHoverProgress);
      const effectiveSelectedProgress = selectionState.progress * suppressionFactor;

      const sliderItemData = sliderItems.map((sliderItem, i) => {
        const hoverProgress = selectionState.hoverStates[i].progress;
        let width = BASE_SLIDER_ITEM_WIDTH;
        let height = BASE_SLIDER_ITEM_HEIGHT;
        let opacity = 0.5;

        if (hoverProgress > 0) {
          width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * hoverProgress;
          height = BASE_SLIDER_ITEM_HEIGHT + (EXPANDED_SLIDER_ITEM_HEIGHT - BASE_SLIDER_ITEM_HEIGHT) * hoverProgress;
          opacity = 0.5 + 0.5 * hoverProgress;
        } else if (i === selectionState.selectedIndex) {
          width = BASE_SLIDER_ITEM_WIDTH + (EXPANDED_SLIDER_ITEM_WIDTH - BASE_SLIDER_ITEM_WIDTH) * effectiveSelectedProgress;
          height = BASE_SLIDER_ITEM_HEIGHT + (EXPANDED_SLIDER_ITEM_HEIGHT - BASE_SLIDER_ITEM_HEIGHT) * effectiveSelectedProgress;
          opacity = 0.5 + 0.5 * effectiveSelectedProgress;
        }
        return { width, height, opacity };
      });

      // Calculate the starting X position for each slider item based on the widths of the preceding slider items.
      let dynamicInitialX = [];
      let currentX = 0;
      sliderItemData.forEach(data => {
        dynamicInitialX.push(currentX);
        currentX += data.width + CAROUSEL_GUTTER;
      });

      // Apply the final transform to each slider item.
      sliderItems.forEach((sliderItem, i) => {
        const data = sliderItemData[i];
        const x = dynamicInitialX[i] + dragX; // The slider item's base position plus the current drag amount.
        gsap.set(sliderItem, { x, width: data.width, height: data.height, opacity: data.opacity });
      });
    };

    // --- Hover Event Listeners ---
    sliderItems.forEach((sliderItem, index) => {
      sliderItem.addEventListener('mouseenter', () => {
        // The hover effect is frozen if the user is pressing down on the carousel.
        if (carousel.isPointerDown || selectionState.selectedIndex === null) return;

        // If hovering over the already-selected slider item, just ensure no other slider items are in a hover state.
        if (index === selectionState.selectedIndex) {
          selectionState.hoverStates.forEach((state, i) => {
            if (i !== index) {
              gsap.to(state, { progress: 0, duration: HOVER_ANIMATION_DURATION, ease: 'power2.out', overwrite: 'auto' });
            }
          });
          return;
        }

        // If hovering a new slider item, animate its progress to 1 and all others to 0.
        gsap.to(selectionState.hoverStates[index], {
          progress: 1,
          duration: HOVER_ANIMATION_DURATION,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: markForUpdate
        });
        selectionState.hoverStates.forEach((state, i) => {
          if (i !== index) {
            gsap.to(state, {
              progress: 0,
              duration: HOVER_ANIMATION_DURATION,
              ease: 'power2.out',
              overwrite: 'auto',
              onUpdate: markForUpdate
            });
          }
        });
      });
    });

    // When the mouse leaves the entire slider area, reset all hover states.
    slider.addEventListener('mouseleave', () => {
      if (carousel.isPointerDown || selectionState.selectedIndex === null) return;
      selectionState.hoverStates.forEach(state => {
        gsap.to(state, {
          progress: 0,
          duration: HOVER_ANIMATION_DURATION,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: markForUpdate
        });
      });
    });

    // Attach our custom drag handler.
    slider.addEventListener('pointerdown', handlePointerDown);

    positionSliderItems(0); // Perform an initial layout.
    markForUpdate(); // Ensure initial update happens

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
  });

  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // It's crucial to clean up global listeners and tickers to prevent memory leaks when the component is destroyed.
  gsap.ticker.remove(onTick);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('resize', handleResize)
})

// This is the main function that orchestrates the opening and closing of a desk item.
function pick(desk) {
  const deskElement = galleryRef.value.querySelector(`.gallery-item[data-desk-id="${desk.id}"]`)
  if (!deskElement) return

  // --- Carousel Animation Logic ---
  if (sliderRef.value) {
    const index = desks.value.findIndex(d => d.id === desk.id);
    if (index !== -1) {
      // Check if we are closing the currently open desk.
      const isClosing = selectedDeskClone && selectedDeskClone.desk.id === desk.id;

      if (isClosing) {
        document.body.style.overflow = ''; // Re-enable scrolling
        router.push('/'); // Change the URL back to the root.
        selectionState.hoverStates.forEach(state => { state.progress = 0; }); // Reset hovers.
        gsap.to(sliderRef.value, { autoAlpha: 0, duration: ANIMATION_DURATION, ease: 'power2.inOut' }); // Fade out the carousel.
        // Animate the selection progress back to 0 to shrink the selected slider item.
        gsap.to(selectionState, {
          progress: 0,
          duration: ANIMATION_DURATION,
          ease: 'power2.inOut',
          onUpdate: markForUpdate, // Mark for update during closing animation
          onComplete: () => { selectionState.selectedIndex = null; } // Reset selection on complete.
        });
      } else { // This is the "opening" logic.
        document.body.style.overflow = 'hidden'; // Disable scrolling
        if (route.path !== '/' + desk.id) {
          router.push('/' + desk.id); // Change the URL to the specific desk.
        }
        gsap.to(sliderRef.value, { autoAlpha: 1, duration: ANIMATION_DURATION, ease: 'power2.inOut' }); // Fade in the carousel.
        selectionState.selectedIndex = index; // Set the new selected index.

        const slider = sliderRef.value;
        const sliderWidth = slider.offsetWidth;
        const numSliderItems = desks.value.length;
        const activeSliderItem = slider.querySelectorAll('.slider-item')[index];
        const activeSliderItemContent = activeSliderItem.querySelector('.slider-item-content');

        // Set the slider item content to be fully transparent initially
        gsap.set(activeSliderItemContent, { autoAlpha: 0 });

        // Calculate the layout of the carousel in its final "opened" state.
        let dynamicInitialX = [];
        let currentX = 0;
        for (let i = 0; i < numSliderItems; i++) {
          dynamicInitialX.push(currentX);
          currentX += ((i === index) ? EXPANDED_SLIDER_ITEM_WIDTH : BASE_SLIDER_ITEM_WIDTH) + CAROUSEL_GUTTER;
        }
        const dynamicContentWidth = currentX - (numSliderItems > 0 ? CAROUSEL_GUTTER : 0);

        // Calculate the target scroll position to perfectly center the selected slider item.
        const targetX = (sliderWidth / 2 - EXPANDED_SLIDER_ITEM_WIDTH / 2) - dynamicInitialX[index];

        // Calculate the bounds for the final state.
        const finalBounds = {
          minX: Math.min(0, -(dynamicContentWidth - sliderWidth)),
          maxX: 0
        };
        const clampedTargetX = gsap.utils.clamp(finalBounds.minX, finalBounds.maxX, targetX);

        // Create a timeline to synchronize the selection progress animation and the scroll animation.
        const tl = gsap.timeline();
        tl.to(selectionState, {
          progress: 1,
          duration: ANIMATION_DURATION,
          ease: 'power2.inOut',
          onUpdate: markForUpdate // Mark for update during selection animation
        }, 0);
        tl.to(carousel, {
          x: clampedTargetX,
          duration: ANIMATION_DURATION,
          ease: 'power2.inOut',
          onUpdate: markForUpdate // Mark for update during scroll animation
        }, 0);

        // Add the slider item content animation to the timeline, starting after the previous animations complete
        tl.call(() => {
          // Lock the carousel during the slider item content animation
          isCarouselLocked = true;

          // Get references when the animation actually runs
          const activeSliderItemLeft = activeSliderItem.getBoundingClientRect().left;
          const fromLeft = window.innerWidth / 2 - activeSliderItem.getBoundingClientRect().width / 2;

          gsap.fromTo(activeSliderItemContent, {
            // FROM values - what it starts as
            autoAlpha: 0,
            scale: 0.8,
            x: fromLeft - activeSliderItemLeft,
            y: window.innerHeight / 2 - activeSliderItem.getBoundingClientRect().top,
          }, {
            // TO values - what it animates to
            autoAlpha: 1, // Animate to fully opaque
            scale: 1,
            x: 0,
            y: 0,
            duration: ANIMATION_DURATION,
            ease: 'power2.inOut',
            onComplete: () => {
              // Unlock the carousel when animation is complete
              isCarouselLocked = false;
            }
          });
        }, null, ANIMATION_DURATION); // Position at ANIMATION_DURATION seconds into the timeline
      }
    }
  }

  // --- Pop-in/Pop-out Animation Logic ---

  // If we are closing an item (the clone already exists).
  if (selectedDeskClone && selectedDeskClone.desk.id === desk.id) {
    const { cloneEl } = selectedDeskClone
    const finalRect = deskElement.getBoundingClientRect(); // Get final position
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
        galleryRef.value.classList.remove('faded-queue', 'unclickable'); // Un-fade the gallery.
        selectedDeskClone = null; // Clear the clone state.
        if (masonryInstance) {
          masonryInstance.reloadItems();
          masonryInstance.layout();
        }
        setTimeout(() => {
          cloneEl.remove(); // Remove the clone from the DOM.
        }, ANIMATION_DURATION * 1000); // Wait for the animation to finish before removing.
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
  galleryRef.value.querySelectorAll(`.gallery-item:not([data-desk-id="${desk.id}"])`)
    .forEach(el => el.classList.add('fade-out'))
  galleryRef.value.classList.add('faded-queue', 'unclickable')
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

  // Add a click listener to the clone so it can be closed.
  cloneEl.addEventListener('click', () => {
    pick(desk)
  })
}
</script>

<template>
  <main>
    <div ref="galleryRef" class="gallery" :style="{ width: galleryWidth() }">
      <TransitionGroup name="gallery" tag="div">
        <div v-for="desk in desks" :key="desk.id" class="gallery-item" :data-desk-id="desk.id">
          <div class="gallery-item-content desk" :style="{ backgroundImage: 'url(../src/assets/desk.svg)' }">
            <div class="desk-decor" :style="{ backgroundImage: `url(${desk.decor})` }"></div>
            <div class="desk-monitor" :style="{
              backgroundImage: `url(${desk.monitor.img})`,
              top: desk.monitor.y,
              left: desk.monitor.x,
              width: desk.monitor.width,
              height: desk.monitor.height
            }" @click="pick(desk)"></div>
            <div class="desk-screen" :style="{
              backgroundImage: `url(${desk.screen.img})`,
              top: desk.screen.y,
              left: desk.screen.x,
              width: desk.screen.width,
              height: desk.screen.height
            }"></div>
            <div class="desk-name">{{ desk.name }}</div>
            <div class="desk-desc">{{ desk.title }} / {{ desk.location }}</div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- GSAP slider at the bottom -->
    <div ref="sliderRef" class="slider">
      <div class="slider-item" v-for="desk in desks" :key="desk.id">
        <div class="slider-item-content desk" :style="{ backgroundImage: 'url(../src/assets/desk.svg)' }">
          <div class="desk-decor" :style="{ backgroundImage: `url(${desk.decor})` }"></div>
          <div class="desk-monitor"
            :style="{ backgroundImage: `url(${desk.monitor.img})`, top: desk.monitor.y, left: desk.monitor.x, width: desk.monitor.width, height: desk.monitor.height }">
          </div>
          <div class="desk-screen"
            :style="{ backgroundImage: `url(${desk.screen.img})`, top: desk.screen.y, left: desk.screen.x, width: desk.screen.width, height: desk.screen.height }">
          </div>
          <div class="desk-name">{{ desk.name }}</div>
        </div>
      </div>
    </div>

    <div class="progress-bar"></div>
  </main>
</template>

<style scoped lang="scss">
main {
  background-color: #E8E8E8;
}


.gallery {
  position: relative;
  /* When the queue is fading out, reduce its opacity */
  transition: opacity 0.6s ease;
  margin: 0 auto;
  max-width: 100vw;
  z-index: 1;
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

.slider {
  position: fixed;
  left: 0;
  bottom: -5px;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  z-index: 10;
}

.slider-item {
  position: absolute;
  bottom: 0;
  left: 0;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
  padding: 0;
}

.slider-item-content {
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center bottom;
  position: relative;
  width: 100%;
  height: 100%;

  img {
    pointer-events: none;
  }
}

.desk-clone {
  position: absolute;
  margin: 0;
  z-index: 2000;

  .desk-name,
  .desk-desc {
    color: white !important;
  }
}

.progress-bar {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  background-color: #E8E8E8;
  // background-color: #222222;
}
</style>