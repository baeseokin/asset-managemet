<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Top Navigation Bar (Premium Bright) -->
    <header class="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-slate-200/20">
      <div class="flex items-center gap-8">
        <router-link to="/home" class="flex items-center group transition-transform active:scale-95">
          <img src="../assets/logo_wonchon.png" alt="원천교회" class="w-8 h-8 object-cover object-left md:w-auto md:h-8 md:object-contain" />
        </router-link>

        <nav class="hidden md:flex items-center gap-1">
          <router-link v-for="item in navItems" :key="item.path" :to="item.path"
            exact-active-class="bg-slate-900 text-white shadow-lg shadow-slate-200"
            class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all border border-transparent whitespace-nowrap">
            {{ item.name }}
          </router-link>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <!-- User Info & Logout -->
        <template v-if="auth.user">
          <div class="hidden lg:flex flex-col items-end px-2">
            <span class="text-[11px] text-slate-400 font-medium">{{ auth.user.deptName || '소속 없음' }}</span>
            <span class="text-sm font-bold text-slate-900">
              {{ auth.user.userName }}님
            </span>
          </div>
          <div class="w-px h-6 bg-slate-200 mx-2 hidden lg:block"></div>
          
          <button @click="auth.logout()" class="p-2.5 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all" title="로그아웃">
            <LogOut class="w-4 h-4" />
          </button>
        </template>

        <template v-if="!auth.user">
          <router-link to="/" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            로그인
          </router-link>
        </template>

        <!-- Mobile Menu Toggle -->
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="md:hidden p-2.5 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
          <component :is="isMobileMenuOpen ? X : Menu" class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Mobile Navigation Drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="isMobileMenuOpen" class="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shadow-xl z-40 relative">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" @click="isMobileMenuOpen = false"
          class="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          exact-active-class="bg-indigo-50 text-indigo-650">
          {{ item.name }}
        </router-link>
      </div>
    </Transition>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
      <router-view v-slot="{ Component }">
        <Transition mode="out-in" 
          enter-active-class="transition duration-200 ease-out" 
          enter-from-class="opacity-0 translate-y-2" 
          enter-to-class="opacity-100 translate-y-0" 
          leave-active-class="transition duration-150 ease-in" 
          leave-from-class="opacity-100" 
          leave-to-class="opacity-0">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <!-- Footer (Premium Clean) -->
    <footer class="bg-white border-t border-slate-100 py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-6 flex flex-col items-center space-y-2 text-center">
        <p class="text-[11px] text-slate-400 font-semibold">© 2026 ASSET MANAGEMENT SYSTEM. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { LogOut, Shield, Menu, X } from 'lucide-vue-next'

const auth = useAuthStore()
const isMobileMenuOpen = ref(false)

const navItems = computed(() => {
  const items = [
    { name: '대시보드', path: '/home' }
  ]

  // 일반사용자에게만 교회자산목록 제공
  if (!auth.isAdmin && !auth.isManager) {
    items.push({ name: '자산 목록', path: '/home/assets' })
  }

  if (auth.isAdmin || auth.isManager) {
    items.push({ name: '자산 정보 관리', path: '/home/admin-assets' })
  }

  if (auth.isAdmin) {
    items.push({ name: '자산 결재 대기함', path: '/home/approvals' })
  }

  if (auth.isAdmin || auth.isManager) {
    items.push({ name: '보관 장소 관리', path: '/home/locations' })
    items.push({ name: '카테고리 관리', path: '/home/categories' })
    items.push({ name: '조직/부서 관리', path: '/home/departments' })
  }

  if (auth.isAdmin) {
    items.push({ name: '사용자 권한 관리', path: '/home/users' })
  }

  return items
})
</script>
