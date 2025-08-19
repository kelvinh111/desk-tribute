import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AdminView from '../views/AdminView.vue';
import { useDeskViewerStore } from '../stores/deskViewer.js';

const router = createRouter({
  // createWebHistory uses the browser's History API to manage routing without a page reload.
  // This allows for clean URLs like 'http://localhost:5173/desk-1' instead of 'http://localhost:5173/#/desk-1'.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // The root path of the application.
      path: '/',
      name: 'home',
      component: HomeView, // Renders the HomeView component.
    },
    {
      // Admin dashboard route
      path: '/admin',
      name: 'admin',
      component: AdminView,
    },
    {
      // This is a dynamic route. The ':deskSlug' part is a parameter that can be any string.
      // For example, '/alice-nguyen', '/bob-james', etc., will all match this route.
      path: '/:deskSlug',
      name: 'desk',
      // It also renders HomeView. This is a key part of the pop-out animation.
      // When the URL changes to '/alice-nguyen', HomeView is still the component being rendered,
      // but inside HomeView, we can read the 'deskSlug' from the route to know which desk to "pop out".
      component: HomeView,
    },
  ],
});

// Function to update meta tags
function updateMetaTag(property, content) {
  // Try to find existing meta tag
  let metaTag = document.querySelector(`meta[property="${property}"]`) ||
    document.querySelector(`meta[name="${property}"]`);

  if (metaTag) {
    metaTag.setAttribute('content', content);
  } else {
    // Create new meta tag if it doesn't exist
    metaTag = document.createElement('meta');
    metaTag.setAttribute('property', property);
    metaTag.setAttribute('content', content);
    document.head.appendChild(metaTag);
  }
}

// Function to update page title and meta tags for desk pages
function updatePageMeta(to, deskData = []) {
  const baseUrl = window.location.origin;

  if (to.params.deskSlug && deskData.length > 0) {
    // Find the desk by slug
    const desk = deskData.find(d => d.slug === to.params.deskSlug);

    if (desk) {
      const deskUrl = `${baseUrl}/${desk.slug}`;
      const title = `DESK Tribute - where creativity is born - ${desk.name}`;
      const description = `Check out ${desk.name}'s desk setup - ${desk.title} from ${desk.location}. A creative workspace that inspires.`;
      const image = desk.photos && desk.photos[0] ? `${baseUrl}${desk.photos[0]}` : `${baseUrl}/favicon.ico`;

      // Update document title
      document.title = title;

      // Update Open Graph meta tags
      updateMetaTag('og:url', deskUrl);
      updateMetaTag('og:title', title);
      updateMetaTag('og:description', description);
      updateMetaTag('og:image', image);

      // Update Twitter Card meta tags
      updateMetaTag('twitter:title', title);
      updateMetaTag('twitter:description', description);
      updateMetaTag('twitter:image', image);
    }
  } else {
    // Default meta tags for home page
    const title = 'Desk Tribute – Preserving the 2011 Desk Experience';
    const description = 'Non‑profit tribute remake of \'Desk\' (2011) by Jongmin Kim. Explore creative desks submitted by people worldwide.';
    const image = `${baseUrl}/favicon.ico`;

    // Update document title
    document.title = title;

    // Update Open Graph meta tags
    updateMetaTag('og:url', baseUrl);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);

    // Update Twitter Card meta tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
  }
}

// Navigation guard to update meta tags before each route
router.beforeEach((to, from, next) => {
  // Get the store instance
  const store = useDeskViewerStore();

  // Update meta tags with current desk data (may be empty if not loaded yet)
  updatePageMeta(to, store.desks);

  next();
});

export default router;
