<script setup>
// import TheWelcome from '../components/TheWelcome.vue'
import { ref, onMounted, nextTick } from 'vue'
import Masonry from 'masonry-layout'
import itemsData from '../model/desk.json' // Import items from the JSON file

const containerRef = ref(null)
let masonryInstance = null

// Renamed const items to desks
const desks = ref(itemsData)

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

onMounted(() => {
  nextTick(() => {
    masonryInstance = new Masonry(containerRef.value, {
      itemSelector: '.grid-item',
      columnWidth: 200,
      gutter: 20
    })
  })
  window.addEventListener('resize', () => {
    if (masonryInstance) masonryInstance.layout()
  })
})

function pick(desk) {
  console.log('Picked desk:', desk)
  const deskElement = containerRef.value.querySelector(`.grid-item[data-desk-id="${desk.id}"]`)
  if (!deskElement) return
  const rect = deskElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const centerX = viewportWidth / 2
  const centerY = viewportHeight / 2
  const deskCenterX = rect.left + rect.width / 2
  const deskCenterY = rect.top + rect.height / 2
  const translateX = centerX - deskCenterX
  const translateY = centerY - deskCenterY
  deskElement.style.zIndex = 1000
  deskElement.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  deskElement.style.transform = `translate(${translateX}px, ${translateY}px)`
  const handleTransitionEnd = () => {
    deskElement.removeEventListener('transitionend', handleTransitionEnd)
  }
  deskElement.addEventListener('transitionend', handleTransitionEnd)
}
</script>

<template>
  <main>
    <div ref="containerRef" class="grid">
      <TransitionGroup name="grid" tag="div">
        <!-- Removed duplicate v-for loop -->
        <div v-for="desk in desks" :key="desk.id" class="grid-item" :data-desk-id="desk.id" @click="pick(desk)">
          <div class="grid-item-content">
            <div><img :src="desk.profileImg" alt="Desk Image" /></div>
            <div>{{ desk.name }}</div>
            <div>{{ desk.title }}</div>
          </div>
        </div>
      </TransitionGroup>
      <!-- Moved button out of TransitionGroup to avoid key warning -->
      <button @click="shuffleArray">Shuffle Array</button>
    </div>
  </main>
</template>

<style scoped lang="scss">
.grid {
  // display: grid;
  // grid-template-columns: repeat(4, minmax(0, 1fr));
  // gap: 1rem;
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
  // transition: all 500ms ease;
}

.grid-move {
  background-color: purple !important;
  transform: scale(0.9);
}

button {
  display: block;
  margin-top: 1.5rem;
  background-color: #374151;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border-radius: 0.5rem;
  margin-left: auto;
  margin-right: auto;
  color: #D1D5DB;
  font-weight: 600;
  transition: all 0.5s ease;
}

.btn:active {
  background-color: #6B7280;
}
</style>