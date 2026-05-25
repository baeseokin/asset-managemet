<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans text-slate-800">
    <!-- Subtle glow background effects -->
    <div class="absolute inset-0 opacity-30 pointer-events-none">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-900 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-950 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-md transition-all duration-500">
      <!-- Card -->
      <div class="glass-card bg-white/60 border border-slate-200 p-8 md:p-10 shadow-2xl rounded-2xl">
        <!-- Title Area -->
        <div class="flex flex-col items-center mb-8 text-center">
          <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-650/30 mb-4">
            A
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            자산 관리 시스템
          </h1>
          <p class="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1.5">Asset Management System</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMsg" class="bg-rose-50 border border-rose-500/20 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl mb-6 text-center">
          {{ errorMsg }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">아이디</label>
            <input
              v-model="userId"
              type="text"
              placeholder="아이디를 입력하세요"
              autocomplete="username"
              class="input-field"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">비밀번호</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                placeholder="비밀번호를 입력하세요"
                autocomplete="current-password"
                class="input-field pr-12"
              />
              <button type="button" @click="showPw = !showPw" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-350 transition-colors">
                <EyeOff v-if="showPw" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full py-3.5 mt-4 text-sm font-semibold tracking-wider flex items-center justify-center"
          >
            <span v-if="isLoading">로그인 중...</span>
            <span v-else>로그인</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-slate-400 font-medium">또는</span>
          </div>
        </div>

        <!-- Secondary Actions -->
        <div class="flex flex-col items-center">
          <router-link to="/register" class="group flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-350 transition-all">
            <span>신규 회원가입 신청</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </router-link>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 text-center">
        <p class="text-[11px] text-slate-600 font-semibold tracking-wider">
          © 2026 ASSET MANAGEMENT SYSTEM. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, ArrowRight } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const userId = ref('')
const password = ref('')
const showPw = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (!userId.value || !password.value) {
    errorMsg.value = 'ID와 비밀번호를 모두 입력하세요.'
    return
  }
  isLoading.value = true
  errorMsg.value = ''
  
  const result = await auth.login(userId.value, password.value)
  if (result.success) {
    if (auth.user.mustChangePassword) {
      router.push({ name: 'ChangePassword' })
      return
    }

    if (auth.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/home')
    }
  } else {
    errorMsg.value = result.message || '아이디 또는 비밀번호가 일치하지 않습니다.'
  }
  isLoading.value = false
}
</script>
