import { defineStore } from 'pinia'
import apiClient from '@/api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,

    // ✅ Logic: Checks if the user has ANY role other than 'user'
    isStaff: (state) => {
      if (!state.user?.roles) return false
      // Returns true if there is at least one role that is NOT 'user'
      return state.user.roles.some((role) => role !== 'user')
    },

    // ✅ Helper to decide where the user belongs
    dashboardRoute: (state) => {
      if (!state.user) return '/auth/login'
      // Use our new logic: Staff goes to Admin, everyone else to User
      return state.isStaff ? '/admin/dashboard' : '/user/dashboard'
    },

    hasRole: (state) => (roleName) => {
      if (!state.user?.roles) return false
      return state.user.roles.includes(roleName)
    },

    primaryRole: (state) => {
      if (!state.user?.roles || state.user.roles.length === 0) return 'Guest'
      return state.user.roles[0]
    },
  },

  actions: {
    async fetchCurrentUser() {
      try {
        const { data } = await apiClient.get('/auth/me')
        this.user = data.user
      } catch (err) {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    async verifyOtp(email, otp) {
      this.loading = true
      this.error = null
      try {
        const { data } = await apiClient.post('/auth/verify-otp', { email, otp })
        this.user = data.user
        this.initialized = true
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'Invalid OTP'
        throw err
      } finally {
        this.loading = false
      }
    },

    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const { data } = await apiClient.post('/auth/login', credentials)
        this.user = data.user
        this.initialized = true
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await apiClient.post('/auth/logout')
      } finally {
        this.user = null
        this.initialized = true
        window.location.href = '/'
      }
    },
  },
})
