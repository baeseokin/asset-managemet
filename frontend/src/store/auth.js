import { defineStore } from 'pinia'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''
axios.defaults.withCredentials = true

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,       // User session info (null = not logged in)
    initialized: false
  }),
  getters: {
    isAdmin: (state) => state.user?.roles?.includes('관리자') ?? false,
    isManager: (state) => state.user?.roles?.includes('자산담당') ?? false,
  },
  actions: {
    async login(userId, password) {
      try {
        const res = await axios.post('/api/auth/login', { userId, password })
        if (res.data.success) {
          this.user = res.data.user
          return { success: true }
        }
        return { success: false, message: res.data.message }
      } catch (e) {
        return { success: false, message: e.response?.data?.message || '로그인 오류' }
      }
    },
    async loginWithKakao(code) {
      try {
        const res = await axios.post('/api/auth/kakao', { code })
        if (res.data.success) {
          this.user = res.data.user
          return { success: true }
        }
        return { success: false, message: res.data.message }
      } catch (e) {
        console.error('Kakao login fail:', e)
        return { success: false, message: e.response?.data?.message || '카카오 로그인 오류' }
      }
    },
    async checkSession() {
      try {
        const res = await axios.get('/api/auth/session')
        this.user = res.data.success ? res.data.user : null
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
    async logout() {
      try {
        await axios.post('/api/auth/logout')
      } catch (e) {
        console.error('Logout request error:', e)
      } finally {
        this.user = null
        window.location.href = '/'
      }
    }
  }
})
