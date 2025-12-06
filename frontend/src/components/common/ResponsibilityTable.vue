<template>
  <div>
    <p v-if="isLoading" class="text-stone-500">正在加载 {{ countryCode }} 数据...</p>
    <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>

    <div v-if="!isLoading && modules.length === 0" class="p-6 bg-white rounded-lg shadow text-center text-stone-500">
      <p>
        “{{ countryCode }}”国家暂无数据
        <button v-if="isAdmin" @click="handleAddModule" class="ml-2 text-indigo-600 font-semibold">
          点此创建第一个板块
        </button>
      </p>
    </div>

    <div v-if="!isLoading && modules.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full border-collapse">
        <thead class="bg-stone-100">
          <tr>
            <th class="table-th w-[15%]">板块</th>
            <th class="table-th w-[15%]">板块责任</th>
            <th class="table-th w-[30%]">事项</th>
            <th class="table-th w-[15%]">事项责任</th>
            <th class="table-th w-[15%]">备注</th>
            <th v-if="isAdmin" class="table-th w-[10%]">操作</th>
          </tr>
        </thead>

        <template v-for="module in modules" :key="module.id">
          <tr class="border-t border-stone-300">
            <td :rowspan="calcRowSpan(module)" class="table-td-module">
              <EditableCell
                :value="module.name"
                type="text"
                :is-admin="isAdmin"
                placeholder="板块名称"
                @save="(value: string | null) => handleSave(value, module.id, 'name', 'module')"
              />
            </td>
            <td :rowspan="calcRowSpan(module)" class="table-td-module">
              <EditableCell
                :value="module.owner"
                type="user-select"
                :options="userList"
                :is-admin="isAdmin"
                placeholder="-"
                @save="(value: string | null) => handleSave(value, module.id, 'ownerId', 'module')"
              />
            </td>

            <template v-if="module.tasks.length > 0">
              <td class="table-td">
                <EditableCell
                  :value="module.tasks[0].name"
                  type="text"
                  :is-admin="isAdmin"
                  placeholder="事项名称"
                  @save="(value: string | null) => handleSave(value, module.tasks[0].id, 'name', 'task')"
                />
              </td>
              <td class="table-td">
                <EditableCell
                  :value="module.tasks[0].owner"
                  type="user-select"
                  :options="userList"
                  :is-admin="isAdmin"
                  placeholder="-"
                  @save="(value: string | null) => handleSave(value, module.tasks[0].id, 'ownerId', 'task')"
                />
              </td>
              <td class="table-td">
                <EditableCell
                  :value="module.tasks[0].notes"
                  type="text"
                  :is-admin="isAdmin"
                  placeholder="-"
                  @save="(value: string | null) => handleSave(value, module.tasks[0].id, 'notes', 'task')"
                />
              </td>
              <td v-if="isAdmin" class="table-td text-center">
                <button @click="handleDeleteTask(module.tasks[0].id, module.id)" class="text-red-500 hover:text-red-700 p-1 rounded-full">
                  <TrashIcon class="h-4 w-4" />
                </button>
              </td>
            </template>

            <template v-else>
              <td class="table-td text-stone-400 italic">...</td>
              <td class="table-td text-stone-400 italic">...</td>
              <td class="table-td text-stone-400 italic">...</td>
              <td v-if="isAdmin" class="table-td"></td>
            </template>
          </tr>

          <tr v-for="task in module.tasks.slice(1)" :key="task.id" class="border-t border-stone-200">
            <td class="table-td">
              <EditableCell
                :value="task.name"
                type="text"
                :is-admin="isAdmin"
                placeholder="事项名称"
                @save="(value: string | null) => handleSave(value, task.id, 'name', 'task')"
              />
            </td>
            <td class="table-td">
              <EditableCell
                :value="task.owner"
                type="user-select"
                :options="userList"
                :is-admin="isAdmin"
                placeholder="-"
                @save="(value: string | null) => handleSave(value, task.id, 'ownerId', 'task')"
              />
            </td>
            <td class="table-td">
              <EditableCell
                :value="task.notes"
                type="text"
                :is-admin="isAdmin"
                placeholder="-"
                @save="(value: string | null) => handleSave(value, task.id, 'notes', 'task')"
              />
            </td>
            <td v-if="isAdmin" class="table-td text-center">
              <button @click="handleDeleteTask(task.id, module.id)" class="text-red-500 hover:text-red-700 p-1 rounded-full">
                <TrashIcon class="h-4 w-4" />
              </button>
            </td>
          </tr>

          <tr v-if="isAdmin" class="border-t border-stone-200">
            <td class="table-td">
              <button @click="handleAddTask(module.id)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                <PlusIcon class="h-4 w-4 mr-1" /> 添加事项
              </button>
            </td>
            <td class="table-td"></td>
            <td class="table-td"></td>
            <td class="table-td text-center">
              <button @click="handleDeleteModule(module.id)" class="text-red-600 hover:text-red-800 text-sm font-medium flex items-center">
                <TrashIcon class="h-4 w-4 mr-1" /> 删除板块
              </button>
            </td>
          </tr>
        </template>

        <tfoot v-if="isAdmin">
          <tr class="border-t-2 border-stone-400">
            <td colspan="6" class="p-4">
              <button @click="handleAddModule" class="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition text-sm font-medium">
                + 新建板块
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '../../stores/auth';
import { TrashIcon, PlusIcon } from '@heroicons/vue/20/solid';
import EditableCell from './EditableCell.vue';

interface Task {
  id: string;
  name: string;
  owner?: string;
  ownerId?: string | null;
  notes?: string | null;
}

interface Module {
  id: string;
  name: string;
  owner?: string;
  ownerId?: string | null;
  tasks: Task[];
}

interface UserOption {
  id: string;
  nickname: string;
}

const props = defineProps<{
  countryCode: string;
}>();

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.role === 'admin');

const modules = ref<Module[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const userList = ref<UserOption[]>([]);

const fetchData = async (code: string) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get<Module[]>(`/operation/data?country=${code}`);
    modules.value = response.data;
  } catch (error) {
    console.error(`获取 ${code} 数据失败:`, error);
    errorMessage.value = `获取 ${code} 数据失败。`;
  } finally {
    isLoading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const response = await apiClient.get<UserOption[]>('/admin/users');
    userList.value = response.data.map((u: any) => ({ id: u.id, nickname: u.nickname }));
  } catch (error) {
    console.error('获取用户列表失败:', error);
    errorMessage.value = '无法加载责任人下拉列表';
  }
};

watch(
  () => props.countryCode,
  (newCode) => {
    if (newCode) {
      fetchData(newCode);
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (isAdmin.value) {
    fetchUsers();
  }
});

const calcRowSpan = (module: Module) => {
  const taskCount = module.tasks.length || 1;
  return isAdmin.value ? taskCount + 1 : taskCount;
};

const handleSave = async (
  value: string | null,
  id: string,
  field: 'name' | 'ownerId' | 'notes',
  type: 'module' | 'task',
) => {
  try {
    const payload = { [field]: value };
    if (type === 'module') {
      const response = await apiClient.put<Module>(`/admin/operation-modules/${id}`, payload);
      const module = modules.value.find((m) => m.id === id);
      if (module) {
        Object.assign(module, response.data);
      }
    } else {
      const response = await apiClient.put<Task>(`/admin/operation-tasks/${id}`, payload);
      modules.value.forEach((module) => {
        const task = module.tasks.find((t) => t.id === id);
        if (task) {
          Object.assign(task, response.data);
        }
      });
    }
  } catch (error) {
    console.error('更新失败:', error);
    errorMessage.value = '更新失败，请刷新页面';
    fetchData(props.countryCode);
  }
};

const handleAddTask = async (moduleId: string) => {
  const name = prompt('请输入新事项的名称');
  if (!name) return;

  try {
    const response = await apiClient.post<Task>('/admin/operation-tasks', {
      name,
      moduleId,
      ownerId: null,
      notes: null,
    });
    const module = modules.value.find((m) => m.id === moduleId);
    if (module) {
      module.tasks.push(response.data);
    }
  } catch (error) {
    errorMessage.value = '创建事项失败';
  }
};

const handleAddModule = async () => {
  const name = prompt('请输入新板块的名称');
  if (!name) return;

  try {
    const response = await apiClient.post<Module>('/admin/operation-modules', {
      name,
      countryCode: props.countryCode,
      ownerId: null,
    });
    modules.value.push(response.data);
  } catch (error) {
    errorMessage.value = '创建板块失败';
  }
};

const handleDeleteTask = async (taskId: string, moduleId: string) => {
  if (!confirm('确定要删除这个事项吗？')) return;
  try {
    await apiClient.delete(`/admin/operation-tasks/${taskId}`);
    const module = modules.value.find((m) => m.id === moduleId);
    if (module) {
      module.tasks = module.tasks.filter((t) => t.id !== taskId);
    }
  } catch (error) {
    errorMessage.value = '删除事项失败';
  }
};

const handleDeleteModule = async (moduleId: string) => {
  if (!confirm('确定要删除这个板块及其所有事项吗？此操作不可逆！')) return;
  try {
    await apiClient.delete(`/admin/operation-modules/${moduleId}`);
    modules.value = modules.value.filter((m) => m.id !== moduleId);
  } catch (error) {
    errorMessage.value = '删除板块失败';
  }
};
</script>

<style scoped>
/* Clean White Theme */
.bg-white {
  background: var(--color-bg-card);
}

.bg-stone-100 {
  background: var(--color-bg-page);
}

.text-stone-500 {
  color: var(--color-text-secondary);
}

.text-indigo-600 {
  color: var(--color-accent);
}

.bg-indigo-600 {
  background: var(--color-accent);
}

.bg-indigo-600:hover {
  filter: brightness(0.95);
}

.rounded-lg {
  border-radius: var(--radius-md);
}

.shadow {
  box-shadow: var(--shadow-sm);
}

table {
  border-color: var(--color-border);
}

.table-th {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.table-td, .table-td-module {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  vertical-align: top;
}

.table-td-module {
  background: var(--color-bg-page);
  font-weight: 500;
}

.border-stone-200 {
  border-color: var(--color-border);
}

.border-stone-300 {
  border-color: var(--color-border);
}
</style>
