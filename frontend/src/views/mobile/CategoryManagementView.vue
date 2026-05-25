<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useModalStore } from '@/store/useModalStore'
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  RotateCcw,
  Search
} from 'lucide-vue-next'

const modal = useModalStore()

const categories = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showModal = ref(false)
const editingCategory = ref(null)

const form = ref({
  category_name: '',
  description: ''
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/categories')
    categories.value = res.data
  } catch (error) {
    console.error('Fetch categories failed:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (category = null) => {
  if (category) {
    editingCategory.value = category
    form.value = { 
      category_name: category.category_name,
      description: category.description || '' 
    }
  } else {
    editingCategory.value = null
    form.value = { category_name: '', description: '' }
  }
  showModal.value = true
}

const saveCategory = async () => {
  if (!form.value.category_name) return modal.showAlert('카테고리 이름을 입력하세요.')
  
  try {
    if (editingCategory.value) {
      await axios.put(`/api/categories/${editingCategory.value.id}`, form.value)
      modal.showAlert('카테고리 수정 완료. 매핑된 자산의 분류명도 업데이트됩니다.')
    } else {
      await axios.post('/api/categories', form.value)
      modal.showAlert('카테고리가 생성되었습니다.')
    }
    showModal.value = false
    fetchCategories()
  } catch (error) {
    modal.showAlert(error.response?.data?.message || '저장 중 오류 발생')
  }
}

const deleteCategory = async (id) => {
  if (!await modal.showConfirm('카테고리를 삭제하시겠습니까? 관련 자산 분류 매핑이 해제됩니다.')) return
  try {
    await axios.delete(`/api/categories/${id}`)
    modal.showAlert('삭제 완료')
    fetchCategories()
  } catch (error) {
    modal.showAlert('삭제 중 오류 발생')
  }
}

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(c => 
    c.category_name.toLowerCase().includes(query) ||
    (c.description && c.description.toLowerCase().includes(query))
  )
})



onMounted(fetchCategories)
</script>

<template>
  <div class="space-y-6 pb-10 text-slate-800">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex-1">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">카테고리 분류 관리</h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">교회 자산을 체계적으로 나누는 방송 장비, 악기, 차량, 서적 등 그룹 정보를 관리합니다.</p>
      </div>
      
      <!-- Actions -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative max-w-xs">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input v-model="searchQuery" type="text" placeholder="분류명 검색..." 
            class="input-field pl-9 py-2 text-xs w-60" />
        </div>

        <button @click="fetchCategories" class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all">
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        
        <button @click="openModal()" class="btn-primary flex items-center gap-1 text-xs py-2.5">
          <Plus class="w-4 h-4" />
          카테고리 추가
        </button>
      </div>
    </div>

    <!-- Category list -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="cat in filteredCategories" 
        :key="cat.id"
        class="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">{{ cat.category_name }}</h3>
              <p class="text-[9px] text-slate-400 mt-0.5">CAT-#{{ cat.id }}</p>
            </div>
          </div>

          <p class="text-xs text-slate-400 min-h-8 leading-relaxed font-semibold">
            {{ cat.description || '카테고리 설명 없음' }}
          </p>
        </div>

        <div class="flex gap-2 pt-4 border-t border-slate-200 mt-4 justify-end text-xs">
          <button @click="openModal(cat)" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold flex items-center gap-1">
            <Edit class="w-3.5 h-3.5" />
            수정
          </button>
          <button @click="deleteCategory(cat.id)" class="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-400 border border-slate-200 hover:border-rose-500/25 rounded-lg font-bold flex items-center gap-1">
            <Trash2 class="w-3.5 h-3.5" />
            삭제
          </button>
        </div>
      </div>

      <div v-if="filteredCategories.length === 0" class="text-center py-20 bg-white border border-slate-200 rounded-2xl col-span-full">
        <Layers class="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p class="text-xs text-slate-400 font-semibold">등록된 카테고리가 존재하지 않습니다.</p>
      </div>
    </div>

    <!-- Modal Dialog -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-slide-up">
          <div class="flex justify-between items-center p-5 border-b border-slate-200">
            <h2 class="text-base font-bold text-slate-900">{{ editingCategory ? '카테고리 수정' : '신규 카테고리 추가' }}</h2>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X class="w-5 h-5" /></button>
          </div>

          <div class="p-6 space-y-4 text-xs">
            <div class="space-y-1.5">
              <label class="block font-bold text-slate-400">카테고리 이름 <span class="text-rose-500">*</span></label>
              <input v-model="form.category_name" type="text" placeholder="예: 방송 장비, 가구 등" class="input-field text-xs py-2.5" />
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-slate-400">카테고리 설명</label>
              <textarea v-model="form.description" placeholder="이 범주에 속할 자산들의 개략적인 정보 작성" rows="3" class="input-field text-xs resize-none"></textarea>
            </div>

            <div class="flex gap-3 pt-4 border-t border-slate-200">
              <button @click="showModal = false" class="btn-secondary flex-1 py-3">취소</button>
              <button @click="saveCategory" class="btn-primary flex-1 py-3">{{ editingCategory ? '수정 완료' : '추가하기' }}</button>
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
