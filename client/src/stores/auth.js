// src/stores/auth.js
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),
  actions: {
    async fetchUser() {
      const { data } = await api.get('/user/me')
      this.user = data
    },
  },
})
