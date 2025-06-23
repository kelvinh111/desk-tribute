<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Masonry from 'masonry-layout'
import itemsData from '../model/desk.json' // Import items from the JSON file

const containerRef = ref(null)
let masonryInstance = null

// Renamed const items to desks
const desks = ref(itemsData)

// Stores info about the currently cloned desk
let selectedDeskClone = null

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
  // New target position in viewport: centered
  const targetLeft = (window.innerWidth - cloneWidth) / 2
  const targetTop = (window.innerHeight - cloneHeight) / 2
  // Calculate needed offset relative to the stored original position
  const dx = targetLeft - originalRect.left
  const dy = targetTop - originalRect.top
  cloneEl.style.transform = `translate(${dx}px, ${dy}px)`
}

onMounted(() => {
  nextTick(() => {
    masonryInstance = new Masonry(containerRef.value, {
      itemSelector: '.grid-item',
      columnWidth: 200,
      gutter: 20
    })
  })

  window.addEventListener('resize', () => {
    // Update Masonry layout
    if (masonryInstance) masonryInstance.layout()
    // If a clone exists, keep it centered.
    if (selectedDeskClone) {
      updateCloneCenterTransform()
    }
  })
})

function pick(desk) {
  // Get the original desk element from the grid.
  const deskElement = containerRef.value.querySelector(`.grid-item[data-desk-id="${desk.id}"]`)
  if (!deskElement) return

  // If this desk is already cloned, reverse the animation.
  if (selectedDeskClone && selectedDeskClone.desk.id === desk.id) {
    const { originalRect, cloneEl } = selectedDeskClone
    // Animate clone back to its original position.
    cloneEl.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease'
    // Calculate offset from current position back to original position.
    // const currentRect = cloneEl.getBoundingClientRect()
    // // const dx = originalRect.left - currentRect.left
    // // const dy = originalRect.top - currentRect.top
    // const dx = deskElement.left - currentRect.left
    // const dy = deskElement.top - currentRect.top

    // cloneEl.style.transform = `translate(${dx}px, ${dy}px)`
    cloneEl.style.opacity = '0'
    cloneEl.addEventListener('transitionend', () => {
      // Remove the clone and fade in the queue.
      cloneEl.remove()
      selectedDeskClone = null
      deskElement.style.visibility = 'visible'
      containerRef.value.classList.remove('faded-queue')
      if (masonryInstance) {
        masonryInstance.reloadItems()
        masonryInstance.layout()
      }
    }, { once: true })
    return
  }

  // Otherwise, create a clone of the clicked desk.
  const rect = deskElement.getBoundingClientRect()
  const cloneEl = deskElement.cloneNode(true)

  // Set styles so that the clone is positioned over the original.
  cloneEl.style.position = 'fixed'
  cloneEl.style.top = rect.top + 'px'
  cloneEl.style.left = rect.left + 'px'
  cloneEl.style.width = rect.width + 'px'
  cloneEl.style.height = rect.height + 'px'
  cloneEl.style.margin = '0'
  cloneEl.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease'
  cloneEl.style.zIndex = '2000'

  // Append the clone to the document body.
  document.body.appendChild(cloneEl)
  deskElement.style.visibility = 'hidden'

  // Fade out the underlying queue.
  containerRef.value.classList.add('faded-queue')

  // Save the clone info.
  selectedDeskClone = { desk, originalRect: rect, cloneEl }

  // Animate the clone to the center.
  updateCloneCenterTransform()

  // When the clone is clicked, call pick() again to reverse.
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
      <button @click="shuffleArray">Shuffle Array</button>
    </div>
  </main>
</template>

<style scoped lang="scss">
.grid {
  // display: grid;
  // grid-template-columns: repeat(4, minmax(0, 1fr));
  // gap: 1rem;
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
  float: left;
  margin: 10px;
  background-color: pink;
  border-radius: 1rem;
  text-align: center;
  font-size: 15px;
  opacity: 1;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease;
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
</style>