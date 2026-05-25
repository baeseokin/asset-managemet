<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modal.isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" @click="handleCancel"></div>
        
        <!-- Modal Content -->
        <Transition name="pop">
          <div v-if="modal.isOpen" 
            class="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div class="h-1.5 bg-indigo-600 w-full"></div>
            <div class="p-6">
              <!-- Icon Container -->
              <div class="flex items-center justify-center mb-5">
                <div :class="[
                  modal.type === 'confirm' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                  modal.type === 'prompt' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                ]" 
                  class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner">
                  <component :is="
                    modal.type === 'confirm' ? HelpCircle : 
                    modal.type === 'prompt' ? FileText :
                    Info" 
                    class="w-7 h-7" 
                  />
                </div>
              </div>

              <!-- Text Content -->
              <div class="text-center space-y-2 mb-6">
                <h3 class="text-lg font-bold text-slate-100 tracking-tight">{{ modal.title }}</h3>
                <p class="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{{ modal.message }}</p>
              </div>

              <!-- Prompt Input -->
              <div v-if="modal.type === 'prompt'" class="mb-6">
                <input 
                  v-model="modal.promptValue" 
                  type="text" 
                  :placeholder="modal.promptPlaceholder"
                  class="input-field"
                  @keyup.enter="modal.close(true)"
                  ref="promptInput"
                />
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button v-if="modal.type === 'confirm' || modal.type === 'prompt'" 
                  @click="modal.close(false)"
                  class="btn-secondary flex-1 py-3 text-sm">
                  취소
                </button>
                <button @click="modal.close(true)"
                  class="btn-primary flex-1 py-3 text-sm">
                  확인
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useModalStore } from '@/store/useModalStore'
import { Info, HelpCircle, FileText } from 'lucide-vue-next'

const modal = useModalStore()
const promptInput = ref(null)

// Auto focus on prompt input when it opens
watch(() => modal.isOpen, async (newVal) => {
  if (newVal && modal.type === 'prompt') {
    await nextTick()
    promptInput.value?.focus()
  }
})

const handleCancel = () => {
  if (modal.type === 'confirm') {
    modal.close(false)
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.pop-enter-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15);
}
.pop-leave-active {
  transition: all 0.15s ease-in;
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
.pop-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
