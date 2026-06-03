<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../store/auth'
import { useModalStore } from '@/store/useModalStore'
import { 
  Sparkles,
  Laptop,
  Armchair,
  Package,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Building,
  Users,
  CheckSquare,
  Layers,
  Briefcase,
  AlertTriangle
} from 'lucide-vue-next'

const auth = useAuthStore()
const modal = useModalStore()

const isLoading = ref(false)
const adminStats = ref(null)
const managerStats = ref(null)

const getCategoryIcon = (type) => {
  if (type === '방송 장비') return Laptop
  if (type === '악기') return Package
  if (type === '가구') return Armchair
  if (type === '전자기기') return Laptop
  return Package
}

const formatPrice = (val) => {
  if (!val) return '0원'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val)
}

const getRequestTypeLabel = (type) => {
  if (type === 'register') return '신규 등록'
  if (type === 'modify') return '정보 수정'
  if (type === 'dispose') return '자산 폐기'
  if (type === 'delete') return '영구 삭제'
  return type
}

const getRequestTypeClass = (type) => {
  if (type === 'register') return 'bg-indigo-50 text-indigo-600 border border-indigo-200'
  if (type === 'modify') return 'bg-blue-50 text-blue-600 border border-blue-200'
  if (type === 'dispose') return 'bg-orange-50 text-orange-600 border border-orange-200'
  if (type === 'delete') return 'bg-rose-50 text-rose-600 border border-rose-200'
  return 'bg-slate-50 text-slate-600 border border-slate-200'
}

const getAssetName = (item) => {
  try {
    const data = JSON.parse(item.requested_data)
    return data.asset_name || '알 수 없는 자산'
  } catch (e) {
    return '알 수 없는 자산'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Fetch dashboard data based on role
const loadDashboardData = async () => {
  if (!auth.user) return
  isLoading.value = true
  try {
    // 1. Admin dashboard
    if (auth.isAdmin) {
      const adminRes = await axios.get('/api/admins/stats')
      adminStats.value = adminRes.data
    }

    // 2. Manager dashboard
    if (auth.isManager) {
      const managerRes = await axios.get('/api/assets/manager-stats')
      managerStats.value = managerRes.data
    }
  } catch (err) {
    console.error('Fetch dashboard stats error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="space-y-8 pb-10 text-slate-800">
    <!-- Hero / Title -->
    <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xl">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
        <div class="absolute top-1/2 -left-24 w-64 h-64 bg-indigo-950/20 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-3 max-w-2xl text-center md:text-left">
          <div class="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
            <Sparkles class="w-3 h-3" />
            Church Asset Portal
          </div>
          <h1 class="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {{ auth.user?.userName || '성도' }}님, 환영합니다
          </h1>
          <p class="text-xs md:text-sm text-slate-400 font-medium">
            그동안 수기나 개별 문서로 관리되어 파악하기 어려웠던 교회 자산을 디지털 전산으로 전환하여 투명하게 통합 모니터링하는 자산 관리 포털입니다.
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button @click="loadDashboardData" class="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-md">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading && !adminStats && !managerStats" class="flex flex-col items-center justify-center py-24 space-y-3">
      <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs text-slate-400 font-semibold">대시보드 데이터를 불러오는 중...</p>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-300">

      <!-- 👤 SECTION A: ADMIN (최고 관리자 - 재정부) DASHBOARD -->
      <section v-if="auth.isAdmin && adminStats" class="space-y-6 pt-2">
        <div class="border-b border-slate-200 pb-2 flex items-center gap-2">
          <ShieldCheck class="w-5 h-5 text-indigo-600" />
          <h2 class="text-lg font-black text-slate-900">최고 관리자 현황판 (재정부)</h2>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <!-- Pending Change Requests -->
          <router-link to="/home/approvals" class="glass-card flex items-center justify-between hover:border-indigo-500/50 transition-all group">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">결재 대기 자산 등록/폐기 요청</div>
              <div class="text-3xl font-black text-slate-900 mt-1 tracking-tight">{{ adminStats.pendingChangeRequests }}건</div>
              <p class="text-[11px] text-slate-455 mt-1">자산담당자가 승인 요청한 목록</p>
            </div>
            <div class="w-12 h-12 bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-700 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
              <CheckSquare class="w-6 h-6" />
            </div>
          </router-link>

          <!-- Pending User Registrations -->
          <router-link to="/home/users" class="glass-card flex items-center justify-between hover:border-indigo-500/50 transition-all group">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">가입 승인 대기 인원</div>
              <div class="text-3xl font-black text-slate-900 mt-1 tracking-tight">{{ adminStats.pendingUsers }}명</div>
              <p class="text-[11px] text-slate-455 mt-1">승인되지 않은 신규 가입 성도 수</p>
            </div>
            <div class="w-12 h-12 bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
              <Users class="w-6 h-6" />
            </div>
          </router-link>

          <!-- Total Assets -->
          <router-link to="/home/admin-assets" class="glass-card flex items-center justify-between hover:border-indigo-500/50 transition-all group">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">교회 총 등록 자산</div>
              <div class="text-3xl font-black text-slate-900 mt-1 tracking-tight">{{ adminStats.totalAssets }}개</div>
              <p class="text-[11px] text-slate-400 mt-1">교회 전체의 자산 현황 요약</p>
            </div>
            <div class="w-12 h-12 bg-emerald-500/10 text-emerald-650 group-hover:bg-emerald-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
              <Layers class="w-6 h-6" />
            </div>
          </router-link>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Category Stats (Categories & Value) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 class="text-sm font-bold text-slate-750 flex items-center gap-1.5">
              <TrendingUp class="w-4 h-4 text-indigo-600" />
              카테고리별 자산 분포
            </h3>
            
            <div class="space-y-3">
              <router-link 
                v-for="cat in adminStats.categoryStats" 
                :key="cat.name" 
                :to="`/home/admin-assets?category=${cat.name}`" 
                class="block space-y-1 hover:bg-slate-50 p-2 rounded-xl transition-all group"
              >
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-350 group-hover:text-indigo-650 transition-colors">{{ cat.name }} ({{ cat.count }}개)</span>
                  <span class="text-slate-400 group-hover:text-slate-700 transition-colors">{{ formatPrice(cat.total_value) }}</span>
                </div>
                <div class="w-full bg-slate-50 h-2 rounded-full overflow-hidden mt-1">
                  <div 
                    class="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(100, (cat.count / Math.max(1, adminStats.totalAssets)) * 100)}%` }"
                  ></div>
                </div>
              </router-link>
            </div>
          </div>

          <!-- Department Stats -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 class="text-sm font-bold text-slate-750 flex items-center gap-1.5">
              <Building class="w-4 h-4 text-indigo-455" />
              부서별 소유 자산 분포
            </h3>

            <div class="space-y-3">
              <router-link 
                v-for="dept in adminStats.deptStats" 
                :key="dept.name" 
                :to="`/home/admin-assets?dept=${dept.name}`" 
                class="block space-y-1 hover:bg-slate-50 p-2 rounded-xl transition-all group"
              >
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-350 group-hover:text-emerald-650 transition-colors">{{ dept.name }} ({{ dept.count }}개)</span>
                  <span class="text-slate-400 group-hover:text-slate-700 transition-colors">{{ formatPrice(dept.total_value) }}</span>
                </div>
                <div class="w-full bg-slate-50 h-2 rounded-full overflow-hidden mt-1">
                  <div 
                    class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(100, (dept.count / Math.max(1, adminStats.totalAssets)) * 100)}%` }"
                  ></div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- 👤 SECTION B: MANAGER (자산 담당자 - 관리부) DASHBOARD -->
      <section v-if="auth.isManager && managerStats" class="space-y-6 pt-2">
        <div class="border-b border-slate-200 pb-2 flex items-center gap-2">
          <Briefcase class="w-5 h-5 text-indigo-600" />
          <h2 class="text-lg font-black text-slate-900">자산 담당자 현황판 (관리부)</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Maintenance Devices -->
          <router-link to="/home/admin-assets?status=under_maintenance" class="glass-card flex items-center justify-between hover:border-indigo-500/50 transition-all group">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">교회 전체 수리/정비 대상</div>
              <div class="text-3xl font-black text-slate-900 mt-1 tracking-tight">{{ managerStats.maintenanceAssets.length }}개</div>
              <p class="text-[11px] text-slate-400 mt-1">현재 정비(수리) 중인 교회 전체 장비 수</p>
            </div>
            <div class="w-12 h-12 bg-rose-50 text-rose-400 group-hover:bg-rose-500 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
              <AlertCircle class="w-6 h-6" />
            </div>
          </router-link>

          <!-- Pending Requests -->
          <router-link to="/home/approvals" class="glass-card flex items-center justify-between hover:border-indigo-500/50 transition-all group">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">결재 대기 중인 요청</div>
              <div class="text-3xl font-black text-slate-900 mt-1 tracking-tight">{{ managerStats.pendingRequestsCount }}건</div>
              <p class="text-[11px] text-slate-455 mt-1">승인 대기 중인 자산 요청 수</p>
            </div>
            <div class="w-12 h-12 bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
              <CheckSquare class="w-6 h-6" />
            </div>
          </router-link>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Dept Asset Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 col-span-1">
            <h3 class="text-sm font-bold text-slate-750 flex items-center gap-1.5">
              <Building class="w-4 h-4 text-indigo-455" />
              교회 전체 자산 카테고리 현황
            </h3>
            
            <div class="space-y-3">
              <router-link 
                v-for="cat in managerStats.deptAssetsSummary" 
                :key="cat.name" 
                :to="`/home/admin-assets?category=${cat.name}`" 
                class="flex items-center justify-between text-xs hover:bg-slate-50 p-2 rounded-xl transition-all group"
              >
                <span class="text-slate-455 font-bold flex items-center gap-2 group-hover:text-indigo-650 transition-colors">
                  <component :is="getCategoryIcon(cat.name)" class="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  {{ cat.name }}
                </span>
                <span class="px-2.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-bold text-slate-800 group-hover:bg-white group-hover:border-indigo-200 transition-all">{{ cat.count }}개</span>
              </router-link>
              <div v-if="managerStats.deptAssetsSummary.length === 0" class="text-center py-6 text-slate-600 text-xs">
                등록된 자산이 없습니다.
              </div>
            </div>
          </div>

          <!-- Recent Approval Requests -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 col-span-1">
            <h3 class="text-sm font-bold text-slate-750 flex items-center gap-1.5">
              <CheckSquare class="w-4 h-4 text-indigo-650" />
              최근 결재 신청 이력
            </h3>

            <div class="space-y-3">
              <div 
                v-for="item in managerStats.recentRequests" 
                :key="item.id" 
                class="block p-3 bg-slate-50/60 rounded-xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <span :class="getRequestTypeClass(item.request_type)" class="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {{ getRequestTypeLabel(item.request_type) }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-medium">{{ formatDate(item.created_at) }}</span>
                </div>
                
                <div class="flex items-center justify-between gap-4">
                  <span class="text-xs font-bold text-slate-800 truncate">{{ getAssetName(item) }}</span>
                  <span 
                    v-if="item.status === 'pending'"
                    class="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-bold shrink-0"
                  >
                    대기중
                  </span>
                  <span 
                    v-else-if="item.status === 'approved'"
                    class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-650 border border-emerald-200 text-[9px] font-bold shrink-0"
                  >
                    승인됨
                  </span>
                  <span 
                    v-else-if="item.status === 'rejected'"
                    class="px-2 py-0.5 rounded bg-rose-50 text-rose-550 border border-rose-200 text-[9px] font-bold shrink-0"
                  >
                    반려됨
                  </span>
                </div>

                <div v-if="item.status === 'rejected' && item.reject_reason" class="text-[10px] text-rose-600 bg-rose-50/50 px-2 py-1.5 rounded-lg border border-rose-100/50 break-keep">
                  반려 사유: {{ item.reject_reason }}
                </div>
              </div>
              <div v-if="managerStats.recentRequests.length === 0" class="text-center py-10">
                <CheckCircle class="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p class="text-xs text-slate-655 font-semibold">최근 결재 신청한 이력이 없습니다.</p>
              </div>
            </div>
          </div>

          <!-- Maintenance Asset List -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 col-span-1">
            <h3 class="text-sm font-bold text-rose-400 flex items-center gap-1.5">
              <AlertCircle class="w-4 h-4" />
              전체 정비 대상 기기 목록
            </h3>

            <div class="space-y-3">
              <router-link 
                v-for="item in managerStats.maintenanceAssets" 
                :key="item.id" 
                :to="`/home/admin-assets?search=${item.item_code}`" 
                class="block p-3 bg-slate-50/60 rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-500/50 hover:bg-white transition-all group"
              >
                <div>
                  <div class="text-xs font-bold text-slate-800 group-hover:text-indigo-650 transition-colors">{{ item.asset_name }}</div>
                  <div class="text-[9px] text-slate-400 mt-0.5">코드: {{ item.item_code }}</div>
                </div>
                <div class="text-right text-xs">
                  <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-400 border border-rose-500/20 text-[9px] font-bold">수리중</span>
                  <div class="text-[9px] text-slate-400 mt-1">담당: {{ item.manager_name }}</div>
                </div>
              </router-link>
              <div v-if="managerStats.maintenanceAssets.length === 0" class="text-center py-10">
                <CheckCircle class="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p class="text-xs text-slate-500 font-semibold">정비 중인 자산이 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 👤 SECTION C: GENERAL USER (일반 사용자) LANDING -->
      <section v-if="!auth.isAdmin && !auth.isManager" class="max-w-xl mx-auto py-10 text-center space-y-6">
        <div class="w-16 h-16 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Layers class="w-8 h-8" />
        </div>
        
        <div class="space-y-2">
          <h2 class="text-xl font-bold text-slate-900">교회 자산 정보 열람</h2>
          <p class="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            현재 교회가 보유하고 있는 방송 기기, 악기, 전자기기 및 가구 비품의 상세 사양과 보관 위치 등의 정보를 조회할 수 있습니다.
          </p>
        </div>

        <router-link to="/home/assets" class="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs font-bold shadow-indigo-600/20">
          교회 자산 목록 바로가기
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </section>

    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
