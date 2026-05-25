<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
    <div class="relative w-full max-w-md">
      <div class="glass-card bg-white/60 border border-slate-200 p-8 md:p-10 shadow-2xl rounded-2xl">
        <div class="flex flex-col items-center mb-8">
          <div class="bg-indigo-500/10 text-indigo-600 p-4 rounded-2xl mb-4 border border-indigo-500/10">
            <Lock class="w-8 h-8" />
          </div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight text-center">비밀번호 변경</h1>
          <p class="text-slate-400 text-xs font-semibold mt-1 text-center">보안을 위해 비밀번호를 변경해 주세요.</p>
        </div>

        <div v-if="errorMsg" class="bg-rose-50 border border-rose-500/20 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl mb-6 text-center">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div v-if="!isFirstLogin" class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">현재 비밀번호</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="현재 비밀번호를 입력하세요"
              class="input-field"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">새 비밀번호</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="새 비밀번호를 입력하세요"
              class="input-field"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">새 비밀번호 확인</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="새 비밀번호를 다시 입력하세요"
              class="input-field"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider flex items-center justify-center mt-6"
          >
            <span v-if="isLoading">변경 중...</span>
            <span v-else>비밀번호 변경 완료</span>
          </button>
        </form>

        <div class="mt-6 text-center">
            <button @click="logout" class="text-xs font-bold text-slate-400 hover:text-slate-750 transition-all">
                로그아웃
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'vue-router'
import { Lock } from 'lucide-vue-next'
import axios from 'axios'
import { useModalStore } from '@/store/useModalStore'

const modal = useModalStore()
const auth = useAuthStore()
const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const isFirstLogin = computed(() => auth.user?.mustChangePassword)

const handleChangePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  
  if (newPassword.value.length < 4) {
    errorMsg.value = '비밀번호는 4자 이상이어야 합니다.'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await axios.post('/api/auth/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    
    if (res.data.success) {
      await modal.showAlert('비밀번호가 성공적으로 변경되었습니다.')
      auth.user.mustChangePassword = false
      if (auth.isAdmin) {
        router.push('/m/admin')
      } else {
        router.push('/m/home')
      }
    } else {
      errorMsg.value = res.data.message
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

const logout = () => {
  auth.logout()
}
</script>
