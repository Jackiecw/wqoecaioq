<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                {{ isEditMode ? '编辑链接' : '新建链接' }}
              </DialogTitle>
              
              <div class="mt-4 space-y-4">
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700">标题</label>
                  <input
                    type="text"
                    id="title"
                    v-model="formData.title"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="例如: Google Drive"
                  />
                </div>

                <div>
                  <label for="url" class="block text-sm font-medium text-gray-700">URL</label>
                  <input
                    type="url"
                    id="url"
                    v-model="formData.url"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700">描述 (可选)</label>
                  <input
                    type="text"
                    id="description"
                    v-model="formData.description"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="简短描述"
                  />
                </div>

                <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  @click="handleSubmit"
                  :disabled="isLoading"
                >
                  {{ isEditMode ? '保存' : '创建' }}
                </button>
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  @click="closeModal"
                >
                  取消
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import apiClient from '@/services/apiClient';

const props = defineProps({
  isOpen: Boolean,
  linkToEdit: Object,
});

const emit = defineEmits(['close', 'link-created', 'link-updated']);

const formData = ref({
  title: '',
  url: '',
  description: '',
});

const isLoading = ref(false);
const errorMessage = ref('');

const isEditMode = computed(() => !!props.linkToEdit);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    if (props.linkToEdit) {
      formData.value = { ...props.linkToEdit };
    } else {
      formData.value = { title: '', url: '', description: '' };
    }
  }
});

async function handleSubmit() {
  if (!formData.value.title || !formData.value.url) {
    errorMessage.value = '标题和 URL 不能为空';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (isEditMode.value) {
      await apiClient.put(`/admin/links/${props.linkToEdit.id}`, formData.value);
      emit('link-updated');
    } else {
      await apiClient.post('/admin/links', formData.value);
      emit('link-created');
    }
    closeModal();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || '操作失败';
  } finally {
    isLoading.value = false;
  }
}

function closeModal() {
  emit('close');
}
</script>
