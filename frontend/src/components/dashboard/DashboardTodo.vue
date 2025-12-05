<template>
  <section 
    class="h-full flex flex-column gap-3" 
    :class="compact ? 'p-0' : 'glass-card-solid p-4'"
  >
    <header v-if="!compact" class="flex align-items-center justify-content-between">
      <div>
        <h4 class="m-0">待办</h4>
        <p class="text-sm text-color-secondary m-0">快速管理本周的待办事项</p>
      </div>
    </header>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <div v-if="isLoading" :class="compact ? 'text-xs text-color-secondary' : 'text-sm text-color-secondary'">正在加载...</div>
    <Message v-else-if="displayTodos.length === 0" severity="info" :closable="false">
      暂无待办，添加第一条吧
    </Message>

    <div 
      v-else 
      class="flex flex-column overflow-auto pr-2" 
      :class="compact ? 'gap-2' : 'gap-2'" 
      :style="compact ? 'max-height: 12rem;' : 'max-height: 16rem;'"
    >
      <div
        v-for="todo in displayTodos"
        :key="todo.id"
        class="flex align-items-center pb-2"
        :class="compact ? 'gap-2 border-bottom-1 surface-border' : 'gap-3 border-bottom-1 surface-border'"
      >
        <Checkbox
          :input-id="`todo-${todo.id}`"
          binary
          :model-value="todo.isCompleted"
          @update:model-value="(value) => handleToggleTodo(todo, value)"
        />
        <label
          :for="`todo-${todo.id}`"
          class="flex-1 cursor-pointer"
          :class="[
            compact ? 'text-xs' : 'text-sm',
            { 'line-through text-color-secondary': todo.isCompleted }
          ]"
        >
          {{ todo.content }}
        </label>
        <Button
          v-if="!compact"
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          aria-label="删除待办"
          @click="handleDeleteTodo(todo.id)"
        />
      </div>
    </div>

    <form v-if="!compact" class="flex align-items-center gap-2 pt-2" @submit.prevent="handleNewTodo">
      <InputText
        v-model="newTodoText"
        class="flex-1"
        autocomplete="off"
        placeholder="添加新待办..."
      />
      <Button
        type="submit"
        label="添加"
        icon="pi pi-plus"
        :loading="isSaving"
        :disabled="!newTodoText"
      />
    </form>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { isAxiosError } from 'axios';
import apiClient from '@/services/apiClient';

type TodoItem = {
  id: number;
  content: string;
  isCompleted: boolean;
};

// Props
const props = withDefaults(defineProps<{
  compact?: boolean;
  maxItems?: number;
}>(), {
  compact: false,
  maxItems: 999,
});

const todos = ref<TodoItem[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref('');
const newTodoText = ref('');

// 显示的待办列表（根据maxItems限制）
const displayTodos = computed(() => {
  return todos.value.slice(0, props.maxItems);
});

const extractError = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }
  return fallback;
};

const fetchTodos = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await apiClient.get<TodoItem[]>('/todos');
    todos.value = data;
  } catch (error) {
    errorMessage.value = extractError(error, '加载待办列表失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchTodos);

const handleToggleTodo = async (todo: TodoItem, nextValue: boolean) => {
  const index = todos.value.findIndex((item) => item.id === todo.id);
  if (index === -1) return;

  const previousValue = todos.value[index].isCompleted;
  todos.value[index] = { ...todo, isCompleted: nextValue };

  try {
    await apiClient.put(`/todos/${todo.id}`, { isCompleted: nextValue });
  } catch (error) {
    todos.value[index].isCompleted = previousValue;
    errorMessage.value = extractError(error, '更新失败，请稍后重试');
  }
};

const handleDeleteTodo = async (id: number) => {
  if (!confirm('确定删除这条待办吗？')) return;
  const previous = [...todos.value];
  todos.value = previous.filter((item) => item.id !== id);

  try {
    await apiClient.delete(`/todos/${id}`);
  } catch (error) {
    todos.value = previous;
    errorMessage.value = extractError(error, '删除失败，请稍后重试');
  }
};

const handleNewTodo = async () => {
  const content = newTodoText.value.trim();
  if (!content) return;

  isSaving.value = true;
  errorMessage.value = '';
  try {
    const { data } = await apiClient.post<TodoItem>('/todos', { content });
    todos.value.push(data);
    newTodoText.value = '';
  } catch (error) {
    errorMessage.value = extractError(error, '创建失败，请稍后重试');
  } finally {
    isSaving.value = false;
  }
};
</script>
