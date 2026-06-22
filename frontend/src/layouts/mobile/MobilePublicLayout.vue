<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16 selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Top Compact Header -->
    <header class="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-slate-200/5">
      <div class="flex items-center gap-3">
        <router-link to="/m/home" class="flex items-center active:scale-95 transition-transform">
          <img src="../../assets/logo_wonchon.png" alt="원천교회" class="w-8 h-8 object-cover object-left md:w-auto md:h-8 md:object-contain" />
        </router-link>
        <div class="w-px h-4 bg-slate-200"></div>
        <h1 class="text-sm md:text-base font-black text-slate-800 tracking-tight">{{ pageTitle }}</h1>
      </div>

      <div class="flex items-center gap-2">
        <!-- Toggle Menu Drawer -->
        <button @click="isDrawerOpen = !isDrawerOpen" class="p-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all">
          <component :is="isDrawerOpen ? X : Menu" class="w-5 h-5" />
        </button>

        <!-- Logout -->
        <button v-if="auth.user" @click="auth.logout()" class="p-2 bg-slate-100 text-slate-400 active:text-rose-500 active:bg-rose-50 border border-slate-200 rounded-xl transition-all">
          <LogOut class="w-4 h-4" />
        </button>
      </div>
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
      <div v-if="isDrawerOpen" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]" @click="isDrawerOpen = false">
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-250 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div class="absolute right-0 top-0 w-4/5 max-w-xs h-full bg-white border-l border-slate-200 p-5 flex flex-col gap-6" @click.stop>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <Shield class="w-5 h-5 text-blue-500" />
                <span class="font-bold text-base text-slate-900">전체 메뉴</span>
              </div>
              <button @click="isDrawerOpen = false" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X class="w-5 h-5" />
              </button>
            </div>
            
            <nav class="flex-1 space-y-1.5 overflow-y-auto">
              <router-link v-for="item in allMenuItems" :key="item.name"
                :to="item.path" @click="isDrawerOpen = false"
                :class="[
                  'flex items-center gap-3 text-sm py-3.5 px-4 rounded-xl transition-all',
                  route.path === item.path ? 'bg-blue-50 text-blue-500 font-bold' : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                ]">
                <component :is="item.icon" :class="route.path === item.path ? 'text-blue-500' : 'text-slate-400'" class="w-5 h-5" />
                {{ item.name }}
              </router-link>
            </nav>
            
            <div class="space-y-3">
              <div class="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="text-[10px] font-bold text-slate-450 uppercase tracking-wider">로그인 정보</div>
                <div class="text-sm font-bold text-slate-800 mt-0.5">{{ auth.user?.userName }}</div>
              </div>
              <button @click="auth.logout()" class="w-full text-rose-500 border border-rose-250 bg-rose-50/50 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 active:bg-rose-100 transition-all">
                <LogOut class="w-4 h-4" /> 로그아웃
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 pb-10">
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

    <!-- Bottom Navigation Bar (Mobile Native UI) -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <template v-for="item in bottomNavItems" :key="item.name">
        <router-link 
          v-if="item.path" 
          :to="item.path"
          :class="[
            'flex flex-col items-center justify-center py-1 px-3 text-[10px] transition-colors',
            route.path === item.path ? 'text-blue-500 font-bold' : 'font-semibold text-slate-400 hover:text-slate-600'
          ]"
        >
          <component :is="item.icon" class="w-5.5 h-5.5 mb-1" />
          <span>{{ item.name }}</span>
        </router-link>
        <button 
          v-else
          @click="item.action()"
          :class="[
            'flex flex-col items-center justify-center py-1 px-3 text-[10px] transition-colors focus:outline-none',
            item.isDrawer && isDrawerItemActive ? 'text-blue-500 font-bold' : 'font-semibold text-slate-400 hover:text-slate-600'
          ]"
        >
          <component :is="item.icon" class="w-5.5 h-5.5 mb-1" />
          <span>{{ item.name }}</span>
        </button>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import {
  LogOut, Shield, LayoutGrid, Search, User, Menu, X,
  Briefcase, MapPin, CheckSquare, Layers, Users, Building2
} from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()
const isDrawerOpen = ref(false)

const pageTitle = computed(() => {
  if (route.path.includes('/m/home/assets')) return '자산 목록'
  if (route.path.includes('/m/home/profile')) return '내 정보'
  if (route.path.includes('/m/home/admin-assets')) return '자산 정보 관리'
  if (route.path.includes('/m/home/locations')) return '보관 장소 관리'
  if (route.path.includes('/m/home/approvals')) return '결재 대기함'
  if (route.path.includes('/m/home/categories')) return '카테고리 관리'
  if (route.path.includes('/m/home/users')) return '사용자 권한 관리'
  if (route.path.includes('/m/home/departments')) return '조직/부서 관리'
  return '대시보드'
})

const bottomNavItems = computed(() => {
  const items = [
    { name: '대시보드', path: '/m/home', icon: LayoutGrid }
  ]
  // 일반사용자: 자산 목록
  if (!auth.isAdmin && !auth.isManager) {
    items.push({ name: '자산 목록', path: '/m/home/assets', icon: Search })
  } else {
    // 매니저/관리자: 자산 정보 관리
    items.push({ name: '자산 정보 관리', path: '/m/home/admin-assets', icon: Briefcase })
  }
  items.push({ name: '내 정보', path: '/m/home/profile', icon: User })

  // 매니저/관리자용 전체 메뉴 버튼 추가
  if (auth.isAdmin || auth.isManager) {
    items.push({
      name: '전체 메뉴',
      icon: Menu,
      action: () => { isDrawerOpen.value = true },
      isDrawer: true
    })
  }
  return items
})

const isDrawerItemActive = computed(() => {
  const bottomPaths = bottomNavItems.value.map(item => item.path).filter(Boolean)
  return !bottomPaths.includes(route.path)
})

const allMenuItems = computed(() => {
  const items = [
    { name: '대시보드', icon: LayoutGrid, path: '/m/home' }
  ]

  if (!auth.isAdmin && !auth.isManager) {
    items.push({ name: '자산 목록', icon: Search, path: '/m/home/assets' })
  }

  if (auth.isAdmin || auth.isManager) {
    items.push({ name: '자산 정보 관리', icon: Briefcase, path: '/m/home/admin-assets' })
  }

  if (auth.isAdmin) {
    items.push({ name: '자산 결재 대기함', icon: CheckSquare, path: '/m/home/approvals' })
  }

  if (auth.isAdmin || auth.isManager) {
    items.push({ name: '보관 장소 관리', icon: MapPin, path: '/m/home/locations' })
  }

  if (auth.isAdmin) {
    items.push({ name: '카테고리 관리', icon: Layers, path: '/m/home/categories' })
    items.push({ name: '조직/부서 관리', icon: Building2, path: '/m/home/departments' })
    items.push({ name: '사용자 권한 관리', icon: Users, path: '/m/home/users' })
  }

  items.push({ name: '내 정보', icon: User, path: '/m/home/profile' })
  return items
})
</script>


