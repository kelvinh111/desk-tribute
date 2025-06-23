<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Masonry from 'masonry-layout'
import Flickity from 'flickity'
import itemsData from '../model/desk.json'
import { useRouter, useRoute } from 'vue-router'
import 'flickity/css/flickity.css'
import { gsap } from 'gsap'

const containerRef = ref(null)
const desks = ref(itemsData)
let masonryInstance = null
let selectedDeskClone = null
const carouselRef = ref(null)
let flickityInstance = null

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

onMounted(() => {
  nextTick(() => {
    masonryInstance = new Masonry(containerRef.value, {
      itemSelector: '.grid-item',
      columnWidth: 200,
      gutter: 20
    })

    // Initialize Flickity
    if (carouselRef.value) {
      flickityInstance = new Flickity(carouselRef.value, {
        freeScroll: true,
        contain: true,
        prevNextButtons: true,
        pageDots: false,
      })
    }
  })

  window.addEventListener('resize', () => {
    console.log('Window resized, updating clone position')
    // Update Masonry layout
    if (masonryInstance) masonryInstance.layout()
    // If a clone exists, keep it centered.
    if (selectedDeskClone) {
      updateCloneCenterTransform()
    }
  })
})

onBeforeUnmount(() => {
  if (flickityInstance) {
    flickityInstance.destroy()
    flickityInstance = null
  }
})

function pick(desk) {
  const deskElement = containerRef.value.querySelector(`.grid-item[data-desk-id="${desk.id}"]`)
  if (!deskElement) return

  // If already cloned, pop-in animation
  if (selectedDeskClone && selectedDeskClone.desk.id === desk.id) {
    const { originalRect, cloneEl } = selectedDeskClone
    const currentRect = cloneEl.getBoundingClientRect()
    const dx = originalRect.left - currentRect.left
    const dy = originalRect.top - currentRect.top

    gsap.to(cloneEl, {
      // x: dx,
      // y: dy,
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

    <!-- Flickity carousel at the bottom -->
    <div ref="carouselRef" class="carousel" style="margin-top: 40px;">
      <div class="carousel-cell" v-for="desk in desks" :key="desk.id">
        <img :src="desk.profileImg" :alt="desk.name" style="width: 100px; height: 100px; border-radius: 8px;" />
        <div>{{ desk.name }}</div>
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

.carousel {
  background: #f3f4f6;
  width: 100%;
  position: fixed;
  left: 0;
  bottom: 0;

  .carousel-cell {
    width: 120px;
    margin-right: 10px;
    background: #fff;
    border-radius: 8px;
    text-align: center;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}
</style>