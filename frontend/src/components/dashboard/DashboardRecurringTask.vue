<template>
  <div class="w-full" v-bind="$attrs">
    <section class="surface-card border-round-lg shadow-1 p-4 h-full flex flex-column gap-3">
      <header class="flex align-items-center justify-content-between">
        <div>
          <h4 class="m-0">周期任务</h4>
          <p class="text-sm text-color-secondary m-0">按日/周/月复用的常规任务</p>
        </div>
        <Button icon="pi pi-plus" rounded text @click="isModalOpen = true" aria-label="新增任务" />
      </header>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <div v-if="isLoading" class="text-sm text-color-secondary">加载中...</div>
      <p v-else-if="tasks.length === 0" class="text-sm text-color-secondary">暂无周期任务</p>

      <div v-else class="flex flex-column gap-3 overflow-auto pr-2" style="max-height: 18rem;">
        <TaskGroup label="每日" :tasks="dailyTasks" @toggle="onToggle" @delete="onDelete" />
        <TaskGroup label="每周" :tasks="weeklyTasks" @toggle="onToggle" @delete="onDelete" />
        <TaskGroup label="每月" :tasks="monthlyTasks" @toggle="onToggle" @delete="onDelete" />
      </div>
    </section>

    <RecurringTaskModal
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @task-created="handleTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import apiClient from '@/services/apiClient';
import RecurringTaskModal from '../common/RecurringTaskModal.vue';

type RecurringTask = {
  id: string | number;
  content: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastCompletedAt?: string | null;
};

const tasks = ref<RecurringTask[]>([]);
const isLoading = ref(true);
const isModalOpen = ref(false);
const errorMessage = ref('');

const dailyTasks = computed(() => tasks.value.filter((t) => t.period === 'DAILY'));
const weeklyTasks = computed(() => tasks.value.filter((t) => t.period === 'WEEKLY'));
const monthlyTasks = computed(() => tasks.value.filter((t) => t.period === 'MONTHLY'));

const fetchTasks = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get<RecurringTask[]>('/recurring-tasks');
    tasks.value = Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error('加载周期任务失败:', error);
    errorMessage.value = error.response?.data?.error || '无法加载周期任务列表';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchTasks);

const isTaskCompleted = (task: RecurringTask) => !!task.lastCompletedAt;

const onToggle = async (task: RecurringTask) => {
  const index = tasks.value.findIndex((t) => t.id === task.id);
  if (index === -1) return;

  const previous = tasks.value[index];
  tasks.value[index] = { ...previous, lastCompletedAt: previous.lastCompletedAt ? null : new Date().toISOString() };

  try {
    const { data } = await apiClient.put<RecurringTask>(`/recurring-tasks/${task.id}/toggle`, {
      isCompleted: !isTaskCompleted(previous),
    });
    tasks.value[index] = data;
  } catch (error: any) {
    tasks.value[index] = previous;
    console.error('更新任务失败:', error);
    errorMessage.value = error.response?.data?.error || '更新任务失败，请稍后重试';
  }
};

const onDelete = async (task: RecurringTask) => {
  if (!confirm(`确定删除周期任务"${task.content}" 吗？`)) return;
  const prev = [...tasks.value];
  tasks.value = prev.filter((item) => item.id !== task.id);
  try {
    await apiClient.delete(`/recurring-tasks/${task.id}`);
  } catch (error: any) {
    tasks.value = prev;
    console.error('删除任务失败:', error);
    errorMessage.value = error.response?.data?.error || '删除任务失败，请稍后重试';
  }
};

const handleTaskCreated = (newTask: RecurringTask) => {
  tasks.value.push(newTask);
  isModalOpen.value = false;
};

const TaskGroup = defineComponent({
  name: 'TaskGroup',
  props: {
    label: { type: String, required: true },
    tasks: { type: Array, required: true },
  },
  emits: ['toggle', 'delete'],
  setup(props, { emit }) {
    const onToggleTask = (task: RecurringTask) => emit('toggle', task);
    const onDeleteTask = (task: RecurringTask) => emit('delete', task);

    return () => {
      const typedTasks = props.tasks as RecurringTask[];
      if (!typedTasks.length) return null;

      return h('div', null, [
        h('p', { class: 'text-xs font-bold text-color-secondary mb-2' }, props.label),
        ...typedTasks.map((task) =>
          h(
            'div',
            { class: 'flex align-items-center gap-2 mb-1' },
            [
              h(Checkbox, {
                inputId: `task-${task.id}`,
                binary: true,
                modelValue: !!task.lastCompletedAt,
                'onUpdate:modelValue': () => onToggleTask(task),
              }),
              h(
                'label',
                {
                  for: `task-${task.id}`,
                  class: [
                    'flex-1 text-sm cursor-pointer',
                    task.lastCompletedAt ? 'line-through text-color-secondary' : 'text-color',
                  ],
                },
                task.content,
              ),
              h(Button, {
                icon: 'pi pi-trash',
                severity: 'danger',
                text: true,
                rounded: true,
                'aria-label': '删除任务',
                onClick: () => onDeleteTask(task),
              }),
            ],
          ),
        ),
      ]);
    };
  },
});
</script>
