<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useModalStore } from '@/store/useModalStore'
import { 
  Check, 
  X, 
  Clock, 
  FolderOpen, 
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  User,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-vue-next'

const modal = useModalStore()

const changeRequests = ref([])
const assets = ref([])
const statusFilter = ref('pending')
const isLoading = ref(false)

const loadData = async () => {
  isLoading.value = true
  try {
    const [reqRes, assetsRes] = await Promise.all([
      axios.get('/api/change-requests', { params: { status: statusFilter.value } }),
      axios.get('/api/assets')
    ])
    changeRequests.value = reqRes.data
    assets.value = assetsRes.data
  } catch (err) {
    console.error('Failed to load approval data:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
watch(statusFilter, loadData)

const getRequestTypeLabel = (type) => {
  if (type === 'register') return '신규 등록'
  if (type === 'modify') return '정보 수정'
  if (type === 'dispose') return '자산 폐기'
  if (type === 'delete') return '자산 삭제'
  return type
}

const getRequestTypeClass = (type) => {
  if (type === 'register') return 'bg-emerald-500/10 text-emerald-650 border border-emerald-500/20'
  if (type === 'modify') return 'bg-indigo-500/10 text-indigo-600 border border-indigo-200'
  if (type === 'dispose') return 'bg-amber-50 text-amber-600 border border-amber-500/20'
  return 'bg-rose-50 text-rose-600 border border-rose-500/20'
}

const getStatusBadgeClass = (status) => {
  if (status === 'pending') return 'bg-amber-50 text-amber-600 border-amber-500/20'
  if (status === 'approved') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  return 'bg-rose-50 text-rose-400 border-rose-500/20'
}

const getStatusLabel = (status) => {
  if (status === 'pending') return '승인 대기'
  if (status === 'approved') return '승인 완료'
  if (status === 'rejected') return '반려됨'
  return status
}

// Side-by-side comparison logic for modifications
const getModificationDiff = (req) => {
  const asset = assets.value.find(a => a.id === req.asset_id)
  if (!asset) return []

  const fields = {
    asset_name: '자산 명칭',
    category_name: '카테고리',
    serial_number: '시리얼 번호',
    item_code: '물품 코드',
    location: '보관 위치',
    dept_name: '담당 부서',
    manager_name: '담당자',
    manager_contact: '연락처',
    purchase_date: '구입 일자',
    purchase_price: '구입 가격',
    useful_life_years: '내용연수(년)',
    description: '상세 설명'
  }

  const diffs = []
  Object.keys(fields).forEach(key => {
    let oldVal = asset[key]
    let newVal = req.requested_data[key]

    // Format dates and prices
    if (key === 'purchase_date' && oldVal) oldVal = oldVal.split('T')[0]
    if (key === 'purchase_price') {
      oldVal = oldVal ? `${new Intl.NumberFormat('ko-KR').format(oldVal)}원` : '(없음)'
      newVal = newVal ? `${new Intl.NumberFormat('ko-KR').format(newVal)}원` : '(없음)'
    }
    if (key === 'is_consumable') {
      oldVal = oldVal ? '예' : '아니오'
      newVal = newVal ? '예' : '아니오'
    }

    if (String(oldVal || '') !== String(newVal || '') && newVal !== undefined) {
      diffs.push({
        label: fields[key],
        old: oldVal === null || oldVal === '' ? '(비어있음)' : oldVal,
        new: newVal === null || newVal === '' ? '(값 비움)' : newVal
      })
    }
  })

  return diffs
}

const approveChange = async (reqId) => {
  if (!await modal.showConfirm('본 자산 승인 결재를 허가하시겠습니까? 데이터베이스에 최종 저장됩니다.')) return
  try {
    const res = await axios.patch(`/api/change-requests/${reqId}/approve`)
    if (res.data.success) {
      modal.showAlert('승인 결재가 정상 처리되었습니다.')
      loadData()
    }
  } catch (err) {
    modal.showAlert('승인 중 오류 발생')
  }
}

const rejectChange = async (reqId) => {
  const reason = await modal.showPrompt('결재 반려 사유를 입력하세요.', '반려 사유')
  if (reason === null) return
  if (!reason.trim()) {
    modal.showAlert('반려 사유는 필수입니다.')
    return
  }

  try {
    const res = await axios.patch(`/api/change-requests/${reqId}/reject`, { reject_reason: reason })
    if (res.data.success) {
      modal.showAlert('반려 처리가 정상 완료되었습니다.')
      loadData()
    }
  } catch (err) {
    modal.showAlert('반려 처리 실패')
  }
}
</script>

<template>
  <div class="space-y-6 pb-10 text-slate-800">

    <!-- Filter tabs -->
    <div class="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 w-fit">
      <button 
        @click="statusFilter = 'pending'"
        :class="[statusFilter === 'pending' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-800']"
        class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
      >
        결재 대기중
      </button>
      <button 
        @click="statusFilter = 'approved'"
        :class="[statusFilter === 'approved' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-800']"
        class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
      >
        승인 완료
      </button>
      <button 
        @click="statusFilter = 'rejected'"
        :class="[statusFilter === 'rejected' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-800']"
        class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
      >
        반려된 목록
      </button>
    </div>

    <!-- Spinner -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Requests list -->
    <div v-else-if="changeRequests.length > 0" class="space-y-6">
      <div 
        v-for="req in changeRequests" 
        :key="req.id" 
        class="bg-white border border-slate-200 rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4"
      >
        <!-- Top row -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div class="flex items-center gap-3">
            <span :class="getRequestTypeClass(req.request_type)" class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase">
              {{ getRequestTypeLabel(req.request_type) }}
            </span>
            <span class="text-xs font-bold text-slate-400">결재요청 #{{ req.id }}</span>
            <span class="text-xs text-slate-400 font-semibold">신청일시: {{ req.created_at.split('T')[0] }}</span>
          </div>

          <div class="flex items-center gap-2">
            <span :class="getStatusBadgeClass(req.status)" class="px-2.5 py-0.5 rounded text-[10px] font-bold">
              {{ getStatusLabel(req.status) }}
            </span>
          </div>
        </div>

        <!-- Requester card -->
        <div class="flex gap-2 items-center text-xs text-slate-400">
          <User class="w-4 h-4 text-slate-400 shrink-0" />
          <span>결재 신청자: <strong class="text-slate-800">{{ req.requester_name }}</strong> (부서: 관리부)</span>
        </div>

        <!-- Request Details / Diffs -->
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          
          <!-- Case A: Register Request -->
          <div v-if="req.request_type === 'register'" class="space-y-3">
            <div class="font-bold text-slate-750 text-xs flex items-center gap-1.5">
              <CheckCircle class="w-4 h-4 text-emerald-650" />
              신규 등록 정보
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
              <div>
                <span class="text-slate-400">자산명</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.asset_name }}</p>
              </div>
              <div>
                <span class="text-slate-400">카테고리</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.category_name }}</p>
              </div>
              <div>
                <span class="text-slate-400">물품 코드</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.item_code }}</p>
              </div>
              <div>
                <span class="text-slate-400">시리얼 번호</span>
                <p class="font-bold text-slate-800 font-mono">{{ req.requested_data.serial_number || '없음' }}</p>
              </div>
              <div>
                <span class="text-slate-400">보관 장소</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.location }}</p>
              </div>
              <div>
                <span class="text-slate-400">소유 부서</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.dept_name }}</p>
              </div>
              <div>
                <span class="text-slate-400">담당자</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.manager_name }}</p>
              </div>
              <div>
                <span class="text-slate-400">구입 가격</span>
                <p class="font-bold text-slate-800">{{ req.requested_data.purchase_price ? `${new Intl.NumberFormat('ko-KR').format(req.requested_data.purchase_price)}원` : '기록없음' }}</p>
              </div>
            </div>
          </div>

          <!-- Case B: Modification Request -->
          <div v-else-if="req.request_type === 'modify'" class="space-y-3">
            <div class="font-bold text-slate-350 text-xs">
              자산 대상: <strong class="text-slate-800">{{ req.original_asset_name }}</strong> (ID: {{ req.asset_id }})
            </div>

            <!-- Diff display -->
            <div v-if="getModificationDiff(req).length > 0" class="space-y-2">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">변경 세부 정보 (Diff)</div>
              
              <div class="space-y-2.5 divide-y divide-slate-100">
                <div v-for="diff in getModificationDiff(req)" :key="diff.label" class="pt-2.5 first:pt-0 text-xs">
                  <div class="font-bold text-slate-700">{{ diff.label }}</div>
                  <div class="flex items-center gap-1.5 mt-1 font-semibold">
                    <span class="text-slate-400 line-through text-[11px]">{{ diff.old }}</span>
                    <ArrowRight class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span class="text-indigo-600 font-bold text-[11px]">{{ diff.new }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400">자산의 실물 사진만 교체되었거나 메타데이터에 유의미한 변화가 없습니다.</div>
          </div>

          <!-- Case C: Disposal Request -->
          <div v-else-if="req.request_type === 'dispose'" class="space-y-1.5 text-xs">
            <div class="font-bold text-amber-600 flex items-center gap-1.5">
              <AlertTriangle class="w-4 h-4" />
              자산 폐기 신청
            </div>
            <p class="font-semibold text-slate-750">
              대상 자산: <strong class="text-slate-900">{{ req.requested_data?.asset_name || req.original_asset_name || '알 수 없는 자산' }}</strong> (ID: {{ req.asset_id }})
            </p>
            <p v-if="req.status === 'pending'" class="text-[11px] text-slate-400">승인 시 해당 기기의 상태는 '폐기됨(disposed)'으로 변경되며 추가 사용이 차단됩니다.</p>
            <p v-else-if="req.status === 'approved'" class="text-[11px] text-emerald-600 font-bold">이 자산은 폐기 처리되었습니다.</p>
          </div>

          <!-- Case D: Deletion Request -->
          <div v-else-if="req.request_type === 'delete'" class="space-y-1.5 text-xs">
            <div class="font-bold text-rose-600 flex items-center gap-1.5">
              <AlertCircle class="w-4 h-4" />
              자산 완전 삭제 신청
            </div>
            <p class="font-semibold text-slate-750">
              대상 자산: <strong class="text-slate-900">{{ req.requested_data?.asset_name || req.original_asset_name || '삭제된 자산' }}</strong> (ID: {{ req.asset_id }})
            </p>
            <p v-if="req.status === 'pending'" class="text-[11px] text-slate-400">승인 시 자산 정보 및 과거 히스토리가 DB에서 완전히 영구 삭제됩니다.</p>
            <p v-else-if="req.status === 'approved'" class="text-[11px] text-rose-500 font-bold">이 자산은 데이터베이스에서 영구 삭제되었습니다.</p>
          </div>

        </div>

        <!-- Pending actions -->
        <div v-if="req.status === 'pending'" class="flex justify-end gap-3 pt-2">
          <button 
            @click="approveChange(req.id)"
            class="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Check class="w-4 h-4" />
            결재 승인
          </button>
          <button 
            @click="rejectChange(req.id)"
            class="bg-slate-100 text-slate-750 hover:bg-rose-50 hover:text-rose-400 border border-slate-300 hover:border-rose-500/25 px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            <X class="w-4 h-4" />
            반려
          </button>
        </div>

        <div v-else-if="req.status === 'rejected' && req.reject_reason" class="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs text-rose-600 font-semibold">
          반려 사유: {{ req.reject_reason }}
        </div>
      </div>
    </div>

    <!-- Empty approval state -->
    <div v-else class="text-center py-20 bg-white border border-slate-200 rounded-2xl">
      <FolderOpen class="w-12 h-12 text-slate-700 mx-auto mb-3" />
      <h3 class="text-sm font-bold text-slate-400">결재 요청 내역이 존재하지 않습니다</h3>
      <p class="text-xs text-slate-500 mt-1">심사할 항목이 없습니다.</p>
    </div>
  </div>
</template>

<style scoped>
.line-through {
  text-decoration: line-through;
}
</style>
