<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import { useModalStore } from '@/store/useModalStore'
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  Tag, 
  MapPin, 
  Smartphone, 
  User, 
  X, 
  Laptop, 
  FileText, 
  Armchair, 
  Package,
  AlertTriangle,
  Receipt,
  Wrench,
  Clock,
  Check
} from 'lucide-vue-next'

const auth = useAuthStore()
const modal = useModalStore()
const route = useRoute()
const router = useRouter()

// Catalog States
const assets = ref([])
const categories = ref([])
const locations = ref([])
const departments = ref([])

// Filters
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedLocation = ref('')
const selectedDept = ref('')
const usefulLifeExpired = ref(false)
const isLoading = ref(false)

// Detail Modal States
const showDetailModal = ref(false)
const selectedAsset = ref(null)
const detailTab = ref('basic') // 'basic', 'purchase', 'maintenance'
const maintenanceHistory = ref([])
const isHistoryLoading = ref(false)


// Fetching lists
const fetchAssets = async () => {
  isLoading.value = true
  try {
    const params = {}
    if (selectedCategory.value) params.type = selectedCategory.value
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedLocation.value) params.location = selectedLocation.value
    if (selectedDept.value) params.dept_name = selectedDept.value
    if (usefulLifeExpired.value) params.useful_life_expired = 'true'
    if (searchQuery.value) params.search = searchQuery.value

    const res = await axios.get('/api/assets', { params })
    assets.value = res.data
  } catch (err) {
    console.error('Failed to fetch assets:', err)
  } finally {
    isLoading.value = false
  }
}

const fetchFilterOptions = async () => {
  try {
    const [catRes, locRes, deptRes] = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/locations'),
      axios.get('/api/departments')
    ])
    categories.value = catRes.data
    locations.value = locRes.data
    departments.value = deptRes.data
  } catch (err) {
    console.error('Failed to fetch filter options:', err)
  }
}

onMounted(async () => {
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
  await Promise.all([fetchAssets(), fetchFilterOptions()])
  if (route.query.search) {
    const matchingAsset = assets.value.find(a => a.item_code === route.query.search)
    if (matchingAsset) {
      viewAssetDetails(matchingAsset)
    }
  }
})

watch(() => route.query.search, async (newSearch) => {
  if (newSearch) {
    searchQuery.value = newSearch
    await fetchAssets()
    const matchingAsset = assets.value.find(a => a.item_code === newSearch)
    if (matchingAsset) {
      viewAssetDetails(matchingAsset)
    }
  }
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedStatus.value = ''
  selectedLocation.value = ''
  selectedDept.value = ''
  usefulLifeExpired.value = false
  router.push({ query: {} })
  fetchAssets()
}

// Category Helpers
const getCategoryIcon = (catName) => {
  if (catName === '방송 장비') return Laptop
  if (catName === '악기') return Package
  if (catName === '가구') return Armchair
  if (catName === '전자기기') return Laptop
  return Package
}

const getStatusBadgeClass = (status) => {
  if (status === 'available') return 'bg-emerald-500/10 text-emerald-650 border-emerald-500/20'
  if (status === 'in_use') return 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
  if (status === 'under_maintenance') return 'bg-amber-50 text-amber-600 border-amber-500/20'
  if (status === 'disposed') return 'bg-rose-50 text-rose-600 border-rose-500/20'
  return 'bg-slate-100 text-slate-400 border-slate-300'
}

const getStatusLabel = (status) => {
  if (status === 'available') return '사용 가능'
  if (status === 'under_maintenance') return '수리 중'
  if (status === 'disposed') return '폐기됨'
  if (status === 'lost') return '분실됨'
  return '미정'
}

const formatPrice = (val) => {
  if (!val) return '0원'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val)
}


// View Details
const viewAssetDetails = async (asset) => {
  selectedAsset.value = asset
  detailTab.value = 'basic'
  showDetailModal.value = true

  // Fetch maintenance log
  isHistoryLoading.value = true
  try {
    const res = await axios.get(`/api/assets/${asset.id}/maintenance`)
    maintenanceHistory.value = res.data
  } catch (err) {
    console.error('Failed to fetch maintenance history:', err)
  } finally {
    isHistoryLoading.value = false
  }
}


// Calculate useful life remaining
const getUsefulLifeInfo = (asset) => {
  if (!asset.purchase_date) return '구입일자 정보 없음'
  const pDate = new Date(asset.purchase_date)
  const expirationDate = new Date(pDate)
  expirationDate.setFullYear(pDate.getFullYear() + asset.useful_life_years)
  
  const today = new Date()
  const diffTime = expirationDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const formattedExp = expirationDate.toISOString().split('T')[0]
  if (diffDays < 0) {
    return `${formattedExp} 만료됨 (내용연수 초과)`
  }
  return `${formattedExp} 만료 예정 (${(diffDays / 365).toFixed(1)}년 남음)`
}
</script>

<template>
  <div class="space-y-6 pb-10 text-slate-800">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">교회 자산 목록</h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">교회가 소유한 전체 물품 정보를 검색하고 대여 및 정보를 신청합니다.</p>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-lg">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search Query -->
        <div class="relative flex-1">
          <Search class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery" 
            @input="fetchAssets" 
            type="text" 
            placeholder="자산명, 물품 코드, 시리얼 번호, 관리자 검색..." 
            class="input-field pl-10" 
          />
        </div>

        <!-- Filter Dropdowns -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <!-- Category -->
          <select v-model="selectedCategory" @change="fetchAssets" class="bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">모든 카테고리</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.category_name">{{ cat.category_name }}</option>
          </select>

          <!-- Status -->
          <select v-model="selectedStatus" @change="fetchAssets" class="bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">모든 상태</option>
            <option value="available">사용 가능</option>
            <option value="under_maintenance">수리/정비 중</option>
            <option value="disposed">폐기됨</option>
            <option value="lost">분실됨</option>
          </select>

          <!-- Location -->
          <select v-model="selectedLocation" @change="fetchAssets" class="bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">모든 보관 장소</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.location_name">{{ loc.location_name }}</option>
          </select>

          <!-- Owner Dept -->
          <select v-model="selectedDept" @change="fetchAssets" class="bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">모든 담당 부서</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.dept_name">{{ dept.dept_name }}</option>
          </select>
        </div>
      </div>

      <!-- Advanced options (Useful life toggle) -->
      <div class="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
        <div class="flex items-center gap-4">
          <!-- Useful Life toggle -->
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input 
              v-model="usefulLifeExpired" 
              @change="fetchAssets" 
              type="checkbox" 
              class="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-50 border-slate-300 w-4 h-4" 
            />
            <span class="text-xs font-semibold text-slate-350 flex items-center gap-1">
              <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
              내용연수가 만료된 자산만 보기
            </span>
          </label>
        </div>

        <button @click="resetFilters" class="text-xs font-bold text-indigo-600 hover:underline">
          필터 조건 초기화
        </button>
      </div>
    </div>

    <!-- Spinner -->
    <div v-if="isLoading" class="flex justify-center py-24">
      <div class="w-10 h-10 border-4 border-indigo-550 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Cards Grid -->
    <div v-else-if="assets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        @click="viewAssetDetails(asset)"
        class="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all duration-300 shadow-md flex flex-col cursor-pointer group"
      >
        <!-- Thumbnail -->
        <div class="h-44 bg-slate-50 flex items-center justify-center relative overflow-hidden border-b border-slate-200/80">
          <img 
            v-if="asset.image_url" 
            :src="asset.image_url" 
            :alt="asset.asset_name" 
            class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
          />
          <div v-else class="flex flex-col items-center gap-1.5 text-slate-700">
            <component :is="getCategoryIcon(asset.category_name)" class="w-10 h-10 stroke-[1.5]" />
            <span class="text-[10px] font-bold uppercase tracking-wider">{{ asset.category_name || '일반' }}</span>
          </div>

          <!-- Status badge -->
          <span 
            :class="getStatusBadgeClass(asset.status)" 
            class="absolute top-4 right-4 px-2.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider backdrop-blur-md"
          >
            {{ getStatusLabel(asset.status) }}
          </span>

          <!-- Consumable badge -->
          <span 
            v-if="asset.is_consumable" 
            class="absolute top-4 left-4 px-2 py-0.5 rounded bg-indigo-600/25 text-indigo-600 border border-indigo-550/30 text-[9px] font-black uppercase tracking-wider backdrop-blur-md"
          >
            소모품 (재고: {{ asset.stock_quantity }}개)
          </span>
        </div>

        <!-- Info -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-2">
            <div>
              <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{{ asset.category_name }}</div>
              <h3 class="font-bold text-slate-900 text-sm mt-0.5 group-hover:text-indigo-600 transition-colors line-clamp-1">{{ asset.asset_name }}</h3>
            </div>
            
            <p class="text-slate-400 text-xs line-clamp-2 leading-relaxed h-8">
              {{ asset.description || '상세 정보 없음' }}
            </p>

            <div class="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-400 font-medium">
              <div class="flex items-center gap-2">
                <Tag class="w-3.5 h-3.5 text-slate-500" />
                <span>코드: {{ asset.item_code }}</span>
              </div>
              <div class="flex items-center gap-2">
                <MapPin class="w-3.5 h-3.5 text-slate-500" />
                <span>위치: {{ asset.location || '보관함' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <User class="w-3.5 h-3.5 text-slate-500" />
                <span>담당: {{ asset.manager_name }} ({{ asset.dept_name }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-20 bg-white border border-slate-200 rounded-2xl">
      <SlidersHorizontal class="w-10 h-10 text-slate-700 mx-auto mb-3" />
      <h3 class="text-sm font-bold text-slate-400">조건에 부합하는 자산이 없습니다</h3>
      <p class="text-xs text-slate-600 mt-1">검색어를 수정해 보세요.</p>
    </div>


    <!-- Expanded Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showDetailModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh] animate-slide-up">
          <!-- Header -->
          <div class="p-5 border-b border-slate-200 flex justify-between items-center">
            <h3 class="text-base font-bold text-slate-900">자산 상세 정보</h3>
            <button @click="showDetailModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-350"><X class="w-5 h-5" /></button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-slate-200/80 bg-slate-50/30 text-xs">
            <button @click="detailTab = 'basic'" :class="[detailTab === 'basic' ? 'border-b-2 border-indigo-500 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-750']" class="flex-1 py-3 transition-all font-semibold">기본 사양</button>
            <button @click="detailTab = 'purchase'" :class="[detailTab === 'purchase' ? 'border-b-2 border-indigo-500 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-750']" class="flex-1 py-3 transition-all font-semibold">구입 및 내용연수</button>
            <button @click="detailTab = 'maintenance'" :class="[detailTab === 'maintenance' ? 'border-b-2 border-indigo-500 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-750']" class="flex-1 py-3 transition-all font-semibold">정비(A/S) 내역</button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto" v-if="selectedAsset">
            
            <!-- Tab 1: Basic Info -->
            <div v-if="detailTab === 'basic'" class="space-y-4">
              <div class="flex gap-4 p-4 bg-slate-50/60 rounded-xl border border-slate-200">
                <div class="w-16 h-16 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  <img v-if="selectedAsset.image_url" :src="selectedAsset.image_url" class="object-cover w-full h-full" />
                  <component v-else :is="getCategoryIcon(selectedAsset.category_name)" class="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{{ selectedAsset.category_name }}</div>
                  <h4 class="font-bold text-sm text-slate-800 mt-0.5">{{ selectedAsset.asset_name }}</h4>
                  <span :class="getStatusBadgeClass(selectedAsset.status)" class="inline-block px-2 py-0.5 rounded border text-[9px] font-black uppercase mt-1.5">{{ getStatusLabel(selectedAsset.status) }}</span>
                </div>
              </div>

              <!-- Specs Grid -->
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">물품 고유 코드</span>
                  <p class="font-bold text-slate-800">{{ selectedAsset.item_code }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">시리얼 번호</span>
                  <p class="font-mono font-bold text-slate-800">{{ selectedAsset.serial_number || '없음' }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">보관 및 배치 위치</span>
                  <p class="font-bold text-slate-800">{{ selectedAsset.location || '보관함' }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">관리 및 소유 부서</span>
                  <p class="font-bold text-slate-800">{{ selectedAsset.dept_name }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1 col-span-2">
                  <span class="text-[10px] text-slate-400 font-bold">카테고리</span>
                  <p class="font-bold text-slate-800">{{ selectedAsset.category_name || '미지정' }}</p>
                </div>
              </div>

              <div class="space-y-1 text-xs">
                <span class="text-[10px] text-slate-400 font-bold">담당자 정보</span>
                <p class="font-bold text-slate-250">{{ selectedAsset.manager_name }} (연락처: {{ selectedAsset.manager_contact }})</p>
              </div>

              <div class="space-y-1 text-xs pt-1 border-t border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold">자산 설명</span>
                <p class="text-slate-350 leading-relaxed font-medium whitespace-pre-wrap">{{ selectedAsset.description || '상세 메모가 작성되지 않았습니다.' }}</p>
              </div>
            </div>

            <!-- Tab 2: Purchase & useful life -->
            <div v-if="detailTab === 'purchase'" class="space-y-4">
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">구입 일자</span>
                  <p class="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-indigo-600" />
                    {{ selectedAsset.purchase_date ? selectedAsset.purchase_date.split('T')[0] : '기록 없음' }}
                  </p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">구입 가격</span>
                  <p class="font-bold text-slate-800">{{ formatPrice(selectedAsset.purchase_price) }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">구입처</span>
                  <p class="font-bold text-slate-800">{{ selectedAsset.purchase_source || '기록 없음' }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">내용연수 (Useful Life)</span>
                  <p class="font-bold text-slate-800">{{ selectedAsset.useful_life_years }}년</p>
                </div>
              </div>

              <!-- Useful Life status bar -->
              <div class="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs space-y-2">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-indigo-600" />
                  내용연수 및 기한 정보
                </div>
                <p class="font-bold text-slate-800">{{ getUsefulLifeInfo(selectedAsset) }}</p>
              </div>

              <!-- Receipt Image -->
              <div class="space-y-1.5 text-xs">
                <span class="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Receipt class="w-3.5 h-3.5 text-slate-600" />
                  구입 영수증 사진
                </span>
                <div class="aspect-[4/3] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                  <img v-if="selectedAsset.receipt_image_url" :src="selectedAsset.receipt_image_url" class="w-full h-full object-contain" />
                  <div v-else class="text-center text-slate-655 space-y-1">
                    <Receipt class="w-10 h-10 mx-auto stroke-[1]" />
                    <p class="text-[10px] font-bold">등록된 영수증 이미지가 없습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 3: Maintenance A/S History -->
            <div v-if="detailTab === 'maintenance'" class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Wrench class="w-3.5 h-3.5 text-indigo-455" />
                  정비 내역 요약
                </span>
                <span class="text-xs font-bold text-slate-400">
                  누적 A/S 비용: <span class="text-indigo-600 font-black">{{ formatPrice(maintenanceHistory.reduce((sum, item) => sum + parseFloat(item.cost), 0)) }}</span>
                </span>
              </div>

              <div v-if="isHistoryLoading" class="flex justify-center py-10">
                <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div v-else-if="maintenanceHistory.length > 0" class="space-y-3">
                <div v-for="item in maintenanceHistory" :key="item.id" class="p-3 bg-slate-50/60 rounded-xl border border-slate-200 flex justify-between gap-4 text-xs">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-800">[{{ item.maintenance_type === 'repair' ? '수리' : item.maintenance_type }}]</span>
                      <span class="text-[10px] text-slate-400">{{ item.maintenance_date.split('T')[0] }}</span>
                    </div>
                    <p class="text-slate-350 font-medium leading-relaxed">{{ item.description }}</p>
                    <div class="text-[10px] text-slate-400 mt-0.5">정비업체/담당: {{ item.handler_name || '미등록' }}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-black text-rose-400">{{ formatPrice(item.cost) }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
                <Wrench class="w-8 h-8 text-slate-750 mx-auto mb-2 stroke-[1.2]" />
                <p class="text-xs text-slate-400 font-semibold">정비(A/S) 내역이 존재하지 않습니다.</p>
              </div>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="p-5 border-t border-slate-200 bg-slate-50">
            <button @click="showDetailModal = false" class="btn-secondary w-full py-3 text-xs">닫기</button>
          </div>
        </div>
      </div>
    </Teleport>


  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
