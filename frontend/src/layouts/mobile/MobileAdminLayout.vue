<script setup>
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'vue-router'
import {
  Briefcase, Users, Building2,
  LogOut, Menu, X, Shield, Home, CheckSquare, Layers, MapPin
} from 'lucide-vue-next'
import { ref, computed } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const isSidebarOpen = ref(false)

const navItems = computed(() => {
  const items = []
  if (auth.isAdmin || auth.isManager) {
    items.push({ name: '자산 정보 관리', icon: Briefcase, path: '/m/admin/assets' })
    items.push({ name: '보관 장소 관리', icon: MapPin, path: '/m/admin/locations' })
    items.push({ name: '카테고리 관리', icon: Layers, path: '/m/admin/categories' })
    items.push({ name: '조직/부서 관리', icon: Building2, path: '/m/admin/departments' })
  }
  if (auth.isAdmin) {
    items.push({ name: '자산 결재 대기함', icon: CheckSquare, path: '/m/admin/approvals' })
    items.push({ name: '사용자 권한 관리', icon: Users, path: '/m/admin/users' })
  }
  return items
})

const logout = () => auth.logout()
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
    <!-- Mobile Header -->
    <header class="fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 z-40 shadow-md">
      <div class="flex items-center gap-2">
        <Shield class="w-5 h-5 text-indigo-400" />
        <span class="font-black text-sm text-slate-100">관리자 패널</span>
      </div>
      <button @click="isSidebarOpen = true" class="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-350 active:scale-95 transition-transform">
        <Menu class="w-5 h-5" />
      </button>
    </header>

    <!-- Mobile Drawer Sidebar -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isSidebarOpen" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50" @click="isSidebarOpen = false">
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-250 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <div class="w-4/5 max-w-xs h-full bg-slate-900 border-r border-slate-850 text-white p-5 flex flex-col gap-6" @click.stop>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <Shield class="w-5 h-5 text-indigo-400" />
                <span class="font-bold text-base text-slate-100">관리 콘솔</span>
              </div>
              <button @click="isSidebarOpen = false" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                <X class="w-5 h-5" />
              </button>
            </div>
            
            <nav class="flex-1 space-y-1.5 overflow-y-auto">
              <router-link v-for="item in navItems" :key="item.name"
                :to="item.path" @click="isSidebarOpen = false"
                class="flex items-center gap-3 text-sm font-semibold text-slate-400 py-3.5 px-4 rounded-xl hover:bg-slate-800 hover:text-white transition-all"
                active-class="bg-indigo-650 text-white shadow-lg shadow-indigo-650/20">
                <component :is="item.icon" class="w-5 h-5" />
                {{ item.name }}
              </router-link>
              
              <div class="border-t border-slate-800 my-4"></div>
              
              <router-link to="/m/home" @click="isSidebarOpen = false" class="flex items-center gap-3 text-sm font-semibold text-slate-400 py-3.5 px-4 rounded-xl hover:bg-slate-800 hover:text-white transition-all">
                <Home class="w-5 h-5" />사용자 홈으로
              </router-link>
            </nav>
            
            <div class="space-y-3">
              <div class="px-4 py-2.5 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">로그인 정보</div>
                <div class="text-sm font-bold text-slate-200 mt-0.5">{{ auth.user?.userName }}</div>
              </div>
              <button @click="logout" class="w-full text-rose-400 border border-rose-500/20 bg-rose-500/5 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 active:bg-rose-500/10 transition-all">
                <LogOut class="w-4 h-4" /> 로그아웃
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Main Content Area -->
    <main class="flex-1 min-h-screen pt-20 p-4 pb-12 overflow-y-auto">
      <router-view v-slot="{ Component }">
        <Transition mode="out-in" 
          enter-active-class="transition duration-150 ease-out" 
          enter-from-class="opacity-0 translate-y-1" 
          enter-to-class="opacity-100 translate-y-0" 
          leave-active-class="transition duration-100 ease-in" 
          leave-from-class="opacity-100" 
          leave-to-class="opacity-0">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>
