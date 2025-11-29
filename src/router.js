import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Session from './views/Session.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/:sessionCode',
      name: 'session',
      component: Session
    }
  ]
})

export default router