<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Top Navigation Bar (Premium Bright) -->
    <header class="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-slate-200/20">
      <div class="flex items-center gap-8">
        <router-link to="/home" class="flex items-center gap-2 group transition-transform active:scale-95">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/30">
            A
          </div>
          <span class="text-lg font-black tracking-wider text-slate-900">ASSET MANAGE</span>
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

        <!-- Admin & Manager Access -->
        <template v-if="auth.isAdmin || auth.isManager">
          <router-link to="/admin" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-100">
            <Shield class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">관리 콘솔</span>
          </router-link>
        </template>
        
        <template v-else-if="!auth.user">
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
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { LogOut, Shield, Menu, X } from 'lucide-vue-next'

const auth = useAuthStore()
const isMobileMenuOpen = ref(false)

const navItems = [
  { name: '대시보드', path: '/home' },
  { name: '자산 목록', path: '/home/assets' },
  { name: '내 정보', path: '/home/profile' }
]
</script>
