<template>
  <div 
    @click="startEdit" 
    v-if="!isEditing" 
    :class="{'admin-editable': isAdmin}" 
    :title="isAdmin ? '点击编辑' : ''"
    class="editable-cell"
  >
    {{ displayText || placeholder || '&nbsp;' }}
  </div>

  <div v-else class="w-full">
    <input
      v-if="type === 'text'"
      ref="inputRef"
      v-model="currentValue"
      @blur="saveEdit"
      @keydown.enter.prevent="saveEdit"
      @keydown.esc.prevent="cancelEdit"
      class="editable-input"
    />
    
    <select
      v-else-if="type === 'user-select'"
      ref="inputRef"
      v-model="currentValue"
      @blur="saveEdit"
      @change="saveEdit"
      @keydown.esc.prevent="cancelEdit"
      class="editable-input"
    >
      <option :value="null">-- 无 --</option>
      <option v-for="user in options" :key="user.id" :value="user.id">
        {{ user.nickname }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';

const props = withDefaults(
  defineProps<{
    value: string | number | { id?: string; nickname?: string } | null;
    type?: 'text' | 'user-select';
    options?: { id: string; nickname: string }[];
    isAdmin?: boolean;
    placeholder?: string;
  }>(),
  {
    type: 'text',
    options: () => [],
    isAdmin: false,
    placeholder: '-',
  },
);

const emit = defineEmits<{
  (e: 'save', value: string | number | null): void;
}>();

const isEditing = ref(false);
const currentValue = ref<string | number | null>(null);
const inputRef = ref<HTMLInputElement | HTMLSelectElement | null>(null);

// (核心) 根据类型计算显示文本
const displayText = computed(() => {
  if (props.type === 'user-select') {
    const user = props.value as { id?: string; nickname?: string } | null;
    return user?.nickname || '';
  }
  return props.value as string | number | null; // (显示 name 或 notes)
});

// (核心) 当组件加载或 props 变化时，设置内部值
function setInternalValue() {
  if (props.type === 'user-select') {
    const user = props.value as { id?: string } | null;
    currentValue.value = user?.id || null; // (v-model 绑定的是 owner.id)
  } else {
    currentValue.value = (props.value as string | number | null) ?? null;
  }
}

watch(() => props.value, setInternalValue, { immediate: true });

// (启动编辑)
const startEdit = async () => {
  if (!props.isAdmin) return;
  setInternalValue(); // (确保开始编辑时，值是最新的)
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
};

// (保存编辑)
const saveEdit = () => {
  isEditing.value = false;
  
  // (检查值是否真的改变了)
  const originalValue =
    props.type === 'user-select'
      ? ((props.value as { id?: string } | null)?.id || null)
      : (props.value as string | number | null);
  if (currentValue.value === originalValue) {
    return;
  }
  
  // (如果值是空字符串，则发送 null)
  const valueToSend = currentValue.value === '' ? null : currentValue.value;
  emit('save', valueToSend);
};

// (取消编辑)
const cancelEdit = () => {
  isEditing.value = false;
};

</script>

<style scoped>
/* (修复 BUG 1: 确保空单元格也能被点击) */
.editable-cell {
  min-height: 24px; 
  padding: 4px; 
  margin: -4px; 
  border-radius: 4px;
  transition: background-color 0.2s;
  width: 100%;
  display: block;
}

.admin-editable {
  cursor: pointer;
}
.admin-editable:hover {
  background-color: #f3f4f6; 
  outline: 1px dashed #a8a29e; 
}

.editable-input {
  width: 100%;
  padding: 4px;
  margin: -4px; 
  border: 1px solid #4f46e5 !important;
  border-radius: 4px;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
  outline: none;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  font-weight: inherit;
}
</style>
