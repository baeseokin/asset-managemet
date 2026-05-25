<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useModalStore } from '@/store/useModalStore'
import { UserPlus, ChevronLeft, ChevronDown } from 'lucide-vue-next'

const router = useRouter()
const modal = useModalStore()
const isLoading = ref(false)

const form = ref({
  userId: '',
  password: '',
  passwordConfirm: '',
  userName: '',
  phone: '',
  email: '',
  deptName: ''
})

const idChecked = ref(false)
const idAvailable = ref(false)
const departments = ref([])

const fetchDepartments = async () => {
  try {
    const res = await axios.get('/api/departments')
    departments.value = res.data
  } catch (err) {
    console.error('Fetch departments error:', err)
  }
}

onMounted(fetchDepartments)

const checkId = async () => {
  if (!form.value.userId) {
    modal.showAlert('아이디를 입력해 주세요.')
    return
  }
  
  try {
    const res = await axios.get('/api/auth/check-id', { params: { userId: form.value.userId } })
    if (res.data.success) {
      idAvailable.value = res.data.available
      idChecked.value = true
      if (!idAvailable.value) {
        modal.showAlert('이미 사용 중인 아이디입니다.')
      }
    }
  } catch (error) {
    modal.showAlert('중복 체크 중 오류가 발생했습니다.')
  }
}

watch(() => form.value.userId, () => {
  idChecked.value = false
  idAvailable.value = false
})

// Phone formatting
watch(() => form.value.phone, (newVal) => {
  if (!newVal) return
  const digits = newVal.replace(/\D/g, '')
  let formatted = ''
  if (digits.length <= 3) {
    formatted = digits
  } else if (digits.length <= 7) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
  } else {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
  }
  if (formatted !== newVal) {
    form.value.phone = formatted
  }
})

const handleRegister = async () => {
  if (!form.value.userId || !form.value.password || !form.value.passwordConfirm || !form.value.userName || !form.value.phone || !form.value.deptName) {
    modal.showAlert('아이디, 비밀번호, 성함, 연락처, 담당부서는 필수 입력 항목입니다.')
    return
  }

  if (form.value.password !== form.value.passwordConfirm) {
    modal.showAlert('비밀번호가 일치하지 않습니다.')
    return
  }

  const phoneRegex = /^010-\d{3,4}-\d{4}$/
  if (!phoneRegex.test(form.value.phone)) {
    modal.showAlert('올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)')
    return
  }

  if (!idChecked.value || !idAvailable.value) {
    modal.showAlert('아이디 중복 체크를 완료해 주세요.')
    return
  }

  isLoading.value = true
  
  try {
    const res = await axios.post('/api/auth/register', form.value)
    if (res.data.success) {
      await modal.showAlert(res.data.message, '가입 신청 완료')
      router.push('/')
    }
  } catch (error) {
    modal.showAlert(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
    <div class="max-w-md w-full">
      <router-link to="/" class="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors mb-6 text-sm font-semibold">
        <ChevronLeft class="w-4 h-4" />
        로그인으로 돌아가기
      </router-link>

      <div class="glass-card bg-white/60 border border-slate-200 p-8 md:p-10 shadow-2xl rounded-2xl">
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
            <UserPlus class="w-7 h-7 text-white" />
          </div>
          <h1 class="text-xl font-bold text-slate-900 mb-1 tracking-tight">회원가입 신청</h1>
          <p class="text-slate-400 text-xs font-semibold">자산 관리 시스템</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">아이디 <span class="text-rose-500">*</span></label>
            <div class="flex gap-2">
              <input v-model="form.userId" type="text" placeholder="아이디 입력" required
                     class="input-field" />
              <button type="button" @click="checkId" 
                      class="px-4 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 transition-all whitespace-nowrap">
                중복확인
              </button>
            </div>
            <p v-if="idChecked && idAvailable" class="text-xs text-indigo-600 font-semibold mt-1 ml-1">✓ 사용 가능한 아이디입니다.</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">비밀번호 <span class="text-rose-500">*</span></label>
            <input v-model="form.password" type="password" placeholder="비밀번호 입력" required
                   class="input-field" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">비밀번호 확인 <span class="text-rose-500">*</span></label>
            <input v-model="form.passwordConfirm" type="password" placeholder="비밀번호 재입력" required
                   class="input-field" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">이름 <span class="text-rose-500">*</span></label>
            <input v-model="form.userName" type="text" placeholder="성함 입력" required
                   class="input-field" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">연락처 <span class="text-rose-500">*</span></label>
              <input v-model="form.phone" type="text" placeholder="010-0000-0000" required
                     class="input-field" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">담당부서 <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select v-model="form.deptName" required
                        :class="[!form.deptName ? 'text-slate-400' : 'text-slate-800']"
                        class="input-field appearance-none cursor-pointer">
                  <option value="" disabled selected>부서 선택</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.dept_name" class="bg-white text-slate-800">{{ dept.dept_name }}</option>
                </select>
                <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 ml-1">이메일</label>
            <input v-model="form.email" type="email" placeholder="example@email.com"
                   class="input-field" />
          </div>

          <button type="submit" :disabled="isLoading"
                  class="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider flex items-center justify-center mt-4">
            <span v-if="isLoading">신청 중...</span>
            <span v-else>가입 신청하기</span>
          </button>
        </form>

        <p class="mt-6 text-[10px] text-slate-400 text-center font-semibold leading-relaxed">
          회원가입 신청 후 최고 관리자의 가입 승인이 완료되어야 로그인이 가능합니다.<br/>
          (승인 대기 상태에서는 로그인이 불가합니다.)
        </p>
      </div>
    </div>
  </div>
</template>
