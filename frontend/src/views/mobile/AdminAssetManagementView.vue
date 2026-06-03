<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import QrcodeVue from 'qrcode.vue'
import { useAuthStore } from '@/store/auth'
import { useModalStore } from '@/store/useModalStore'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search,
  SlidersHorizontal,
  Laptop,
  FileText,
  Armchair,
  Package,
  Calendar,
  User,
  Phone,
  Clock,
  AlertTriangle,
  QrCode,
  Wrench,
  Printer,
  Trash,
  ChevronDown,
  Eye,
  Receipt,
  Camera,
  Image as ImageIcon
} from 'lucide-vue-next'

const auth = useAuthStore()
const modal = useModalStore()
const route = useRoute()
const router = useRouter()

// Filter states
const selectedDeptFilter = ref('')
const selectedCategoryFilter = ref('')
const selectedStatusFilter = ref('')
const showLowStockOnly = ref(false)

// Data States
const assets = ref([])
const departments = ref([])
const categories = ref([])
const locations = ref([])
const assetSearch = ref('')
const isLoading = ref(false)

// CRUD Modal States
const showAssetModal = ref(false)
const isEditing = ref(false)
const editingAssetId = ref(null)
const selectedImageFile = ref(null)
const removeImageChecked = ref(false)

const assetForm = ref({
  asset_name: '',
  category_name: '',
  serial_number: '',
  item_code: '',
  purchase_date: '',
  purchase_price: '',
  purchase_source: '',
  useful_life_years: 5,
  is_consumable: false,
  stock_quantity: 0,
  location: '',
  dept_name: auth.user?.deptName || '', // Default to user's department
  manager_name: '',
  manager_contact: '',
  description: '',
  status: 'available'
})

// QR Print State
const showQrModal = ref(false)
const selectedQrAsset = ref(null)

// Maintenance (A/S) State
const showMaintenanceModal = ref(false)
const selectedMaintenanceAsset = ref(null)
const maintenanceHistory = ref([])
const isHistoryLoading = ref(false)
const maintenanceForm = ref({
  maintenance_date: '',
  maintenance_type: 'repair',
  cost: '',
  description: '',
  handler_name: ''
})

// Detail Modal States
const showDetailModal = ref(false)
const selectedDetailAsset = ref(null)
const detailTab = ref('basic') // 'basic', 'purchase', 'maintenance'
const detailMaintenanceHistory = ref([])
const isDetailHistoryLoading = ref(false)

const viewAssetDetails = async (asset) => {
  selectedDetailAsset.value = asset
  detailTab.value = 'basic'
  showDetailModal.value = true

  isDetailHistoryLoading.value = true
  try {
    const res = await axios.get(`/api/assets/${asset.id}/maintenance`)
    detailMaintenanceHistory.value = res.data
  } catch (err) {
    console.error('Failed to fetch maintenance history:', err)
  } finally {
    isDetailHistoryLoading.value = false
  }
}

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


// Fetch all assets
const fetchAssets = async () => {
  try {
    const res = await axios.get('/api/assets')
    assets.value = res.data
  } catch (err) {
    console.error('Fetch assets error:', err)
  }
}

// Fetch lists for mapping
const fetchOptions = async () => {
  try {
    const [deptRes, catRes, locRes] = await Promise.all([
      axios.get('/api/departments'),
      axios.get('/api/categories'),
      axios.get('/api/locations')
    ])
    departments.value = deptRes.data
    categories.value = catRes.data
    locations.value = locRes.data
  } catch (err) {
    console.error('Fetch options error:', err)
  }
}

const loadAllData = async () => {
  isLoading.value = true
  selectedAssetIds.value = [] // clear selections on reload
  await Promise.all([fetchAssets(), fetchOptions()])
  isLoading.value = false
}

const parseRouteQuery = () => {
  selectedDeptFilter.value = route.query.dept || ''
  selectedCategoryFilter.value = route.query.category || ''
  selectedStatusFilter.value = route.query.status || ''
  showLowStockOnly.value = route.query.filter === 'low_stock'
  assetSearch.value = route.query.search || ''

  // Automatically open detail popup if unique item_code is searched
  if (route.query.search && assets.value.length > 0) {
    const matched = assets.value.find(a => a.item_code === route.query.search)
    if (matched) {
      viewAssetDetails(matched)
    }
  }

  // Automatically open Add Asset modal if action=register
  if (route.query.action === 'register') {
    openAddAssetModal()
    // Remove the query parameter so it doesn't reopen on refresh
    const query = { ...route.query }
    delete query.action
    router.replace({ query })
  }
}

onMounted(async () => {
  await loadAllData()
  parseRouteQuery()
})

watch(() => route.query, () => {
  parseRouteQuery()
}, { deep: true })

const clearQueryFilter = (key) => {
  const query = { ...route.query }
  delete query[key]
  router.push({ query })
}

const clearAllQueryFilters = () => {
  router.push({ query: {} })
}

// Filter assets based on search query
const filteredAssets = computed(() => {
  let list = assets.value

  if (selectedDeptFilter.value) {
    list = list.filter(a => a.dept_name === selectedDeptFilter.value)
  }
  if (selectedCategoryFilter.value) {
    list = list.filter(a => a.category_name === selectedCategoryFilter.value)
  }
  if (selectedStatusFilter.value) {
    list = list.filter(a => a.status === selectedStatusFilter.value)
  }
  if (showLowStockOnly.value) {
    list = list.filter(a => a.is_consumable && a.stock_quantity <= 5)
  }

  if (!assetSearch.value) return list
  const query = assetSearch.value.toLowerCase()
  return list.filter(a => 
    a.asset_name.toLowerCase().includes(query) ||
    (a.category_name && a.category_name.toLowerCase().includes(query)) ||
    (a.dept_name && a.dept_name.toLowerCase().includes(query)) ||
    (a.serial_number && a.serial_number.toLowerCase().includes(query)) ||
    (a.item_code && a.item_code.toLowerCase().includes(query)) ||
    (a.manager_name && a.manager_name.toLowerCase().includes(query)) ||
    (a.location && a.location.toLowerCase().includes(query)) ||
    (a.status && getStatusLabel(a.status).toLowerCase().includes(query))
  )
})

// Formatting helpers
const getCategoryIcon = (catName) => {
  if (catName === '방송 장비') return Laptop
  if (catName === '악기') return Package
  if (catName === '가구') return Armchair
  if (catName === '전자기기') return Laptop
  return Package
}

const getStatusLabel = (status) => {
  if (status === 'available') return '사용 가능'
  if (status === 'in_use') return '사용 중'
  if (status === 'under_maintenance') return '수리 중'
  if (status === 'disposed') return '폐기됨'
  if (status === 'lost') return '분실됨'
  return status
}

const getStatusBadgeClass = (status) => {
  if (status === 'available') return 'bg-emerald-500/10 text-emerald-650 border-emerald-500/20'
  if (status === 'in_use') return 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
  if (status === 'under_maintenance') return 'bg-amber-50 text-amber-600 border-amber-500/20'
  return 'bg-slate-100 text-slate-400 border-slate-300'
}

const getRequestStatusLabel = (status) => {
  if (status === 'pending') return '승인 대기'
  if (status === 'pending_return') return '반납확인 대기'
  if (status === 'approved') return '사용 중'
  if (status === 'rejected') return '반려됨'
  if (status === 'completed') return '반납 완료'
  return status
}

const getRequestStatusClass = (status) => {
  if (status === 'pending') return 'bg-amber-50 text-amber-600 border-amber-500/20'
  if (status === 'pending_return') return 'bg-sky-50 text-sky-400 border-sky-500/20 animate-pulse'
  if (status === 'approved') return 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
  if (status === 'rejected') return 'bg-rose-50 text-rose-600 border-rose-500/20'
  return 'bg-slate-100 text-slate-400 border-slate-300'
}

// Request Operations

// Asset CRUD Operations
const fileInput = ref(null)
const cameraInput = ref(null)
const imagePreviewUrl = ref(null)

const handleImageChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedImageFile.value = file
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

const clearSelectedImage = () => {
  selectedImageFile.value = null
  imagePreviewUrl.value = null
  if (isEditing.value) {
    removeImageChecked.value = true
  }
}

watch(removeImageChecked, (newVal) => {
  if (newVal) {
    imagePreviewUrl.value = null
  } else if (isEditing.value && editingAssetId.value) {
    const asset = assets.value.find(a => a.id === editingAssetId.value)
    if (asset) {
      imagePreviewUrl.value = asset.image_url || null
    }
  }
})

const openAddAssetModal = () => {
  isEditing.value = false
  editingAssetId.value = null
  selectedImageFile.value = null
  imagePreviewUrl.value = null
  removeImageChecked.value = false
  assetForm.value = {
    asset_name: '',
    category_name: categories.value[0]?.category_name || '',
    serial_number: '',
    item_code: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    purchase_source: '',
    useful_life_years: 5,
    is_consumable: false,
    stock_quantity: 0,
    location: locations.value[0]?.location_name || '',
    dept_name: auth.user?.deptName || '', // Default to user's department
    manager_name: auth.user?.userName || '',
    manager_contact: auth.user?.phone || '',
    description: '',
    status: 'available'
  }
  showAssetModal.value = true
}

const openEditAssetModal = (asset) => {
  isEditing.value = true
  editingAssetId.value = asset.id
  selectedImageFile.value = null
  imagePreviewUrl.value = asset.image_url || null
  removeImageChecked.value = false
  
  let pDate = ''
  if (asset.purchase_date) {
    pDate = asset.purchase_date.split('T')[0]
  }

  assetForm.value = {
    asset_name: asset.asset_name,
    category_name: asset.category_name || '',
    serial_number: asset.serial_number || '',
    item_code: asset.item_code || '',
    purchase_date: pDate,
    purchase_price: asset.purchase_price || '',
    purchase_source: asset.purchase_source || '',
    useful_life_years: asset.useful_life_years || 5,
    is_consumable: !!asset.is_consumable,
    stock_quantity: asset.stock_quantity || 0,
    location: asset.location || '',
    dept_name: asset.dept_name || auth.user?.deptName || '',
    manager_name: asset.manager_name || '',
    manager_contact: asset.manager_contact || '',
    description: asset.description || '',
    status: asset.status
  }
  showAssetModal.value = true
}

const saveAsset = async () => {
  const form = assetForm.value
  if (!form.asset_name || !form.manager_name || !form.manager_contact) {
    modal.showAlert('자산명, 담당자 이름 및 연락처는 필수 항목입니다.')
    return
  }

  const formData = new FormData()
  Object.keys(form).forEach(key => {
    formData.append(key, form[key])
  })

  if (selectedImageFile.value) {
    formData.append('image', selectedImageFile.value)
  }
  if (removeImageChecked.value) {
    formData.append('remove_image', 'true')
  }

  isLoading.value = true
  try {
    let res
    if (isEditing.value) {
      res = await axios.put(`/api/assets/${editingAssetId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      res = await axios.post('/api/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    if (res.data.success) {
      modal.showAlert(res.data.message || (isEditing.value ? '자산 정보가 수정되었습니다.' : '신규 자산이 등록되었습니다.'))
      showAssetModal.value = false
      fetchAssets()
    }
  } catch (err) {
    modal.showAlert(err.response?.data?.message || '자산 저장에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const deleteAsset = async (assetId, requestType = 'delete') => {
  const title = requestType === 'dispose' ? '폐기' : '삭제';
  const confirm = await modal.showConfirm(`자산을 ${title}하시겠습니까? ${requestType === 'delete' ? '이 작업은 취소할 수 없으며 관련 내역이 지워집니다.' : '자산 상태가 폐기됨으로 전환됩니다.'}`)
  if (!confirm) return
  
  try {
    const res = await axios.delete(`/api/assets/${assetId}`, { params: { request_type: requestType } })
    if (res.data.success) {
      modal.showAlert(res.data.message || `자산 ${title} 처리가 정상 처리되었습니다.`)
      fetchAssets()
    }
  } catch (err) {
    modal.showAlert('오류가 발생했습니다.')
  }
}

// QR Code printing logic
const selectedAssetIds = ref([])
const printMode = ref('single')

const showImageZoomModal = ref(false)
const zoomedImageUrl = ref('')

const openImageZoom = (url) => {
  if (!url) return
  zoomedImageUrl.value = url
  showImageZoomModal.value = true
}

const windowOrigin = computed(() => {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
})

const selectedAssetsForPrint = computed(() => {
  return assets.value.filter(a => selectedAssetIds.value.includes(a.id))
})

const openQrModal = (asset) => {
  selectedQrAsset.value = asset
  showQrModal.value = true
}

const printQrCode = () => {
  printMode.value = 'single'
  nextTick(() => {
    window.print()
  })
}

const printBulkQr = () => {
  printMode.value = 'bulk'
  nextTick(() => {
    window.print()
  })
}

const qrCodeValue = computed(() => {
  if (!selectedQrAsset.value) return ''
  return `${windowOrigin.value}/home/assets?search=${selectedQrAsset.value.item_code}`
})

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedAssetIds.value = filteredAssets.value.map(a => a.id)
  } else {
    selectedAssetIds.value = []
  }
}

const isAllSelected = computed(() => {
  return filteredAssets.value.length > 0 && 
         filteredAssets.value.every(a => selectedAssetIds.value.includes(a.id))
})

// A/S Maintenance logs logic
const openMaintenanceModal = async (asset) => {
  selectedMaintenanceAsset.value = asset
  maintenanceForm.value = {
    maintenance_date: new Date().toISOString().split('T')[0],
    maintenance_type: 'repair',
    cost: '',
    description: '',
    handler_name: ''
  }
  showMaintenanceModal.value = true
  fetchMaintenanceHistory(asset.id)
}

const fetchMaintenanceHistory = async (assetId) => {
  isHistoryLoading.value = true
  try {
    const res = await axios.get(`/api/assets/${assetId}/maintenance`)
    maintenanceHistory.value = res.data
  } catch (err) {
    console.error('Fetch maintenance error:', err)
  } finally {
    isHistoryLoading.value = false
  }
}

const addMaintenanceLog = async () => {
  const form = maintenanceForm.value
  if (!form.maintenance_date || !form.description) {
    modal.showAlert('정비 일자와 상세 내용은 필수입니다.')
    return
  }

  try {
    const res = await axios.post(`/api/assets/${selectedMaintenanceAsset.value.id}/maintenance`, form)
    if (res.data.success) {
      modal.showAlert('정비 내역이 등록되었습니다.')
      fetchMaintenanceHistory(selectedMaintenanceAsset.value.id)
      fetchAssets()
    }
  } catch (err) {
    modal.showAlert('등록 중 오류 발생')
  }
}

const deleteMaintenanceLog = async (id) => {
  if (await modal.showConfirm('해당 정비 내역을 삭제하겠습니까?')) {
    try {
      const res = await axios.delete(`/api/assets/${selectedMaintenanceAsset.value.id}/maintenance/${id}`)
      if (res.data.success) {
        modal.showAlert('삭제 완료')
        fetchMaintenanceHistory(selectedMaintenanceAsset.value.id)
        fetchAssets()
      }
    } catch (err) {
      modal.showAlert('삭제 실패')
    }
  }
}

const formatPrice = (val) => {
  if (!val) return '0원'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val)
}
</script>

<template>
  <div class="space-y-6 pb-10 text-slate-800">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <button @click="openAddAssetModal" class="btn-primary flex items-center gap-1 text-xs py-2.5">
          <Plus class="w-4 h-4" />
          신규 자산 등록
        </button>
      </div>
    </div>

    <!-- Workspace View -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-6 animate-in fade-in duration-300">
      <!-- Assets List Section -->
      <div class="space-y-4">
        <!-- Search bar & Bulk action button -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="relative w-full max-w-md">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              v-model="assetSearch"
              type="text" 
              placeholder="자산명, 물품 코드, 보관 위치, 담당자 검색..." 
              class="input-field pl-9 py-2 text-xs" 
            />
          </div>
          <div v-if="selectedAssetIds.length > 0" class="shrink-0 animate-in slide-in-from-right duration-250">
            <button 
              @click="printBulkQr"
              class="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 font-bold shadow-lg shadow-indigo-100"
            >
              <Printer class="w-4 h-4" />
              선택 자산 QR 일괄 출력 ({{ selectedAssetIds.length }}건)
            </button>
          </div>
        </div>

        <!-- Active Filters Display -->
        <div v-if="selectedDeptFilter || selectedCategoryFilter || selectedStatusFilter || showLowStockOnly" class="flex flex-wrap gap-2 items-center bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 animate-in fade-in duration-200">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">적용된 필터:</span>
          
          <span v-if="selectedDeptFilter" class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-650 border border-indigo-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            부서: {{ selectedDeptFilter }}
            <button @click="clearQueryFilter('dept')" class="hover:text-indigo-800 focus:outline-none"><X class="w-3.5 h-3.5" /></button>
          </span>

          <span v-if="selectedCategoryFilter" class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-650 border border-indigo-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            카테고리: {{ selectedCategoryFilter }}
            <button @click="clearQueryFilter('category')" class="hover:text-indigo-800 focus:outline-none"><X class="w-3.5 h-3.5" /></button>
          </span>

          <span v-if="selectedStatusFilter" class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            상태: {{ getStatusLabel(selectedStatusFilter) }}
            <button @click="clearQueryFilter('status')" class="hover:text-amber-850 focus:outline-none"><X class="w-3.5 h-3.5" /></button>
          </span>

          <span v-if="showLowStockOnly" class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            재고 부족 소모품
            <button @click="clearQueryFilter('filter')" class="hover:text-rose-850 focus:outline-none"><X class="w-3.5 h-3.5" /></button>
          </span>

          <button @click="clearAllQueryFilters" class="text-[10px] text-indigo-650 hover:underline font-bold ml-1.5">
            필터 조건 전체 해제
          </button>
        </div>

        <!-- Mobile Assets List Cards -->
        <div v-if="filteredAssets.length > 0" class="space-y-4">
          <div 
            v-for="asset in filteredAssets" 
            :key="asset.id" 
            class="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3 relative active:border-indigo-200 transition-colors"
            :class="{ 'bg-slate-50/70 border-indigo-200': selectedAssetIds.includes(asset.id) }"
          >
            <!-- Checkbox + Name -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  :value="asset.id" 
                  v-model="selectedAssetIds" 
                  class="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-white border-slate-300 w-4 h-4 cursor-pointer"
                />
                <div>
                  <div 
                    @click="viewAssetDetails(asset)" 
                    class="font-bold text-slate-850 hover:text-indigo-650 hover:underline cursor-pointer text-sm"
                  >
                    {{ asset.asset_name }}
                  </div>
                  <div class="text-[10px] text-indigo-600 font-black mt-0.5">{{ asset.item_code }}</div>
                </div>
              </div>
              
              <span :class="getStatusBadgeClass(asset.status)" class="px-2.5 py-0.5 rounded border text-[9px] font-bold shrink-0">
                {{ getStatusLabel(asset.status) }}
              </span>
            </div>

            <!-- Category / Serial / Location / Owner -->
            <div class="flex gap-3 pt-1">
              <div class="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                <img v-if="asset.image_url" :src="asset.image_url" class="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity" @click.stop="openImageZoom(asset.image_url)" title="크게 보기" />
                <component v-else :is="getCategoryIcon(asset.category_name)" class="w-5 h-5 text-slate-400" />
              </div>
              <div class="flex-1 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-400">
                <div>
                  <span class="text-[10px] text-slate-500 block font-semibold">카테고리</span>
                  <span class="font-bold text-slate-700">{{ asset.category_name }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 block font-semibold">시리얼 번호</span>
                  <span class="font-mono text-slate-700 block break-words">{{ asset.serial_number || '없음' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 block font-semibold">보관 위치</span>
                  <span class="text-slate-700">{{ asset.location || '보관함' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 block font-semibold">소속/담당자</span>
                  <span class="text-slate-700 block break-words">{{ asset.manager_name }} ({{ asset.dept_name }})</span>
                </div>
              </div>
            </div>

            <!-- Actions Row -->
            <div class="flex items-center justify-between gap-1.5 pt-3 border-t border-slate-100">
              <div class="flex gap-1">
                <button 
                  @click="viewAssetDetails(asset)"
                  class="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 active:bg-slate-100"
                  title="자산 상세 정보 조회"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="openMaintenanceModal(asset)"
                  class="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 active:bg-slate-100"
                  title="A/S 정비 내역 관리"
                >
                  <Wrench class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="openQrModal(asset)"
                  class="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 active:bg-slate-100"
                  title="QR 코드 라벨 발행"
                >
                  <QrCode class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="openEditAssetModal(asset)"
                  class="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 active:bg-slate-100"
                  title="자산 정보 수정"
                >
                  <Edit class="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div class="flex gap-1">
                <button 
                  @click="deleteAsset(asset.id, 'dispose')"
                  class="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 active:bg-amber-100"
                  title="자산 폐기 신청"
                >
                  <Trash class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="deleteAsset(asset.id, 'delete')"
                  class="p-2 bg-rose-50 text-rose-550 rounded-lg border border-rose-200 active:bg-rose-100"
                  title="자산 삭제 신청"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty assets state -->
        <div v-else class="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <Package class="w-10 h-10 text-slate-750 mx-auto mb-3" />
          <h3 class="text-sm font-bold text-slate-400">등록된 자산이 없습니다</h3>
          <p class="text-xs text-slate-500 mt-1">자산을 새로 등록해 보거나 검색어를 변경하세요.</p>
        </div>
      </div>
    </div>

    <!-- Create/Update Asset Modal -->
    <Teleport to="body">
      <div v-if="showAssetModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showAssetModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-slide-up">
          <div class="flex items-center justify-between p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">
              {{ isEditing ? '자산 정보 수정' : '신규 자산 등록' }} 
              <span v-if="auth.isManager" class="text-xs text-indigo-600 ml-1">(재정부 승인 요청)</span>
            </h3>
            <button @click="showAssetModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X class="w-5 h-5" /></button>
          </div>

          <!-- Form Body -->
          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            
            <div class="space-y-1.5">
              <label class="block font-bold text-slate-400">자산 명칭 <span class="text-rose-500">*</span></label>
              <input v-model="assetForm.asset_name" type="text" placeholder="예: SHURE SM58 마이크 2호기" required class="input-field text-xs py-2" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">카테고리 <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="assetForm.category_name" required class="input-field text-xs py-2 appearance-none cursor-pointer">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.category_name">{{ cat.category_name }}</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">시리얼 번호</label>
                <input v-model="assetForm.serial_number" type="text" placeholder="제조사 고유 시리얼" class="input-field text-xs py-2" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">물품 코드 (바코드/QR 연동)</label>
                <input v-model="assetForm.item_code" type="text" placeholder="비워둘 시 자동 생성" class="input-field text-xs py-2" />
              </div>
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">내용연수 (연)</label>
                <input v-model="assetForm.useful_life_years" type="number" placeholder="기본 5년" class="input-field text-xs py-2" />
              </div>
            </div>

            <!-- Consumables flags -->
            <div class="p-3 bg-slate-50/60 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <label class="font-bold text-slate-350">배터리 등 소모품으로 분류</label>
                <p class="text-[10px] text-slate-400">대시보드에 재고량 위험 알림이 발동됩니다.</p>
              </div>
              <div class="flex items-center gap-3">
                <input v-model="assetForm.is_consumable" type="checkbox" id="is_consumable" class="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-white border-slate-300 w-4 h-4" />
                <input v-if="assetForm.is_consumable" v-model="assetForm.stock_quantity" type="number" placeholder="재고 수량" class="input-field text-xs py-1.5 w-20 text-center" />
              </div>
            </div>

            <!-- Purchase Information -->
            <div class="bg-slate-50/30 p-4 border border-slate-200 rounded-xl space-y-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">구입 정보</span>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block font-medium text-slate-400">구입 일자</label>
                  <input v-model="assetForm.purchase_date" type="date" class="input-field text-xs py-1.5" />
                </div>
                <div class="space-y-1">
                  <label class="block font-medium text-slate-400">구입 가격 (원)</label>
                  <input v-model="assetForm.purchase_price" type="number" placeholder="가격 입력" class="input-field text-xs py-1.5" />
                </div>
              </div>
              
              <div class="space-y-1">
                <label class="block font-medium text-slate-400">구입처</label>
                <input v-model="assetForm.purchase_source" type="text" placeholder="예: 낙원악기상가 가야음향" class="input-field text-xs py-1.5" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">보관/배치 위치 <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="assetForm.location" required class="input-field text-xs py-2 appearance-none cursor-pointer">
                    <option v-for="loc in locations" :key="loc.id" :value="loc.location_name">{{ loc.location_name }}</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">소유/관리 부서 <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="assetForm.dept_name" required class="input-field text-xs py-2 appearance-none cursor-pointer">
                    <option v-for="dept in departments" :key="dept.id" :value="dept.dept_name">{{ dept.dept_name }}</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">담당자 성명 <span class="text-rose-500">*</span></label>
                <input v-model="assetForm.manager_name" type="text" required class="input-field text-xs py-2" />
              </div>
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-400">담당자 연락처 <span class="text-rose-500">*</span></label>
                <input v-model="assetForm.manager_contact" type="text" required class="input-field text-xs py-2" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-slate-400">상세 설명 및 특이사항</label>
              <textarea v-model="assetForm.description" placeholder="메모, 액세서리 구성품 정보 등을 작성" rows="2" class="input-field text-xs resize-none"></textarea>
            </div>

            <!-- Status (Only when editing and admin) -->
            <div v-if="isEditing && auth.isAdmin" class="space-y-1.5">
              <label class="block font-bold text-slate-400">운영 상태</label>
              <div class="relative">
                <select v-model="assetForm.status" class="input-field text-xs py-2 appearance-none cursor-pointer">
                  <option value="available">사용 가능</option>
                  <option value="in_use">사용 중</option>
                  <option value="under_maintenance">수리/점검 중</option>
                  <option value="disposed">폐기됨</option>
                </select>
                <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <!-- Image Upload -->
            <div class="space-y-2 pt-2 border-t border-slate-200">
              <label class="block font-bold text-slate-400">자산 실물 사진 등록</label>
              
              <!-- Hidden inputs -->
              <input type="file" ref="fileInput" @change="handleImageChange" accept="image/*" class="hidden" />
              <input type="file" ref="cameraInput" @change="handleImageChange" accept="image/*" capture="environment" class="hidden" />
              
              <!-- Custom action buttons -->
              <div class="grid grid-cols-2 gap-3 mt-1">
                <button type="button" @click="fileInput.click()" class="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm">
                  <ImageIcon class="w-4 h-4 text-slate-500" />
                  앨범에서 선택
                </button>
                <button type="button" @click="cameraInput.click()" class="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-50 active:bg-indigo-100 border border-indigo-100 text-indigo-650 text-xs font-bold rounded-xl transition-all shadow-sm">
                  <Camera class="w-4 h-4 text-indigo-600" />
                  카메라로 촬영
                </button>
              </div>

              <!-- Preview window -->
              <div v-if="imagePreviewUrl" class="mt-3 relative w-full aspect-[4/3] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center shadow-md animate-in fade-in duration-200">
                <img :src="imagePreviewUrl" class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" @click="openImageZoom(imagePreviewUrl)" title="크게 보기" />
                <button type="button" @click="clearSelectedImage" class="absolute top-2.5 right-2.5 p-1.5 bg-slate-900/60 hover:bg-slate-900/85 text-white rounded-full transition-colors">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="isEditing && assetForm.image_url" class="flex items-center gap-2 mt-2">
                <input v-model="removeImageChecked" type="checkbox" id="remove-img" class="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-white border-slate-300 w-4 h-4" />
                <label for="remove-img" class="text-slate-400 font-semibold">기존 사진 삭제</label>
              </div>
            </div>

          </div>

          <div class="flex gap-3 p-5 border-t border-slate-200 bg-slate-50">
            <button @click="showAssetModal = false" class="btn-secondary flex-1 py-3 text-xs">취소</button>
            <button @click="saveAsset" class="btn-primary flex-1 py-3 text-xs">
              {{ auth.isManager ? '결재 요청 등록' : '저장하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- QR Code Generator & Print Modal -->
    <Teleport to="body">
      <div v-if="showQrModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showQrModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-slide-up">
          <div class="p-5 border-b border-slate-200 flex justify-between items-center">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <QrCode class="w-4 h-4 text-indigo-600" />
              자산 QR 코드 발행
            </h3>
            <button @click="showQrModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X class="w-5 h-5" /></button>
          </div>

          <!-- Printable Area Container -->
          <div class="p-8 flex flex-col items-center justify-center space-y-6">
            
            <!-- QR Card Template -->
            <div id="print-section" class="w-64 bg-white text-slate-900 border-2 border-slate-300 rounded-xl p-5 flex flex-col items-center text-center space-y-4 shadow-md font-sans">
              <div class="text-[10px] font-black tracking-widest text-indigo-700 uppercase">CHURCH ASSET LABEL</div>
              
              <!-- Dynamic QR Code -->
              <div class="w-32 h-32 border border-slate-200 p-2 rounded bg-slate-50 flex items-center justify-center relative">
                <qrcode-vue 
                  v-if="selectedQrAsset" 
                  :value="qrCodeValue" 
                  :size="112" 
                  level="M" 
                  render-as="svg"
                  foreground="#0f172a" 
                  background="#f8fafc"
                />
              </div>

              <div class="space-y-1 w-full">
                <h4 class="font-black text-sm text-slate-900 truncate" :title="selectedQrAsset?.asset_name">{{ selectedQrAsset?.asset_name }}</h4>
                <p class="text-[11px] font-bold text-indigo-600 uppercase font-mono">{{ selectedQrAsset?.item_code }}</p>
                <div class="text-[9px] text-slate-400 font-bold mt-1">
                  위치: {{ selectedQrAsset?.location || '보관소' }} | 부서: {{ selectedQrAsset?.dept_name }}
                </div>
              </div>
            </div>

            <p class="text-[11px] text-slate-400 font-semibold text-center leading-relaxed">
              발행된 QR 라벨은 교회의 마이크, 차량, 악기 등 본체에 인쇄 또는 부착하여 스마트 기기로 바로 스캔할 수 있습니다.
            </p>
          </div>

          <div class="flex gap-3 p-5 border-t border-slate-200 bg-slate-50">
            <button @click="showQrModal = false" class="btn-secondary flex-1 py-2.5 text-xs">닫기</button>
            <button @click="printQrCode" class="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Printer class="w-4 h-4" />
              라벨 인쇄하기
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- A/S Maintenance Logs Modal -->
    <Teleport to="body">
      <div v-if="showMaintenanceModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showMaintenanceModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-slide-up">
          <div class="p-5 border-b border-slate-200 flex justify-between items-center">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Wrench class="w-4 h-4 text-indigo-600" />
              자산 정비(A/S) 내역 관리
            </h3>
            <button @click="showMaintenanceModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X class="w-5 h-5" /></button>
          </div>

          <div class="p-6 space-y-5 max-h-[65vh] overflow-y-auto text-xs">
            <!-- Asset Brief -->
            <div v-if="selectedMaintenanceAsset" class="p-3 bg-white/40 rounded-xl border border-slate-200 flex items-center gap-3">
              <div class="w-10 h-10 bg-white border border-slate-200 rounded flex items-center justify-center">
                <component :is="getCategoryIcon(selectedMaintenanceAsset.category_name)" class="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <div class="font-bold text-slate-800 text-xs">{{ selectedMaintenanceAsset.asset_name }}</div>
                <div class="text-[9px] text-indigo-600 font-bold mt-0.5">코드: {{ selectedMaintenanceAsset.item_code }}</div>
              </div>
            </div>

            <!-- Maintenance History Table -->
            <div class="space-y-2">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">등록된 정비 이력</span>
              
              <div v-if="isHistoryLoading" class="flex justify-center py-4">
                <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div v-else-if="maintenanceHistory.length > 0" class="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div v-for="log in maintenanceHistory" :key="log.id" class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-black text-indigo-600">[{{ log.maintenance_type === 'repair' ? '수리' : '점검' }}]</span>
                      <span class="text-[9px] text-slate-400">{{ log.maintenance_date.split('T')[0] }}</span>
                    </div>
                    <p class="text-slate-750 font-semibold leading-relaxed">{{ log.description }}</p>
                    <div class="text-[9px] text-slate-400">업체: {{ log.handler_name || '미기입' }}</div>
                  </div>
                  <div class="text-right flex flex-col justify-between items-end">
                    <span class="font-black text-rose-400">{{ formatPrice(log.cost) }}</span>
                    <button @click="deleteMaintenanceLog(log.id)" class="text-[9px] text-slate-400 hover:text-rose-400 font-bold mt-1">삭제</button>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 bg-slate-50/30 border border-slate-200 rounded-xl text-slate-600 font-semibold">
                등록된 A/S 내역이 없습니다.
              </div>
            </div>

            <!-- Add Maintenance Form -->
            <form @submit.prevent="addMaintenanceLog" class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">정비 내역 추가</span>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block text-[10px] text-slate-400 font-bold">정비 일자 <span class="text-rose-500">*</span></label>
                  <input v-model="maintenanceForm.maintenance_date" type="date" required class="input-field text-xs py-1.5" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] text-slate-400 font-bold">정비 종류</label>
                  <select v-model="maintenanceForm.maintenance_type" class="input-field text-xs py-1.5 appearance-none cursor-pointer">
                    <option value="repair">수리 (Repair)</option>
                    <option value="inspection">점검 (Inspection)</option>
                    <option value="calibration">보정 (Calibration)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block text-[10px] text-slate-400 font-bold">비용 (원)</label>
                  <input v-model="maintenanceForm.cost" type="number" placeholder="비용 입력" class="input-field text-xs py-1.5" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] text-slate-400 font-bold">업체 / 정비사</label>
                  <input v-model="maintenanceForm.handler_name" type="text" placeholder="예: 낙원수리점" class="input-field text-xs py-1.5" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="block text-[10px] text-slate-400 font-bold">상세 정비 내용 <span class="text-rose-500">*</span></label>
                <textarea v-model="maintenanceForm.description" placeholder="수리 규격 및 내역 서술" required rows="2" class="input-field text-xs resize-none"></textarea>
              </div>

              <button type="submit" class="btn-primary w-full py-2 text-xs font-bold shadow-none">추가 등록</button>
            </form>
          </div>

          <div class="p-5 border-t border-slate-200 bg-slate-50 text-right">
            <button @click="showMaintenanceModal = false" class="btn-secondary py-2.5 px-6 text-xs">닫기</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Teleport to body for print-only rendering -->
    <Teleport to="body">
      <div id="print-area" class="print-only-area">
        <!-- If printing single -->
        <div v-if="printMode === 'single' && selectedQrAsset" class="print-page">
          <div class="w-64 bg-white text-slate-900 border border-slate-300 rounded-xl p-5 flex flex-col items-center text-center space-y-4 shadow-none font-sans">
            <div class="text-[10px] font-black tracking-widest text-indigo-700 uppercase">CHURCH ASSET LABEL</div>
            <div class="w-32 h-32 border border-slate-200 p-2 rounded bg-slate-50 flex items-center justify-center">
              <qrcode-vue 
                :value="qrCodeValue" 
                :size="112" 
                level="M" 
                render-as="svg"
                foreground="#0f172a" 
                background="#f8fafc"
              />
            </div>
            <div class="space-y-1 w-full text-slate-900">
              <h4 class="font-black text-sm truncate" :title="selectedQrAsset.asset_name">{{ selectedQrAsset.asset_name }}</h4>
              <p class="text-[11px] font-bold text-indigo-600 uppercase font-mono">{{ selectedQrAsset.item_code }}</p>
              <div class="text-[9px] text-slate-400 font-bold mt-1">
                위치: {{ selectedQrAsset.location || '보관소' }} | 부서: {{ selectedQrAsset.dept_name }}
              </div>
            </div>
          </div>
        </div>

        <!-- If printing bulk -->
        <div v-else-if="printMode === 'bulk' && selectedAssetsForPrint.length > 0" class="print-grid">
          <div v-for="asset in selectedAssetsForPrint" :key="asset.id" class="print-item">
            <div class="w-64 bg-white text-slate-900 border border-slate-300 rounded-xl p-5 flex flex-col items-center text-center space-y-4 shadow-none font-sans">
              <div class="text-[10px] font-black tracking-widest text-indigo-700 uppercase">CHURCH ASSET LABEL</div>
              <div class="w-32 h-32 border border-slate-200 p-2 rounded bg-slate-50 flex items-center justify-center">
                <qrcode-vue 
                  :value="`${windowOrigin}/home/assets?search=${asset.item_code}`" 
                  :size="112" 
                  level="M" 
                  render-as="svg"
                  foreground="#0f172a" 
                  background="#f8fafc"
                />
              </div>
              <div class="space-y-1 w-full text-slate-900">
                <h4 class="font-black text-sm truncate" :title="asset.asset_name">{{ asset.asset_name }}</h4>
                <p class="text-[11px] font-bold text-indigo-600 uppercase font-mono">{{ asset.item_code }}</p>
                <div class="text-[9px] text-slate-400 font-bold mt-1">
                  위치: {{ asset.location || '보관소' }} | 부서: {{ asset.dept_name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Detail View Modal -->
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
          <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto" v-if="selectedDetailAsset">
            
            <!-- Tab 1: Basic Info -->
            <div v-if="detailTab === 'basic'" class="space-y-4">
              <div class="flex gap-4 p-4 bg-slate-50/60 rounded-xl border border-slate-200">
                <div class="w-16 h-16 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  <img v-if="selectedDetailAsset.image_url" :src="selectedDetailAsset.image_url" class="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity" @click.stop="openImageZoom(selectedDetailAsset.image_url)" title="크게 보기" />
                  <component v-else :is="getCategoryIcon(selectedDetailAsset.category_name)" class="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{{ selectedDetailAsset.category_name }}</div>
                  <h4 class="font-bold text-sm text-slate-800 mt-0.5">{{ selectedDetailAsset.asset_name }}</h4>
                  <span :class="getStatusBadgeClass(selectedDetailAsset.status)" class="inline-block px-2 py-0.5 rounded border text-[9px] font-black uppercase mt-1.5">{{ getStatusLabel(selectedDetailAsset.status) }}</span>
                </div>
              </div>

              <!-- Specs Grid -->
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">물품 고유 코드</span>
                  <p class="font-bold text-slate-800">{{ selectedDetailAsset.item_code }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">시리얼 번호</span>
                  <p class="font-mono font-bold text-slate-800">{{ selectedDetailAsset.serial_number || '없음' }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">보관 및 배치 위치</span>
                  <p class="font-bold text-slate-800">{{ selectedDetailAsset.location || '보관함' }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">관리 및 소유 부서</span>
                  <p class="font-bold text-slate-800">{{ selectedDetailAsset.dept_name }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1 col-span-2">
                  <span class="text-[10px] text-slate-400 font-bold">카테고리</span>
                  <p class="font-bold text-slate-800">{{ selectedDetailAsset.category_name || '미지정' }}</p>
                </div>
              </div>

              <div class="space-y-1 text-xs">
                <span class="text-[10px] text-slate-400 font-bold">담당자 정보</span>
                <p class="font-bold text-slate-250">{{ selectedDetailAsset.manager_name }} (연락처: {{ selectedDetailAsset.manager_contact }})</p>
              </div>

              <div class="space-y-1 text-xs pt-1 border-t border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold">자산 설명</span>
                <p class="text-slate-350 leading-relaxed font-medium whitespace-pre-wrap">{{ selectedDetailAsset.description || '상세 메모가 작성되지 않았습니다.' }}</p>
              </div>
            </div>

            <!-- Tab 2: Purchase & useful life -->
            <div v-if="detailTab === 'purchase'" class="space-y-4">
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">구입 일자</span>
                  <p class="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-indigo-600" />
                    {{ selectedDetailAsset.purchase_date ? selectedDetailAsset.purchase_date.split('T')[0] : '기록 없음' }}
                  </p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">구입 가격</span>
                  <p class="font-bold text-slate-800">{{ formatPrice(selectedDetailAsset.purchase_price) }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">구입처</span>
                  <p class="font-bold text-slate-800">{{ selectedDetailAsset.purchase_source || '기록 없음' }}</p>
                </div>
                <div class="p-3 bg-slate-50/30 border border-slate-200/80 rounded-xl space-y-1">
                  <span class="text-[10px] text-slate-400 font-bold">내용연수 (Useful Life)</span>
                  <p class="font-bold text-slate-800">{{ selectedDetailAsset.useful_life_years }}년</p>
                </div>
              </div>

              <!-- Useful Life status bar -->
              <div class="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs space-y-2">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-indigo-600" />
                  내용연수 및 기한 정보
                </div>
                <p class="font-bold text-slate-800">{{ getUsefulLifeInfo(selectedDetailAsset) }}</p>
              </div>

              <!-- Receipt Image -->
              <div class="space-y-1.5 text-xs">
                <span class="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Receipt class="w-3.5 h-3.5 text-slate-600" />
                  구입 영수증 사진
                </span>
                <div class="aspect-[4/3] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                  <img v-if="selectedDetailAsset.receipt_image_url" :src="selectedDetailAsset.receipt_image_url" class="w-full h-full object-contain" />
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
                  누적 A/S 비용: <span class="text-indigo-600 font-black">{{ formatPrice(detailMaintenanceHistory.reduce((sum, item) => sum + parseFloat(item.cost), 0)) }}</span>
                </span>
              </div>

              <div v-if="isDetailHistoryLoading" class="flex justify-center py-10">
                <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div v-else-if="detailMaintenanceHistory.length > 0" class="space-y-3">
                <div v-for="item in detailMaintenanceHistory" :key="item.id" class="p-3 bg-slate-50/60 rounded-xl border border-slate-200 flex justify-between gap-4 text-xs">
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

    <!-- Image Zoom Modal -->
    <Teleport to="body">
      <div v-if="showImageZoomModal" class="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" @click="showImageZoomModal = false">
        <button @click="showImageZoomModal = false" class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
          <X class="w-6 h-6" />
        </button>
        <img :src="zoomedImageUrl" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" @click.stop />
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
</style>

<style>
/* Global print styles to override framework layouts */
@media print {
  /* Hide the web application view completely */
  #app {
    display: none !important;
  }
  
  /* Hide any other modals or teleported elements under body */
  body > div:not(.print-only-area) {
    display: none !important;
  }

  /* Show only the printed area container */
  .print-only-area {
    display: block !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  @page {
    margin: 0;
    size: portrait;
  }
  
  /* Layout for single QR print */
  .print-page {
    page-break-after: always;
    break-after: page;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 100vh !important;
    width: 100vw !important;
  }

  /* Grid layout for bulk QR print */
  .print-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 20px !important;
    padding: 30px !important;
    background: transparent !important;
  }

  .print-item {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 10px !important;
  }
  
  /* Style individual label for clean high contrast printing */
  .print-page > div, .print-item > div {
    background: white !important;
    color: #0f172a !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: none !important;
  }
}

@media screen {
  .print-only-area {
    display: none !important;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}
</style>
