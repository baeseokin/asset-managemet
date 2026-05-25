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
    <div :style="{ paddingLeft: (depth * 0.75) + 'rem' }" 
         class="group flex items-center justify-between gap-2 p-2 hover:bg-slate-50 rounded-xl transition-all relative">
      
      <div class="flex items-center gap-2 min-w-0">
        <!-- Toggle Button (Indented based on depth) -->
        <div class="flex items-center justify-center w-5 shrink-0">
          <button v-if="node.children && node.children.length > 0" 
                  @click="isExpanded = !isExpanded"
                  class="p-1 text-slate-400 active:text-slate-800 transition-transform duration-200"
                  :class="{ 'rotate-90': isExpanded }">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Node Icon -->
        <div :class="[depth === 0 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 border border-slate-200 text-slate-600']"
             class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
          <Building2 class="w-3.5 h-3.5" />
        </div>

        <!-- Info -->
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-800 truncate" :class="depth === 0 ? 'text-xs' : 'text-[11px]'">{{ node.dept_name }}</span>
            <span v-if="node.children && node.children.length > 0" class="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1 py-0.25 rounded shrink-0">
              {{ node.children.length }}
            </span>
          </div>
          <div class="text-[8px] text-slate-400 font-bold uppercase tracking-wider">ID: #{{ node.id }}</div>
        </div>
      </div>

      <!-- Actions (Always visible on mobile touch screen) -->
      <div class="flex gap-0.5 shrink-0">
        <button @click="emit('add-child', node.id)" class="p-1.5 text-indigo-650 hover:bg-indigo-50 rounded-lg" title="하위 부서 추가">
          <Plus class="w-4 h-4" />
        </button>
        <button @click="emit('edit', node)" class="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" title="수정">
          <Edit class="w-4 h-4" />
        </button>
        <button @click="emit('delete', node.id)" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="삭제">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Recursive Children -->
    <div v-if="isExpanded && node.children && node.children.length > 0" class="relative">
      <!-- Vertical Line for Hierarchy -->
      <div class="absolute left-[0.85rem] top-0 bottom-3 w-px bg-slate-200" 
           :style="{ left: (depth * 0.75 + 0.6) + 'rem' }"></div>
      
      <div v-for="child in node.children" :key="child.id">
        <MobileDeptTreeNode :node="child" :depth="depth + 1" 
          @edit="(n) => emit('edit', n)" 
          @delete="(id) => emit('delete', id)"
          @add-child="(id) => emit('add-child', id)" />
      </div>
    </div>
  </div>
</template>

<script>
import MobileDeptTreeNode from './MobileDeptTreeNode.vue'
export default {
  name: 'MobileDeptTreeNode',
  components: {
    MobileDeptTreeNode
  }
}
</script>
