<template>
  <Dialog v-model:visible="isVisible" modal :header="dialogTitle" :style="{ width: '36rem' }" @update:visible="handleDialogClose">
    <div class="flex flex-column gap-4">
      <div class="flex flex-column gap-2">
        <label for="title" class="font-medium text-900">标题 *</label>
        <InputText id="title" v-model="formData.title" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-column gap-2">
          <label for="startAt" class="font-medium text-900">开始时间 *</label>
          <Calendar
            id="startAt"
            v-model="localStart"
            :show-time="!formData.isAllDay"
            :show-icon="true"
            date-format="yy-mm-dd"
          />
        </div>
        <div class="flex flex-column gap-2">
          <label for="endAt" class="font-medium text-900">结束时间 *</label>
          <Calendar
            id="endAt"
            v-model="localEnd"
            :show-time="!formData.isAllDay"
            :show-icon="true"
            date-format="yy-mm-dd"
          />
        </div>
      </div>

      <div class="flex align-items-center gap-2">
        <Checkbox v-model="formData.isAllDay" input-id="isAllDay" :binary="true" />
        <label for="isAllDay" class="text-sm text-900">全天</label>
      </div>

      <div class="flex flex-column gap-2">
        <label for="label" class="font-medium text-900">标签 / 颜色</label>
        <Dropdown v-model="formData.color" :options="labels" option-label="name" option-value="color" />
      </div>

      <div v-if="authStore.role === 'admin'" class="flex flex-column gap-2">
        <label for="userId" class="font-medium text-900">指派成员 *</label>
        <p v-if="isLoadingUsers" class="text-xs text-500">正在加载用户列表...</p>
        <Dropdown v-else v-model="formData.userId" :options="userList" option-label="nickname" option-value="id" />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
    </div>

    <template #footer>
      <div class="flex justify-content-between w-full">
        <Button
          v-if="isEditMode"
          label="删除"
          severity="danger"
          outlined
          :disabled="isDeleteDisabled"
          @click="handleDelete"
        />
        <div class="flex gap-2 ml-auto">
          <Button label="取消" severity="secondary" outlined @click="closeModal" />
          <Button :label="isEditMode ? '保存更改' : '创建'" @click="handleSave" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '../../stores/auth';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  eventToEdit: { type: Object, default: null },
  selectedDateRange: { type: Object, default: null },
});

const emit = defineEmits(['close', 'save', 'delete']);

const authStore = useAuthStore();
const errorMessage = ref('');
const userList = ref([]);
const isLoadingUsers = ref(false);
const isVisible = ref(false);

const formData = ref({
  id: null,
  title: '',
  isAllDay: false,
  start: new Date(),
  end: new Date(),
  userId: authStore.user.userId,
  createdByAdmin: false,
  color: '#4f46e5',
});

const localStart = ref(new Date());
const localEnd = ref(new Date());

const isEditMode = computed(() => !!formData.value.id);
const dialogTitle = computed(() => (isEditMode.value ? '编辑日程' : '新建日程'));
const isDeleteDisabled = computed(() => authStore.role !== 'admin' && formData.value.createdByAdmin);

const labels = [
  { value: 'default', name: '默认（蓝）', color: '#4f46e5' },
  { value: 'important', name: '重要（玫红）', color: '#db2777' },
  { value: 'meeting', name: '会议（青绿）', color: '#059669' },
  { value: 'reminder', name: '提醒（琥珀）', color: '#d97706' },
];

watch(() => props.isOpen, async (newVal) => {
  isVisible.value = newVal;
  if (!newVal) return;
  errorMessage.value = '';
  if (authStore.role === 'admin') {
    await fetchUsers();
  }

  if (props.eventToEdit) {
    const event = props.eventToEdit;
    formData.value = {
      id: event.id,
      title: event.title,
      isAllDay: event.isAllday || false,
      start: new Date(event.start),
      end: new Date(event.end),
      userId: event.raw.authorId,
      createdByAdmin: event.raw.createdByAdmin || false,
      color: event.raw.color || '#4f46e5',
    };
    localStart.value = new Date(event.start);
    localEnd.value = new Date(event.end);
  } else if (props.selectedDateRange) {
    const range = props.selectedDateRange;
    formData.value = {
      id: null,
      title: '',
      isAllDay: range.isAllday || false,
      start: new Date(range.start),
      end: new Date(range.end),
      userId: authStore.user.userId,
      createdByAdmin: authStore.role === 'admin',
      color: '#4f46e5',
    };
    localStart.value = new Date(range.start);
    localEnd.value = new Date(range.end);
  }
});

watch(localStart, (val) => {
  if (val) formData.value.start = val;
});

watch(localEnd, (val) => {
  if (val) formData.value.end = val;
});

async function fetchUsers() {
  isLoadingUsers.value = true;
  try {
    const res = await apiClient.get('/admin/users');
    userList.value = res.data || [];
  } catch (error) {
    console.error('获取用户列表失败:', error);
    errorMessage.value = '无法加载用户列表';
  } finally {
    isLoadingUsers.value = false;
  }
}

function closeModal() {
  isVisible.value = false;
  emit('close');
}

function handleDialogClose(val: boolean) {
  if (!val) {
    closeModal();
  }
}

function handleSave() {
  if (!formData.value.title) {
    errorMessage.value = '标题不能为空';
    return;
  }

  const payload = {
    id: formData.value.id,
    title: formData.value.title,
    startAt: formData.value.start.toISOString(),
    endAt: formData.value.end.toISOString(),
    isAllDay: formData.value.isAllDay,
    userId: formData.value.userId,
    color: formData.value.color || '#4f46e5',
  };

  emit('save', payload);
}

function handleDelete() {
  if (!confirm('确定要删除这个日程吗？')) return;
  emit('delete', formData.value.id);
}
</script>
