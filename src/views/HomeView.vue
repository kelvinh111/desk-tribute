<script setup>
// import TheWelcome from '../components/TheWelcome.vue'
import { ref, onMounted, nextTick } from 'vue'
import Masonry from 'masonry-layout'  // Added Masonry import

const containerRef = ref(null) // Added container ref
let masonryInstance = null  // Masonry instance variable

const items = ref([
  'Vue',
  'JavaScript',
  'CSS',
  'HTML',
  'React',
  'Figma',
  'GraphQL',
  'Bootstrap',
])

const shuffleArray = () => {
  items.value = items.value
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
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

function pick(item) {
  console.log('Picked item:', item)
  // You can add more logic here if needed
  const itemElement = Array.from(containerRef.value.querySelectorAll('.grid-item'))
    .find(el => el.textContent.trim() === item)

  if (!itemElement) return

  const rect = itemElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const centerX = viewportWidth / 2
  const centerY = viewportHeight / 2

  const itemCenterX = rect.left + rect.width / 2
  const itemCenterY = rect.top + rect.height / 2

  const translateX = centerX - itemCenterX
  const translateY = centerY - itemCenterY

  itemElement.style.zIndex = 1000
  itemElement.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  itemElement.style.transform = `translate(${translateX}px, ${translateY}px)`

  const handleTransitionEnd = () => {
    itemElement.removeEventListener('transitionend', handleTransitionEnd)
    // Optionally keep it centered, or revert after a delay:
    // setTimeout(() => {
    //   itemElement.style.transform = ''
    //   itemElement.style.zIndex = ''
    // }, 1200)
  }
  itemElement.addEventListener('transitionend', handleTransitionEnd)
}
</script>

<template>
  <main>
    <div ref="containerRef" class="grid"> <!-- Added container wrapper -->
      <TransitionGroup name="grid" tag="div">
        <div v-for="item in items" :key="item" class="grid-item" @click="pick(item)">
          <div class="grid-item-content">
            {{ item }}
          </div>
        </div>
      </TransitionGroup>
    </div>
    <button @click="shuffleArray">Shuffle Array</button>
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