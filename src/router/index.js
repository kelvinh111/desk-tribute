import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AdminView from '../views/AdminView.vue';

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

export default router;
