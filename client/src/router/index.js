import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  // Auth Group
  {
    path: '/auth/register',
    component: () => import('@/pages/auth/Register.vue'),
  },
  {
    path: '/auth/login',
    component: () => import('@/pages/auth/Login.vue'),
  },
  {
    path: '/auth/verify-otp',
    component: () => import('@/pages/auth/VerifyOtp.vue'),
    props: (route) => ({ email: route.query.email }),
  },

  // User Role Group
  {
    path: '/user/dashboard',
    name: 'UserDashboard',
    component: () => import('@/pages/user/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'user' },
  },
  // YOUR JOBS ROUTE (Perfectly set up!)
  {
    path: '/user/jobs',
    name: 'UserJobs',
    component: () => import('@/pages/user/Jobs.vue'),
    meta: { requiresAuth: true, role: 'user'},
  },

  // Admin Role Group
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/pages/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }

  const isLoggedIn = authStore.isAuthenticated

  // If already logged in, don't let them see /auth pages
  if (isLoggedIn && to.path.startsWith('/auth')) {
    return authStore.dashboardRoute
  }

  // Auth requirement
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: '/auth/login', query: { redirect: to.fullPath } }
  }

  // Role protection
  if (to.meta.role) {
    // If route needs 'admin' but user is NOT staff
    if (to.meta.role === 'admin' && !authStore.isStaff) {
      return '/user/dashboard'
    }
    // If route needs 'user' but user is NOT even a 'user'
    if (to.meta.role === 'user' && !authStore.hasRole('user')) {
      return authStore.dashboardRoute
    }
  }
})

export default router