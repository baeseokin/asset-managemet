<script setup>
import { ref } from 'vue'
import { 
  Building2, 
  Edit, 
  Trash2, 
  Plus, 
  ChevronRight 
} from 'lucide-vue-next'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['edit', 'delete', 'add-child'])

const isExpanded = ref(true)
</script>

<template>
  <div class="space-y-1">
    <div :style="{ paddingLeft: (depth * 1.5) + 'rem' }" 
         class="group flex items-center gap-4 p-3 hover:bg-slate-850/60 rounded-xl transition-all relative">
      
      <!-- Toggle Button (Indented based on depth) -->
      <div class="flex items-center justify-center w-6 shrink-0">
        <button v-if="node.children && node.children.length > 0" 
                @click="isExpanded = !isExpanded"
                class="p-1 text-slate-500 hover:text-slate-200 transition-transform duration-200"
                :class="{ 'rotate-90': isExpanded }">
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Node Icon -->
      <div :class="[depth === 0 ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-600/10' : 'bg-slate-800 border border-slate-700 text-slate-450']"
           class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
        <Building2 class="w-4 h-4" />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-200" :class="depth === 0 ? 'text-sm md:text-base' : 'text-xs md:text-sm'">{{ node.dept_name }}</span>
          <span v-if="node.children && node.children.length > 0" class="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded">
            {{ node.children.length }}
          </span>
        </div>
        <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">ID: #{{ node.id }}</div>
      </div>

      <!-- Actions -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <button @click="emit('add-child', node.id)" class="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all" title="하위 부서 추가">
          <Plus class="w-3.5 h-3.5" />
        </button>
        <button @click="emit('edit', node)" class="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all border border-transparent" title="수정">
          <Edit class="w-3.5 h-3.5" />
        </button>
        <button @click="emit('delete', node.id)" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="삭제">
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Recursive Children -->
    <div v-if="isExpanded && node.children && node.children.length > 0" class="relative">
      <!-- Vertical Line for Hierarchy -->
      <div class="absolute left-[1.25rem] top-0 bottom-4 w-px bg-slate-800" 
           :style="{ left: (depth * 1.5 + 0.75) + 'rem' }"></div>
      
      <div v-for="child in node.children" :key="child.id">
        <DeptTreeNode :node="child" :depth="depth + 1" 
          @edit="(n) => emit('edit', n)" 
          @delete="(id) => emit('delete', id)"
          @add-child="(id) => emit('add-child', id)" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeptTreeNode'
}
</script>
