<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, reactive } from 'vue'
import Masonry from 'masonry-layout'
import itemsData from '../model/desk.json'
import { useRouter, useRoute } from 'vue-router'
import { gsap } from 'gsap'
// Draggable and InertiaPlugin are no longer needed.

const containerRef = ref(null)
const desks = ref(itemsData)
let masonryInstance = null
let selectedDeskClone = null
const pickerRef = ref(null)
let positionCells = null;

// Simplified state for selection and a new state object for our custom carousel.
const selectionState = reactive({
  selectedIndex: null,
  progress: 0,
  hoverStates: [], // Re-add hover states
})

const carousel = reactive({
  x: 0,
  isDragging: false,
  hasDragged: false, // Flag to detect the start of a drag vs. a click.
  isPointerDown: false, // Flag to freeze hover state on mousedown.
  startX: 0,
  startScrollX: 0,
  lastX: 0,
  lastTime: 0,
  velocityX: 0,
})

const router = useRouter()
const route = useRoute()

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

const updateCloneCenterTransform = () => {
  if (!selectedDeskClone) return
  const { originalRect, cloneEl } = selectedDeskClone
  const cloneWidth = cloneEl.offsetWidth
  const cloneHeight = cloneEl.offsetHeight
  const targetLeft = (window.innerWidth - cloneWidth) / 2
  const targetTop = (window.innerHeight - cloneHeight) / 2
  const dx = targetLeft - originalRect.left
  const dy = targetTop - originalRect.top
  cloneEl.style.transform = `translate(${dx}px, ${dy}px)`
}

function onTick() {
  // onTick now just positions cells based on our custom carousel state.
  if (positionCells) {
    positionCells(carousel.x);
  }
}

// Helper to calculate the carousel's dynamic content bounds.
function getCarouselBounds() {
  const picker = pickerRef.value;
  if (!picker) return { minX: 0, maxX: 0 };

  const baseCellWidth = 120;
  const expandedCellWidth = 240;
  const numCells = desks.value.length;

  // This logic now accounts for both selection and hover states.
  const totalHoverProgress = selectionState.hoverStates.reduce((sum, state) => sum + state.progress, 0);
  const suppressionFactor = 1 - Math.min(1, totalHoverProgress);
  const effectiveSelectedProgress = selectionState.progress * suppressionFactor;

  let dynamicContentWidth = 0;
  for (let i = 0; i < numCells; i++) {
    const hoverProgress = selectionState.hoverStates[i]?.progress || 0;
    let width = baseCellWidth;
    if (hoverProgress > 0) {
      width = baseCellWidth + (expandedCellWidth - baseCellWidth) * hoverProgress;
    } else if (i === selectionState.selectedIndex) {
      width = baseCellWidth + (expandedCellWidth - baseCellWidth) * effectiveSelectedProgress;
    }
    dynamicContentWidth += width;
  }

  const pickerWidth = picker.offsetWidth;
  const minX = Math.min(0, -(dynamicContentWidth - pickerWidth));
  return { minX, maxX: 0 };
}

// --- Custom Pointer Handlers for the Carousel ---

function handlePointerDown(event) {
  // The hover state reset is moved to handlePointerMove to only trigger on an actual drag.
  gsap.killTweensOf(carousel); // Stop any previous inertia animation.
  carousel.isDragging = true;
  carousel.isPointerDown = true; // Freeze hover state.
  carousel.hasDragged = false; // Reset the drag flag on each new press.
  carousel.startX = event.clientX;
  carousel.startScrollX = carousel.x;
  carousel.lastX = carousel.x;
  carousel.lastTime = Date.now();
  carousel.velocityX = 0;
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(event) {
  if (!carousel.isDragging) return;

  const dx = event.clientX - carousel.startX;

  // On the first movement beyond a threshold (e.g. 5px), consider it a "drag".
  if (!carousel.hasDragged && Math.abs(dx) > 5) {
    carousel.hasDragged = true;
  }

  // We only prevent default browser actions (like text selection) if a drag has started.
  if (carousel.hasDragged) {
    event.preventDefault();
  }

  const newX = carousel.startScrollX + dx;

  const bounds = getCarouselBounds();
  carousel.x = gsap.utils.clamp(bounds.minX, bounds.maxX, newX);

  // Velocity calculation for the "flick" effect.
  const now = Date.now();
  const dt = now - carousel.lastTime;
  if (dt > 0) {
    carousel.velocityX = (carousel.x - carousel.lastX) / dt;
  }
  carousel.lastX = carousel.x;
  carousel.lastTime = now;
}

function handlePointerUp() {
  if (!carousel.isDragging) return;
  carousel.isDragging = false;
  carousel.isPointerDown = false; // Unfreeze hover state.

  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);

  // Custom inertia animation.
  const throwDistance = carousel.velocityX * 250; // Multiplier for "flick" distance.
  let targetX = carousel.x + throwDistance;

  const bounds = getCarouselBounds();
  targetX = gsap.utils.clamp(bounds.minX, bounds.maxX, targetX);

  gsap.to(carousel, {
    x: targetX,
    duration: 0.6,
    ease: 'power3.out',
  });
}


onMounted(() => {
  gsap.ticker.add(onTick);

  nextTick(() => {
    masonryInstance = new Masonry(containerRef.value, {
      itemSelector: '.grid-item',
      columnWidth: 200,
      gutter: 20
    });

    // Initialize GSAP Picker
    const picker = pickerRef.value;
    if (!picker) return;
    gsap.set(picker, { autoAlpha: 0 }); // Hide picker initially

    const cells = gsap.utils.toArray(picker.querySelectorAll('.cell'));
    const proxy = document.createElement("div");
    const baseCellWidth = 120;
    const expandedCellWidth = 240; // The width of the selected cell
    const numCells = cells.length;

    selectionState.hoverStates = cells.map(() => ({ progress: 0 })); // Initialize hover states

    gsap.set(cells, {
      width: baseCellWidth,
      x: (i) => i * baseCellWidth,
      scale: 0.6 // Set base scale
    });

    positionCells = (dragX) => {
      // Re-introduce the more complex layout logic that handles hover.
      const totalHoverProgress = selectionState.hoverStates.reduce((sum, state) => sum + state.progress, 0);
      const suppressionFactor = 1 - Math.min(1, totalHoverProgress);
      const effectiveSelectedProgress = selectionState.progress * suppressionFactor;

      const cellData = cells.map((cell, i) => {
        const hoverProgress = selectionState.hoverStates[i].progress;
        let width = baseCellWidth;
        let scale = 0.6;

        if (hoverProgress > 0) {
          width = baseCellWidth + (expandedCellWidth - baseCellWidth) * hoverProgress;
          scale = 0.6 + (0.4 * hoverProgress);
        } else if (i === selectionState.selectedIndex) {
          width = baseCellWidth + (expandedCellWidth - baseCellWidth) * effectiveSelectedProgress;
          scale = 0.6 + (0.4 * effectiveSelectedProgress);
        }
        return { width, scale };
      });

      let dynamicInitialX = [];
      let currentX = 0;
      cellData.forEach(data => {
        dynamicInitialX.push(currentX);
        currentX += data.width;
      });

      cells.forEach((cell, i) => {
        const data = cellData[i];
        const x = dynamicInitialX[i] + dragX;
        gsap.set(cell, { x, width: data.width, scale: data.scale });
      });
    };

    // Add hover listeners for scaling effect
    cells.forEach((cell, index) => {
      cell.addEventListener('mouseenter', () => {
        if (carousel.isPointerDown || selectionState.selectedIndex === null) return;

        // If hovering over the selected cell, cancel any other hover effects.
        if (index === selectionState.selectedIndex) {
          selectionState.hoverStates.forEach((state, i) => {
            if (i !== index) {
              gsap.to(state, { progress: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            }
          });
          return;
        }

        // If hovering a non-selected cell, make it the new hover target.
        gsap.to(selectionState.hoverStates[index], { progress: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
        selectionState.hoverStates.forEach((state, i) => {
          if (i !== index) {
            gsap.to(state, { progress: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
          }
        });
      });
    });

    picker.addEventListener('mouseleave', () => {
      if (carousel.isPointerDown || selectionState.selectedIndex === null) return;
      selectionState.hoverStates.forEach(state => {
        gsap.to(state, { progress: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      });
    });

    // Add our new custom pointer listener.
    picker.addEventListener('pointerdown', handlePointerDown);

    positionCells(0);

    // Check for deskId in route on initial load
    if (route.params.deskId) {
      const desk = desks.value.find(d => d.id === route.params.deskId);
      if (desk) {
        // Use a small timeout to ensure the masonry layout is complete before picking
        setTimeout(() => {
          pick(desk);
        }, 150);
      }
    }
  });

  window.addEventListener('resize', () => {
    // Update Masonry layout
    if (masonryInstance) masonryInstance.layout()
    // If a clone exists, keep it centered.
    if (selectedDeskClone) {
      updateCloneCenterTransform()
    }
    // Reposition picker cells on resize
    if (positionCells && carousel) {
      positionCells(carousel.x);
    }
  })
})

onBeforeUnmount(() => {
  gsap.ticker.remove(onTick);
  // Clean up global event listeners to prevent memory leaks.
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
})

function pick(desk) {
  const deskElement = containerRef.value.querySelector(`.grid-item[data-desk-id="${desk.id}"]`)
  if (!deskElement) return

  // --- Carousel scroll and expansion logic ---
  if (pickerRef.value) {
    const index = desks.value.findIndex(d => d.id === desk.id);
    if (index !== -1) {
      const isClosing = selectedDeskClone && selectedDeskClone.desk.id === desk.id;

      if (isClosing) {
        router.push('/'); // Update URL when closing
        selectionState.hoverStates.forEach(state => { state.progress = 0; }); // Reset hover states
        gsap.to(pickerRef.value, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' });
        gsap.to(selectionState, {
          progress: 0,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: () => { selectionState.selectedIndex = null; }
        });
      } else {
        if (route.path !== '/' + desk.id) {
          router.push('/' + desk.id); // Update URL when selecting
        }
        gsap.to(pickerRef.value, { autoAlpha: 1, duration: 0.6, ease: 'power2.inOut' });
        selectionState.selectedIndex = index;

        const picker = pickerRef.value;
        const baseCellWidth = 120;
        const expandedCellWidth = 240;
        const pickerWidth = picker.offsetWidth;
        const numCells = desks.value.length;

        let dynamicInitialX = [];
        let currentX = 0;
        for (let i = 0; i < numCells; i++) {
          dynamicInitialX.push(currentX);
          currentX += (i === index) ? expandedCellWidth : baseCellWidth;
        }
        const dynamicContentWidth = currentX;

        // Calculate the ideal X to center the item
        const targetX = (pickerWidth / 2 - expandedCellWidth / 2) - dynamicInitialX[index];

        // We get the bounds at the target state, not the current one.
        const finalBounds = {
          minX: Math.min(0, -(dynamicContentWidth - pickerWidth)),
          maxX: 0
        };
        const clampedTargetX = gsap.utils.clamp(finalBounds.minX, finalBounds.maxX, targetX);

        const tl = gsap.timeline();
        tl.to(selectionState, { progress: 1, duration: 0.6, ease: 'power2.inOut' }, 0);
        // Animate our custom carousel state object instead of a Draggable instance.
        tl.to(carousel, { x: clampedTargetX, duration: 0.6, ease: 'power2.inOut' }, 0);
      }
    }
  }

  // If already cloned, pop-in animation
  if (selectedDeskClone && selectedDeskClone.desk.id === desk.id) {
    const { originalRect, cloneEl } = selectedDeskClone
    const currentRect = cloneEl.getBoundingClientRect()
    const dx = originalRect.left - currentRect.left
    const dy = originalRect.top - currentRect.top

    gsap.to(cloneEl, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        cloneEl.remove()
        deskElement.style.visibility = 'visible'
        containerRef.value.classList.remove('faded-queue', 'unclickable')
        selectedDeskClone = null
        if (masonryInstance) {
          masonryInstance.reloadItems()
          masonryInstance.layout()
        }
      }
    })
    return
  }

  // Pop-out animation
  const rect = deskElement.getBoundingClientRect()
  const cloneEl = deskElement.cloneNode(true)
  cloneEl.style.position = 'fixed'
  cloneEl.style.top = rect.top + 'px'
  cloneEl.style.left = rect.left + 'px'
  cloneEl.style.width = rect.width + 'px'
  cloneEl.style.height = rect.height + 'px'
  cloneEl.style.margin = '0'
  cloneEl.style.zIndex = '2000'
  cloneEl.style.opacity = '1'
  document.body.appendChild(cloneEl)
  deskElement.style.visibility = 'hidden'
  containerRef.value.querySelectorAll(`.grid-item:not([data-desk-id="${desk.id}"])`)
    .forEach(el => el.classList.add('fade-out'))
  containerRef.value.classList.add('faded-queue', 'unclickable')
  selectedDeskClone = { desk, originalRect: rect, cloneEl }

  // Animate to center using GSAP
  const cloneWidth = cloneEl.offsetWidth
  const cloneHeight = cloneEl.offsetHeight
  const targetLeft = (window.innerWidth - cloneWidth) / 2
  const targetTop = (window.innerHeight - cloneHeight) / 2
  const dx = targetLeft - rect.left
  const dy = targetTop - rect.top

  gsap.fromTo(cloneEl,
    { x: 0, y: 0, opacity: 1 },
    { x: dx, y: dy, opacity: 1, duration: 0.6, ease: 'power2.inOut' }
  )

  cloneEl.addEventListener('click', () => {
    pick(desk)
  })
}
</script>

<template>
  <main>
    <div ref="containerRef" class="grid">
      <TransitionGroup name="grid" tag="div">
        <div v-for="desk in desks" :key="desk.id" class="grid-item" :data-desk-id="desk.id" @click="pick(desk)">
          <div class="grid-item-content">
            <div><img :src="desk.profileImg" alt="Desk Image" /></div>
            <div>{{ desk.name }}</div>
            <div>{{ desk.title }}</div>
          </div>
        </div>
      </TransitionGroup>
      <!-- <button @click="shuffleArray">Shuffle Array</button> -->
    </div>

    <!-- GSAP picker at the bottom -->
    <div ref="pickerRef" class="picker">
      <div class="cell" v-for="desk in desks" :key="desk.id">
        <div class="cell-content">
          <img :src="desk.profileImg" :alt="desk.name" style="width: 100px; height: 100px; border-radius: 8px;" />
          <div>{{ desk.name }}</div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  position: relative;
  /* When the queue is fading out, reduce its opacity */
  transition: opacity 0.6s ease;
}

.faded-queue {
  opacity: 0;
}

.grid-item {
  // padding: 1.5rem;
  width: 200px;
  height: 200px;
  // float: left;
  margin: 10px;
  background-color: pink;
  border-radius: 1rem;
  text-align: center;
  font-size: 15px;
  opacity: 1;
  // transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease;
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

.picker {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 200px;
  background: #f3f4f6;
  overflow: hidden;
}

.cell {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
}

.cell-content {
  background: #fff;
  border-radius: 8px;
  text-align: center;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  img {
    pointer-events: none;
  }
}
</style>