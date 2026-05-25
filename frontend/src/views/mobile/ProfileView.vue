<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../store/auth'
import { 
  User, 
  Mail, 
  Phone, 
  Building,
  Check,
  Loader2,
  ChevronDown
} from 'lucide-vue-next'
import { useModalStore } from '@/store/useModalStore'

const modal = useModalStore()
const auth = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const departments = ref([])
const profile = ref({
  user_name: '',
  email: '',
  phone: '',
  user_id: '',
  dept_name: ''
})

const formatPhone = (val) => {
  if (!val) return ''
  const num = val.replace(/[^0-9]/g, '')
  if (num.length <= 3) return num
  if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`
  return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`
}

watch(() => profile.value.phone, (newVal) => {
  if (newVal) {
    const formatted = formatPhone(newVal)
    if (newVal !== formatted) {
      profile.value.phone = formatted
    }
  }
})

const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/users/me')
    profile.value = res.data
  } catch (err) {
    console.error('Failed to fetch profile:', err)
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await axios.get('/api/departments')
    departments.value = res.data
  } catch (err) {
    console.error('Fetch departments error:', err)
  }
}

const updateProfile = async () => {
  saving.value = true
  try {
    await axios.put('/api/users/me', {
      user_name: profile.value.user_name,
      email: profile.value.email,
      phone: profile.value.phone,
      dept_name: profile.value.dept_name
    })
    
    // Sync with auth store
    await auth.checkSession()
    
    modal.showAlert('프로필이 성공적으로 업데이트되었습니다.')
    fetchProfile()
  } catch (err) {
    modal.showAlert('업데이트 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchDepartments()
})
</script>

<template>
  <div class="py-6 max-w-4xl mx-auto space-y-8 min-h-screen text-slate-800">
    <!-- Profile Header -->
    <div class="flex flex-col md:flex-row items-center gap-6 bg-white border border-slate-200 p-8 rounded-2xl relative overflow-hidden group">
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl transition-colors duration-1005"></div>
      
      <div class="relative z-10 w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
        {{ profile.user_name?.charAt(0) }}
      </div>
      
      <div class="relative z-10 text-center md:text-left space-y-2">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">내 프로필 설정</h1>
        <p class="text-slate-400 font-semibold text-xs uppercase tracking-wider">개인 정보 및 소속 설정</p>
        <div class="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
          <span class="px-2.5 py-0.5 bg-indigo-600/20 text-indigo-600 border border-indigo-200 rounded-full text-xs font-bold">{{ profile.dept_name || '부서 미지정' }}</span>
          <span class="px-2.5 py-0.5 bg-slate-100 text-slate-400 border border-slate-300 rounded-full text-xs font-bold">{{ profile.user_id }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid md:grid-cols-3 gap-6">
      <!-- Sidebar Info -->
      <div class="space-y-6">
        <div class="bg-white border border-slate-200 text-white p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-2">
            <User class="w-5 h-5 text-indigo-600" />
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">계정 정보</span>
          </div>
          <div>
            <div class="text-xs text-slate-400 font-medium">아이디</div>
            <p class="text-lg font-bold text-slate-800 mt-0.5">{{ profile.user_id }}</p>
          </div>
          <div class="pt-4 border-t border-slate-200">
             <p class="text-xs text-slate-400 leading-relaxed">계정 아이디는 고유 식별값으로 변경할 수 없습니다. 아이디 변경이 필요하신 경우 최고 관리자에게 문의해 주세요.</p>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="md:col-span-2 space-y-6">
        <div class="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl space-y-6">
          <div class="space-y-5">
            <!-- Name -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">이름</label>
              <div class="relative flex items-center">
                <User class="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input type="text" v-model="profile.user_name" class="input-field pl-11" placeholder="성함을 입력하세요" />
              </div>
            </div>

            <!-- Department Selector -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">소속 부서</label>
              <div class="relative flex items-center">
                <Building class="w-5 h-5 text-slate-400 absolute left-3.5" />
                <select v-model="profile.dept_name" class="input-field pl-11 appearance-none cursor-pointer">
                  <option value="">부서 미지정</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.dept_name" class="bg-white text-slate-250">{{ dept.dept_name }}</option>
                </select>
                <ChevronDown class="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">이메일 주소</label>
              <div class="relative flex items-center">
                <Mail class="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input type="email" v-model="profile.email" class="input-field pl-11" placeholder="example@email.com" />
              </div>
            </div>

            <!-- Phone -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">연락처</label>
              <div class="relative flex items-center">
                <Phone class="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input type="text" v-model="profile.phone" class="input-field pl-11" placeholder="010-0000-0000" />
              </div>
              <p class="text-[10px] text-indigo-500 font-bold ml-1 mt-1 leading-normal">
                ※ 대여/반납 승인 처리 시 입력하신 번호로 SMS/알림 전송용 데이터로 사용됩니다.
              </p>
            </div>
          </div>

          <button 
            @click="updateProfile"
            :disabled="saving"
            class="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider flex items-center justify-center gap-2"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Check v-else class="w-4 h-4" />
            {{ saving ? '저장 중...' : '프로필 저장' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
