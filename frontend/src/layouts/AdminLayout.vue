<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import {
  Briefcase, Users, Building2,
  LogOut, Menu, X, Shield, Home, CheckSquare, Layers, MapPin
} from 'lucide-vue-next'
import { ref, computed } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const isSidebarOpen = ref(false)
const isCollapsed = ref(false)

const navItems = computed(() => {
  const items = []
  if (auth.isAdmin || auth.isManager) {
    items.push({ name: '자산 정보 관리', icon: Briefcase, path: '/admin/assets' })
    items.push({ name: '보관 장소 관리', icon: MapPin, path: '/admin/locations' })
    items.push({ name: '카테고리 관리', icon: Layers, path: '/admin/categories' })
    items.push({ name: '조직/부서 관리', icon: Building2, path: '/admin/departments' })
  }
  if (auth.isAdmin) {
    items.push({ name: '자산 결재 대기함', icon: CheckSquare, path: '/admin/approvals' })
    items.push({ name: '사용자 권한 관리', icon: Users, path: '/admin/users' })
  }
  return items
})

const logout = () => auth.logout()
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex">
    <!-- Desktop Sidebar -->
    <aside :class="[isCollapsed ? 'w-20 px-3' : 'w-64 px-5']" class="hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 py-6 transition-all duration-300 shrink-0 h-screen sticky top-0 text-white">
      <div :class="[isCollapsed ? 'justify-center' : 'justify-between']" class="flex items-center mb-8 h-10 px-2 shrink-0">
        <div v-if="!isCollapsed" class="flex items-center gap-2">
          <Shield class="w-5 h-5 text-indigo-400" />
          <span class="text-base font-black tracking-tight text-slate-100">관리자 패널</span>
        </div>
        <button @click="isCollapsed = !isCollapsed" class="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
          <Menu class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto pr-1">
        <router-link
          v-for="item in navItems" :key="item.name"
          :to="item.path" :title="isCollapsed ? item.name : ''"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-400 hover:bg-slate-800 hover:text-white whitespace-nowrap"
          active-class="bg-indigo-650 text-white shadow-lg shadow-indigo-650/20"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!isCollapsed" class="text-sm">{{ item.name }}</span>
        </router-link>

        <div class="my-4 border-t border-slate-800"></div>

        <router-link to="/home" :title="isCollapsed ? '사용자 홈' : ''"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-550 hover:bg-slate-800 hover:text-white whitespace-nowrap text-sm">
          <Home class="w-5 h-5 shrink-0" />
          <span v-if="!isCollapsed">사용자 홈으로</span>
        </router-link>
      </nav>

      <div class="pt-6 border-t border-slate-800 space-y-3 shrink-0">
        <div v-if="!isCollapsed" class="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-750">
          <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">로그인 정보</div>
          <div class="text-sm font-bold text-slate-200 mt-0.5">{{ auth.user?.userName }}</div>
        </div>
        <button @click="logout" :title="isCollapsed ? '로그아웃' : ''"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/10 hover:text-rose-450 border border-transparent hover:border-rose-500/10 transition-all font-bold text-sm whitespace-nowrap">
          <LogOut class="w-5 h-5 shrink-0" />
          <span v-if="!isCollapsed">로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 z-40">
      <div class="flex items-center gap-2">
        <Shield class="w-5 h-5 text-indigo-400" />
        <span class="font-black text-base text-slate-100">관리자 패널</span>
      </div>
      <button @click="isSidebarOpen = true" class="p-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-300">
        <Menu class="w-6 h-6" />
      </button>
    </div>

    <!-- Mobile Drawer -->
    <div v-if="isSidebarOpen" class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 lg:hidden" @click="isSidebarOpen = false">
      <div class="w-4/5 max-w-xs h-full bg-slate-900 border-r border-slate-800 text-white p-6 flex flex-col gap-6" @click.stop>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <Shield class="w-5 h-5 text-indigo-400" />
            <span class="font-bold text-lg text-slate-100">관리자 패널</span>
          </div>
          <button @click="isSidebarOpen = false" class="p-1 rounded-lg border border-slate-800 text-slate-400"><X class="w-5 h-5" /></button>
        </div>
        
        <nav class="flex-1 space-y-2">
          <router-link v-for="item in navItems" :key="item.name"
            :to="item.path" @click="isSidebarOpen = false"
            class="flex items-center gap-3 text-sm font-semibold text-slate-400 py-3 px-4 rounded-xl"
            active-class="bg-indigo-650/20 text-indigo-455">
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </router-link>
          
          <div class="border-t border-slate-800 my-2"></div>
          
          <router-link to="/home" @click="isSidebarOpen = false" class="flex items-center gap-3 text-sm font-semibold text-slate-500 py-3 px-4 rounded-xl">
            <Home class="w-5 h-5" />사용자 홈으로
          </router-link>
        </nav>
        
        <button @click="logout" class="text-rose-455 border border-rose-500/20 bg-rose-500/5 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2">
          <LogOut class="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 min-h-screen overflow-y-auto pt-24 lg:pt-12 max-w-7xl w-full mx-auto p-6 md:p-8">
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
  </div>
</template>
