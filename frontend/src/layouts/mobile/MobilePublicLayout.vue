<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16 selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Top Compact Header -->
    <header class="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-slate-200/5">
      <router-link to="/m/home" class="flex items-center gap-2 active:scale-95 transition-transform">
        <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/30">
          A
        </div>
        <span class="text-sm font-black tracking-wider text-slate-900">ASSET MOBILE</span>
      </router-link>

      <div class="flex items-center gap-2">
        <!-- Admin Access -->
        <template v-if="auth.user && (auth.isAdmin || auth.isManager)">
          <router-link to="/m/admin/assets" class="p-2 rounded-xl text-white bg-indigo-600 active:scale-95 transition-all shadow-md">
            <Shield class="w-4 h-4" />
          </router-link>
        </template>

        <!-- Logout -->
        <button v-if="auth.user" @click="auth.logout()" class="p-2 bg-slate-100 text-slate-400 active:text-rose-500 active:bg-rose-50 border border-slate-200 rounded-xl transition-all">
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

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
      <router-link 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path"
        exact-active-class="text-indigo-600 font-bold"
        class="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
      >
        <component :is="item.icon" class="w-5.5 h-5.5 mb-1" />
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../store/auth'
import { LogOut, Shield, LayoutGrid, Search, User } from 'lucide-vue-next'

const auth = useAuthStore()

const navItems = [
  { name: '대시보드', path: '/m/home', icon: LayoutGrid },
  { name: '자산 목록', path: '/m/home/assets', icon: Search },
  { name: '내 정보', path: '/m/home/profile', icon: User }
]
</script>

<style scoped>
/* Bottom navigation overrides */
.router-link-active {
  color: rgb(79, 70, 229);
}
</style>
