<template>
  <Dialog 
    v-model:visible="isVisible" 
    modal 
    :header="dialogTitle" 
    :style="{ width: '32rem' }" 
    :pt="{
      root: { class: 'event-modal-dialog' },
      header: { class: 'event-modal-header' },
      content: { class: 'event-modal-content' },
      footer: { class: 'event-modal-footer' }
    }"
    @update:visible="handleDialogClose"
  >
    <div class="flex flex-column gap-5">
      <!-- Title Input -->
      <div class="flex flex-column gap-2">
        <label for="title" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">标题 *</label>
        <InputText 
          id="title" 
          v-model="formData.title" 
          class="event-input"
          placeholder="输入日程标题..."
        />
      </div>

      <!-- Date Time Pickers -->
      <div class="flex gap-4">
        <div class="flex-1 flex flex-column gap-2">
          <label for="startAt" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">开始时间 *</label>
          <Calendar
            v-model="localStart"
            :show-time="!formData.isAllDay"
            :show-icon="true"
            date-format="yy-mm-dd"
            class="event-calendar w-full"
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
            class="event-calendar w-full"
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
          class="event-dropdown w-full"
        />
      </div>

      <!-- Assign User (Admin Only) -->
      <div v-if="authStore.role === 'admin'" class="flex flex-column gap-2">
        <label for="userId" class="text-xs font-semibold text-slate-500 uppercase tracking-wider">指派成员 *</label>
        <p v-if="isLoadingUsers" class="text-xs text-slate-400 m-0">正在加载用户列表...</p>
        <Dropdown 
          v-else 
          v-model="formData.userId" 
          :options="userList" 
          option-label="nickname" 
          option-value="id" 
          class="event-dropdown w-full"
          placeholder="选择成员"
        />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false" class="m-0">{{ errorMessage }}</Message>
    </div>

    <template #footer>
      <div class="flex justify-content-between w-full pt-2">
        <Button
          v-if="isEditMode"
          label="删除"
          severity="danger"
          text
          :disabled="isDeleteDisabled"
          class="delete-btn"
          @click="handleDelete"
        />
        <div class="flex gap-3 ml-auto">
          <Button 
            label="取消" 
            severity="secondary" 
            text 
            class="cancel-btn"
            @click="closeModal" 
          />
          <Button 
            :label="isEditMode ? '保存' : '创建'" 
            class="save-btn"
            @click="handleSave" 
          />
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

<style>
/* ===== Event Modal Dialog ===== */
.event-modal-dialog.p-dialog {
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(226, 232, 240, 0.6);
  overflow: hidden;
}

.event-modal-header.p-dialog-header {
  background: linear-gradient(to bottom, #fafafa, #ffffff);
  border-bottom: 1px solid #f1f5f9;
  padding: 1.25rem 1.5rem;
}

.event-modal-header .p-dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.event-modal-header .p-dialog-header-icon {
  color: #94a3b8;
  width: 2rem;
  height: 2rem;
}
.event-modal-header .p-dialog-header-icon:hover {
  background: #f1f5f9;
  color: #475569;
}

.event-modal-content.p-dialog-content {
  padding: 1.5rem;
  background: #ffffff;
}

.event-modal-footer.p-dialog-footer {
  padding: 1rem 1.5rem;
  background: #fafafa;
  border-top: 1px solid #f1f5f9;
}

/* ===== Form Inputs ===== */
.event-input.p-inputtext {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #ffffff;
  transition: all 0.2s ease;
}
.event-input.p-inputtext:enabled:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.event-input.p-inputtext::placeholder {
  color: #94a3b8;
}

/* ===== Calendar Pickers ===== */
.event-calendar.p-calendar .p-inputtext {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem 0 0 0.75rem;
  min-width: 0;
}
.event-calendar.p-calendar .p-inputtext:enabled:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  z-index: 1;
}
.event-calendar.p-calendar .p-datepicker-trigger {
  border-radius: 0 0.75rem 0.75rem 0;
  border: 1px solid #e2e8f0;
  border-left: none;
  background: #f8fafc;
  color: #64748b;
}
.event-calendar.p-calendar .p-datepicker-trigger:hover {
  background: #f1f5f9;
  color: #475569;
}

/* ===== Dropdown ===== */
.event-dropdown.p-dropdown {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #ffffff;
}
.event-dropdown.p-dropdown:not(.p-disabled):hover {
  border-color: #cbd5e1;
}
.event-dropdown.p-dropdown:not(.p-disabled).p-focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.event-dropdown .p-dropdown-label {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
}

/* ===== Buttons ===== */
.save-btn.p-button {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 0.625rem;
  padding: 0.625rem 1.25rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  transition: all 0.2s ease;
}
.save-btn.p-button:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.cancel-btn.p-button {
  color: #64748b;
  font-weight: 500;
}
.cancel-btn.p-button:hover {
  background: #f1f5f9;
  color: #475569;
}

.delete-btn.p-button {
  color: #dc2626;
  font-weight: 500;
}
.delete-btn.p-button:hover {
  background: #fef2f2;
  color: #b91c1c;
}

/* ===== Checkbox ===== */
.bg-slate-50 .p-checkbox .p-checkbox-box {
  border-radius: 0.375rem;
}
</style>
