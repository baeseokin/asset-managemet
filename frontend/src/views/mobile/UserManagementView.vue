<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useModalStore } from '@/store/useModalStore'
import { 
  Search, 
  RotateCcw, 
  User, 
  Building2, 
  Phone, 
  Edit, 
  Key, 
  Trash2, 
  UserCheck, 
  X, 
  Shield, 
  ChevronDown,
  Briefcase
} from 'lucide-vue-next'

const modal = useModalStore()
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showEditModal = ref(false)
const selectedUser = ref(null)
const departments = ref([])

const form = ref({
  user_name: '',
  email: '',
  phone: '',
  dept_name: '',
  roleIds: []
})

const formatPhone = (val) => {
  if (!val) return ''
  const num = val.replace(/[^0-9]/g, '')
  if (num.length <= 3) return num
  if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`
  return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`
}

watch(() => form.value.phone, (newVal) => {
  if (newVal) {
    const formatted = formatPhone(newVal)
    if (newVal !== formatted) {
      form.value.phone = formatted
    }
  }
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/users')
    users.value = res.data
  } catch (error) {
    console.error('Fetch users error:', error)
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await axios.get('/api/departments')
    departments.value = res.data
  } catch (error) {
    console.error('Fetch departments error:', error)
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    u.user_name.toLowerCase().includes(query) || 
    u.user_id.toLowerCase().includes(query) ||
    (u.dept_name && u.dept_name.toLowerCase().includes(query))
  )
})

const openEdit = (user) => {
  selectedUser.value = user
  let rIds = [2]
  if (user.roles) {
    if (user.roles.includes('관리자')) rIds = [1, 2]
    else if (user.roles.includes('자산담당')) rIds = [3, 2]
  }
  form.value = {
    user_name: user.user_name,
    email: user.email || '',
    phone: user.phone || '',
    dept_name: user.dept_name || '',
    roleIds: rIds
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  try {
    await axios.put(`/api/users/${selectedUser.value.id}`, form.value)
    modal.showAlert('사용자 정보가 성공적으로 수정되었습니다.')
    showEditModal.value = false
    fetchUsers()
  } catch (error) {
    modal.showAlert('수정 중 오류가 발생했습니다.')
  }
}

const approveUser = async (user) => {
  const confirm = await modal.showConfirm(`'${user.user_name}'님의 가입 승인을 처리하시겠습니까?`)
  if (!confirm) return
  try {
    await axios.patch(`/api/users/${user.id}/approve`, { roleNames: ['사용자'] })
    modal.showAlert('가입 승인이 완료되었습니다. 사용자가 로그인할 수 있습니다.')
    fetchUsers()
  } catch (err) {
    modal.showAlert('가입 승인 중 오류가 발생했습니다.')
  }
}

const resetPassword = async (user) => {
  if (!await modal.showConfirm(`'${user.user_name}'님의 비밀번호를 'asset00!'로 초기화하시겠습니까?`)) return
  try {
    const res = await axios.post(`/api/users/${user.id}/reset-password`)
    modal.showAlert(res.data.message)
  } catch (error) {
    modal.showAlert('비밀번호 초기화 실패')
  }
}

const deleteUser = async (user) => {
  if (!await modal.showConfirm(`'${user.user_name}'님을 강제 탈퇴시키겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
  try {
    await axios.delete(`/api/users/${user.id}`)
    modal.showAlert('탈퇴 처리가 완료되었습니다.')
    fetchUsers()
  } catch (error) {
    modal.showAlert(error.response?.data?.message || '삭제 실패')
  }
}

const selectRole = (roleId) => {
  if (roleId === 1) {
    if (form.value.dept_name !== '재정부') {
      modal.showAlert('최고 관리자 권한은 재정부 소속 사용자에게만 설정할 수 있습니다.')
      return
    }
    form.value.roleIds = [1, 2]
  } else if (roleId === 3) {
    if (form.value.dept_name !== '관리부') {
      modal.showAlert('자산담당 권한은 관리부 소속 사용자에게만 설정할 수 있습니다.')
      return
    }
    form.value.roleIds = [3, 2]
  } else {
    form.value.roleIds = [2]
  }
}

onMounted(() => {
  fetchUsers()
  fetchDepartments()
})
</script>

<template>
  <div class="space-y-6 pb-10 text-slate-800">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">사용자 권한 관리</h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">시스템 사용 회원의 신규 가입 신청 승인, 정보 수정, 권한 할당 및 비밀번호 초기화를 관리합니다.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative max-w-xs">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input v-model="searchQuery" type="text" placeholder="이름, ID, 부서 검색..."
            class="input-field pl-10 py-2.5 text-xs w-60" />
        </div>
        <button @click="fetchUsers" class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-md">
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- User List Table -->
    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="text-center py-20">
        <User class="w-12 h-12 text-slate-700 mx-auto mb-3" />
        <h3 class="text-sm font-bold text-slate-400">가입된 사용자가 없습니다</h3>
      </div>

      <!-- Mobile User List Cards -->
      <div v-else class="space-y-4 px-1">
        <div v-for="user in filteredUsers" :key="user.id" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3 relative active:border-indigo-200 transition-colors">
          <!-- Top Row: Name + Roles -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-black shrink-0 border border-slate-200">
                {{ user.user_name.charAt(0) }}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm">{{ user.user_name }}</div>
                <div class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ user.user_id }}</div>
              </div>
            </div>
            
            <div class="flex gap-1">
              <span v-for="role in (user.roles || '').split(',').filter(r => r)" :key="role"
                :class="role === '관리자' ? 'bg-rose-50 text-rose-550 border-rose-200' : 'bg-indigo-500/10 text-indigo-650 border-indigo-200'"
                class="px-2 py-0.5 rounded border text-[9px] font-bold">
                {{ role }}
              </span>
            </div>
          </div>

          <!-- Phone & Dept & Approval Status -->
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
            <div>
              <span class="text-[10px] text-slate-500 block font-semibold">소속 부서</span>
              <span class="text-slate-700 flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5 text-slate-400" />
                {{ user.dept_name || '부서 미지정' }}
              </span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block font-semibold">연락처</span>
              <span class="text-slate-700 flex items-center gap-1 font-mono">
                <Phone class="w-3.5 h-3.5 text-slate-455" />
                {{ user.phone || '연락처 없음' }}
              </span>
            </div>
            <div class="col-span-2 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-500 block font-semibold">가입 상태</span>
                <span 
                  :class="user.is_approved ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'"
                  class="text-[11px]"
                >
                  {{ user.is_approved ? '승인완료' : '가입 대기중' }}
                </span>
              </div>

              <!-- Actions inside card -->
              <div class="flex justify-end gap-1.5">
                <template v-if="!user.is_approved">
                  <button @click="approveUser(user)" title="가입 승인"
                    class="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold flex items-center gap-1 text-[10px] transition-all"
                  >
                    <UserCheck class="w-3.5 h-3.5" />
                    승인
                  </button>
                </template>
                <template v-else>
                  <button @click="openEdit(user)" title="정보 및 권한 수정"
                    class="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 active:bg-slate-100"
                  >
                    <Edit class="w-3.5 h-3.5" />
                  </button>
                  <button @click="resetPassword(user)" title="비밀번호 초기화"
                    class="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 active:bg-amber-100"
                  >
                    <Key class="w-3.5 h-3.5" />
                  </button>
                </template>
                <button @click="deleteUser(user)" title="사용자 삭제"
                  class="p-2 bg-rose-50 text-rose-550 border border-rose-200 rounded-lg active:bg-rose-100"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-end justify-center z-50" @click.self="showEditModal = false">
        <div class="relative w-full max-w-md bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-slide-up">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-5 border-b border-slate-200">
            <div>
              <h2 class="text-base font-bold text-slate-900">사용자 권한 및 정보 수정</h2>
            </div>
            <button @click="showEditModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-350 transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form Area -->
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-400">이름</label>
                <input v-model="form.user_name" type="text" class="input-field" />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-400">연락처</label>
                <input v-model="form.phone" type="text" class="input-field" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400">소속 부서</label>
              <div class="relative">
                <select v-model="form.dept_name" class="input-field appearance-none cursor-pointer">
                  <option value="">부서 미지정</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.dept_name">{{ dept.dept_name }}</option>
                </select>
                <ChevronDown class="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <!-- Role Cards -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-455">시스템 권한 설정</label>
              <div class="grid grid-cols-3 gap-2.5">
                <button @click="selectRole(2)" 
                  :class="[form.roleIds.includes(2) && !form.roleIds.includes(1) && !form.roleIds.includes(3) ? 'ring-1 ring-indigo-500 bg-indigo-600/10 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-300 text-slate-400']"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-98">
                  <User class="w-4 h-4" />
                  <span class="text-[10px] font-bold">일반사용자</span>
                </button>
                <button @click="selectRole(3)" 
                  :class="[form.roleIds.includes(3) ? 'ring-1 ring-emerald-500 bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-50 border-slate-300 text-slate-400']"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-98">
                  <Briefcase class="w-4 h-4" />
                  <span class="text-[10px] font-bold">자산담당자</span>
                </button>
                <button @click="selectRole(1)" 
                  :class="[form.roleIds.includes(1) ? 'ring-1 ring-rose-500 bg-rose-50 border-rose-500/20 text-rose-400' : 'bg-slate-50 border-slate-300 text-slate-400']"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-98">
                  <Shield class="w-4 h-4" />
                  <span class="text-[10px] font-bold">최고관리자</span>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-4 border-t border-slate-200">
              <button @click="showEditModal = false" class="btn-secondary flex-1 py-3 text-xs">
                취소
              </button>
              <button @click="handleUpdate" class="btn-primary flex-1 py-3 text-xs">
                정보 저장
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
