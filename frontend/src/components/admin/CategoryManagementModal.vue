<template>
  <Dialog
    :visible="isOpen"
    @update:visible="$emit('update:isOpen', $event)"
    modal
    header="管理产品分类"
    :style="{ width: '500px' }"
    class="category-modal"
  >
    <div class="category-manager">
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i> 加载中...
      </div>
      
      <div v-else>
        <div class="add-section">
          <InputText 
            v-model="newCategoryName" 
            placeholder="输入新分类名称" 
            class="w-full"
            @keyup.enter="addCategory"
          />
          <Button 
            icon="pi pi-plus" 
            @click="addCategory" 
            :disabled="!newCategoryName.trim() || isSaving"
            class="p-button-primary p-button-sm ml-2"
          />
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false" class="mt-3">
          {{ errorMessage }}
        </Message>

        <div class="category-list mt-3">
          <div v-if="categories.length === 0" class="text-center text-500 py-4">
            暂无分类，请先添加
          </div>
          
          <div 
            v-for="cat in categories" 
            :key="cat.id" 
            class="category-item"
          >
            <div v-if="editingId === cat.id" class="edit-mode">
              <InputText 
                v-model="editName" 
                class="p-inputtext-sm w-full"
                autofocus
                @keyup.enter="saveEdit(cat.id)"
                @keyup.escape="cancelEdit"
              />
              <div class="edit-actions">
                <Button icon="pi pi-check" class="p-button-sm p-button-success p-button-text" @click="saveEdit(cat.id)" :loading="isSaving"/>
                <Button icon="pi pi-times" class="p-button-sm p-button-secondary p-button-text" @click="cancelEdit" :disabled="isSaving"/>
              </div>
            </div>
            
            <div v-else class="view-mode">
              <span class="category-name">{{ cat.name }}</span>
              <div class="actions">
                <Button icon="pi pi-pencil" class="p-button-sm p-button-text" @click="startEdit(cat)" />
                <Button icon="pi pi-trash" class="p-button-sm p-button-danger p-button-text" @click="confirmDelete(cat)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import apiClient from '@/services/apiClient';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const confirmService = useConfirm();

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['update:isOpen', 'categories-updated']);

type Category = {
  id: string;
  name: string;
};

const categories = ref<Category[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');

const newCategoryName = ref('');

// Edit state
const editingId = ref<string | null>(null);
const editName = ref('');

const fetchCategories = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const res = await apiClient.get('/admin/categories');
    categories.value = res.data;
  } catch (error: any) {
    errorMessage.value = '加载分类失败：' + (error.response?.data?.error || error.message);
  } finally {
    isLoading.value = false;
  }
};

const addCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  
  isSaving.value = true;
  errorMessage.value = '';
  try {
    await apiClient.post('/admin/categories', { name: newCategoryName.value.trim() });
    newCategoryName.value = '';
    await fetchCategories();
    emit('categories-updated');
  } catch (error: any) {
    errorMessage.value = '添加失败：' + (error.response?.data?.error || error.message);
  } finally {
    isSaving.value = false;
  }
};

const startEdit = (cat: Category) => {
  editingId.value = cat.id;
  editName.value = cat.name;
};

const cancelEdit = () => {
  editingId.value = null;
  editName.value = '';
  errorMessage.value = '';
};

const saveEdit = async (id: string) => {
  if (!editName.value.trim() || editName.value === categories.value.find(c => c.id === id)?.name) {
    cancelEdit();
    return;
  }
  
  isSaving.value = true;
  errorMessage.value = '';
  try {
    await apiClient.put(`/admin/categories/${id}`, { name: editName.value.trim() });
    editingId.value = null;
    await fetchCategories();
    emit('categories-updated');
  } catch (error: any) {
    errorMessage.value = '无修改失败：' + (error.response?.data?.error || error.message);
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (cat: Category) => {
  confirmService.require({
    message: `确认删除分类「${cat.name}」吗？\n注意：这不会删除已有商品上的分类文本，但下拉菜单将不再显示。`,
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: async () => {
      errorMessage.value = '';
      try {
        await apiClient.delete(`/admin/categories/${cat.id}`);
        await fetchCategories();
        emit('categories-updated');
      } catch (error: any) {
        errorMessage.value = '删除失败：' + (error.response?.data?.error || error.message);
      }
    }
  });
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchCategories();
    cancelEdit();
    newCategoryName.value = '';
    errorMessage.value = '';
  }
});

onMounted(() => {
  if (props.isOpen) {
    fetchCategories();
  }
});
</script>

<style scoped>
.category-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-section {
  display: flex;
  align-items: center;
}

.category-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--surface-200);
  border-radius: 6px;
  padding: 0.5rem;
}

.category-item {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-100);
}

.category-item:last-child {
  border-bottom: none;
}

.view-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-weight: 500;
  color: var(--surface-800);
}

.actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.category-item:hover .actions {
  opacity: 1;
}

.edit-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.edit-actions {
  display: flex;
  gap: 0.25rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--surface-500);
}
</style>
