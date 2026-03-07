<template>
  <Dialog 
    v-model:visible="isVisible" 
    modal 
    :header="dialogTitle" 
    :style="{ width: '32rem' }" 
    @update:visible="handleDialogClose"
  >
    <div class="flex flex-column gap-5">
      <!-- Title Input -->
      <div class="flex flex-column gap-2">
        <label for="title" class="uni-form-label">标题 *</label>
        <InputText 
          id="title" 
          v-model="formData.title" 
          class="w-full"
          placeholder="输入日程标题..."
        />
      </div>

      <!-- Date Time Pickers -->
      <div class="flex gap-4">
        <div class="flex-1 flex flex-column gap-2">
          <label for="startAt" class="uni-form-label">开始时间 *</label>
          <Calendar
            v-model="localStart"
            :show-time="!formData.isAllDay"
            :show-icon="true"
            date-format="yy-mm-dd"
            class="w-full"
            input-id="startAt"
          />
        </div>
        <div class="flex-1 flex flex-column gap-2">
          <label for="endAt" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">结束时间 *</label>
          <Calendar
            v-model="localEnd"
            :show-time="!formData.isAllDay"
            :show-icon="true"
            date-format="yy-mm-dd"
            class="w-full"
            input-id="endAt"
          />
        </div>
      </div>

      <!-- All Day Toggle -->
      <div class="flex align-items-center gap-3 py-2 px-3 bg-slate-50 rounded-xl">
        <Checkbox v-model="formData.isAllDay" input-id="isAllDay" :binary="true" />
        <label for="isAllDay" class="text-sm text-slate-700 cursor-pointer select-none">全天事件</label>
      </div>

      <!-- Label / Color -->
      <div class="flex flex-column gap-2">
        <label for="label" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">标签 / 颜色</label>
        <Dropdown 
          v-model="formData.color" 
          :options="labels" 
          option-label="name" 
          option-value="color" 
          class="w-full"
        />
      </div>

      <!-- Assign User (Admin Only) -->
      <div v-if="isAdmin" class="flex flex-column gap-2">
        <label for="userId" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">指派成员 *</label>
        <p v-if="isLoadingUsers" class="text-xs text-slate-400 m-0">正在加载用户列表...</p>
        <Dropdown 
          v-else 
          v-model="formData.userId" 
          :options="userList" 
          option-label="nickname" 
          option-value="id" 
          class="w-full"
          placeholder="选择成员"
        />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false" class="m-0">{{ errorMessage }}</Message>
    </div>

    <div class="uni-modal-footer" style="justify-content: space-between;">
      <Button
        v-if="isEditMode"
        label="删除"
        severity="danger"
        text
        :disabled="isDeleteDisabled"
        @click="handleDelete"
      />
      <div v-else></div>
      <div class="flex gap-3">
        <Button 
          label="取消" 
          severity="secondary" 
          text 
          @click="closeModal" 
        />
        <Button 
          :label="isEditMode ? '保存' : '创建'" 
          @click="handleSave" 
        />
      </div>
    </div>
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
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '../../stores/auth';
import { usePermission } from '@/composables/usePermission';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  eventToEdit: { type: Object, default: null },
  selectedDateRange: { type: Object, default: null },
});

const emit = defineEmits(['close', 'save', 'delete']);

const authStore = useAuthStore();
const { isAdmin } = usePermission();
const confirmService = useConfirm();
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
const isDeleteDisabled = computed(() => !isAdmin.value && formData.value.createdByAdmin);

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
  if (isAdmin.value) {
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
      createdByAdmin: isAdmin.value,
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
  confirmService.require({
    message: '确定要删除这个日程吗？',
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => {
      emit('delete', formData.value.id);
    }
  });
}
</script>
