<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import DeptTreeNode from '../../components/mobile/MobileDeptTreeNode.vue'
import { useModalStore } from '@/store/useModalStore'
import { 
  Building2, 
  Plus, 
  RotateCcw,
  X,
  ChevronDown,
  Search
} from 'lucide-vue-next'

const modal = useModalStore()

const departments = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingDept = ref(null)
const searchQuery = ref('')

const filteredDepartments = computed(() => {
  if (!searchQuery.value.trim()) return departments.value
  
  const query = searchQuery.value.toLowerCase()
  const matchedIds = new Set()
  
  // Find matches and trace ancestors
  departments.value.forEach(dept => {
    if (dept.dept_name.toLowerCase().includes(query)) {
      matchedIds.add(dept.id)
      
      let parentId = dept.parent_dept_id
      while (parentId) {
        if (matchedIds.has(parentId)) break
        const parent = departments.value.find(d => d.id === parentId)
        if (parent) {
          matchedIds.add(parent.id)
          parentId = parent.parent_dept_id
        } else {
          break
        }
      }
    }
  })
  
  return departments.value.filter(d => matchedIds.has(d.id))
})

const treeData = computed(() => {
  const map = {}
  const roots = []
  const data = filteredDepartments.value
  
  data.forEach(dept => {
    map[dept.id] = { ...dept, children: [] }
  })
  
  data.forEach(dept => {
    if (dept.parent_dept_id && map[dept.parent_dept_id]) {
      map[dept.parent_dept_id].children.push(map[dept.id])
    } else {
      roots.push(map[dept.id])
    }
  })
  
  return roots
})

const form = ref({
  dept_name: '',
  parent_dept_id: null
})

const fetchDepartments = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/departments')
    departments.value = res.data
  } catch (error) {
    console.error('Fetch departments failed:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (dept = null, parentId = null) => {
  if (dept) {
    editingDept.value = dept
    form.value = { 
      dept_name: dept.dept_name,
      parent_dept_id: dept.parent_dept_id 
    }
  } else {
    editingDept.value = null
    form.value = { dept_name: '', parent_dept_id: parentId }
  }
  showModal.value = true
}

const saveDepartment = async () => {
  if (!form.value.dept_name) return modal.showAlert('부서명을 입력하세요.')
  
  try {
    if (editingDept.value) {
      await axios.put(`/api/departments/${editingDept.value.id}`, form.value)
    } else {
      await axios.post('/api/departments', form.value)
    }
    showModal.value = false
    fetchDepartments()
  } catch (error) {
    modal.showAlert(error.response?.data?.message || '저장 중 오류가 발생했습니다.')
  }
}

const deleteDepartment = async (id) => {
  const confirm = await modal.showConfirm('이 부서를 삭제하시겠습니까? 하위 소속 부서가 있거나 부서 소속 사용자가 있는 경우 데이터가 유실되거나 차단될 수 있습니다.')
  if (!confirm) return
  
  try {
    await axios.delete(`/api/departments/${id}`)
    fetchDepartments()
  } catch (error) {
    modal.showAlert('삭제 중 오류가 발생했습니다.')
  }
}

onMounted(fetchDepartments)
</script>

<template>
  <div class="space-y-6 pb-10 text-slate-800">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex-1">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">조직 체계 관리</h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">부서 간의 계층 구조를 트리 형태로 설계하고 대여 책임 부서를 관리합니다.</p>
      </div>
      
      <!-- Search and actions -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative max-w-xs">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input v-model="searchQuery" type="text" placeholder="부서 이름으로 검색..." 
            class="input-field pl-10 py-2.5 text-xs w-60" />
        </div>

        <button @click="fetchDepartments" class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-md">
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        
        <button @click="openModal()" class="btn-primary flex items-center gap-1 text-xs py-2.5">
          <Plus class="w-4 h-4" />
          부서 추가
        </button>
      </div>
    </div>

    <!-- Tree Structure Card -->
    <div class="bg-white border border-slate-200 rounded-2xl p-6 min-h-[400px] shadow-lg">
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-3">
        <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-slate-400 text-xs font-semibold">부서 구조 조회 중...</p>
      </div>

      <div v-else-if="treeData.length === 0" class="text-center py-32">
        <Building2 class="w-12 h-12 text-slate-700 mx-auto mb-3" />
        <template v-if="searchQuery">
          <p class="text-slate-400 font-bold text-sm">"{{ searchQuery }}" 검색 결과가 없습니다</p>
          <button @click="searchQuery = ''" class="mt-2 text-indigo-600 font-bold text-xs hover:underline">검색 초기화</button>
        </template>
        <template v-else>
          <p class="text-slate-400 font-bold text-sm">등록된 부서가 없습니다</p>
          <button @click="openModal()" class="mt-2 text-indigo-600 font-bold text-xs hover:underline">첫 부서 등록하기</button>
        </template>
      </div>

      <div v-else class="space-y-2">
        <DeptTreeNode v-for="node in treeData" :key="node.id"
          :node="node" :depth="0" 
          @edit="openModal" @delete="deleteDepartment" @add-child="(id) => openModal(null, id)" />
      </div>
    </div>

    <!-- Modal dialogue -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-slide-up">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-5 border-b border-slate-200">
            <div>
              <h2 class="text-base font-bold text-slate-900">{{ editingDept ? '부서 정보 수정' : '새 부서 등록' }}</h2>
            </div>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-350 transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form Area -->
          <div class="p-6 space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400">부서명 <span class="text-rose-500">*</span></label>
              <input v-model="form.dept_name" type="text" placeholder="예: 개발팀, 재정부 등"
                class="input-field" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400">상위 소속 조직</label>
              <div class="relative">
                <select v-model="form.parent_dept_id" 
                  class="input-field appearance-none cursor-pointer">
                  <option :value="null">최상위 조직 (Root)</option>
                  <option v-for="d in departments.filter(d => d.id !== editingDept?.id)" :key="d.id" :value="d.id">
                    {{ d.dept_name }}
                  </option>
                </select>
                <ChevronDown class="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-4 border-t border-slate-200">
              <button @click="showModal = false" class="btn-secondary flex-1 py-3 text-xs">
                취소
              </button>
              <button @click="saveDepartment" class="btn-primary flex-1 py-3 text-xs">
                {{ editingDept ? '수정 완료' : '부서 생성' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
