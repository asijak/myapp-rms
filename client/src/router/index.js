import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../pages/Welcome.vue'
import Login from '../pages/auth/Login.vue'
import Register from '../pages/auth/Register.vue'
import OAuthSuccess from '../pages/auth/OAuthSuccess.vue'
import Dashboard from '../pages/client/Dashboard.vue'

const routes = [
  { path: '/', component: Welcome },
  { path: '/auth/login', component: Login },
  { path: '/auth/register', component: Register },
  { path: '/oauth-success', component: OAuthSuccess },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/auth/login')
  } else {
    next()
  }
})

export default router
