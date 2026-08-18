import { createRouter, createWebHistory } from 'vue-router'
import AppearanceView from '@/views/AppearanceView.vue'
import HomeView from '@/views/HomeView.vue'
import TournamentView from '@/views/TournamentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/settings/appearance',
      name: 'appearance',
      component: AppearanceView,
    },
    {
      path: '/tournament/:id',
      name: 'tournament',
      component: TournamentView,
    },
  ],
})

export default router
