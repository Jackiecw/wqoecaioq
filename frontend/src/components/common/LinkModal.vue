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

            <DialogPanel class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">

              

              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">

                {{ dialogTitle }}

              </DialogTitle>

              

              <div class="mt-4 grid grid-cols-1 gap-4">

                

                <div class="input-group">

                  <label for="linkTitle">标题 *</label>

                  <input 

                    type="text" 

                    id="linkTitle" 

                    v-model="formData.title"

                    placeholder="例如: Shopee 印尼卖家中心"

                  />

                </div>



                <div class="input-group">

                  <label for="linkUrl">URL (链接地址) *</label>

                  <input 

                    type="text" 

                    id="linkUrl" 

                    v-model="formData.url"

                    placeholder="例如: https://seller.shopee.co.id/"

                  />

                </div>



                <div class="input-group">

                  <label for="linkDesc">备注 (说明)</label>

                  <input 

                    type="text" 

                    id="linkDesc" 

                    v-model="formData.description"

                    placeholder="例如: 财务后台 (可"

                  />

                </div>



                <div class="input-group">

                  <label for="linkOrder">显示顺序 (数字越小越靠</label>

                  <input 

                    type="number" 

                    id="linkOrder" 

                    v-model="formData.displayOrder"

                  />

                </div>

                

                <p v-if="errorMessage" class="text-red-600 text-sm col-span-2">

                  {{ errorMessage }}

                </p>

              </div>



              <div class="mt-6 flex justify-end space-x-4">

                <button

                  type="button"

                  @click="closeModal"

                  class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"

                >

                  取消

                </button>

                <button

                  type="button"

                  @click="handleSubmit"

                  class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"

                >

                  {{ submitButtonText }}

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
import { ref, watch, computed } from 'vue';
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import apiClient from '@/services/apiClient';

interface LinkPayload {
  title: string;
  url: string;
  description?: string | null;
  displayOrder: number;
}

const props = defineProps<{
  isOpen: boolean;
  linkToEdit?: (Partial<LinkPayload> & { id?: string }) | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'link-created', value: any): void;
  (e: 'link-updated', value: any): void;
}>();

const defaultFormData = (): LinkPayload => ({
  title: '',
  url: '',
  description: '',
  displayOrder: 0,
});

const formData = ref<LinkPayload>(defaultFormData());
const errorMessage = ref('');

const isEditMode = computed(() => !!props.linkToEdit?.id);
const dialogTitle = computed(() => (isEditMode.value ? '编辑链接' : '新建链接'));
const submitButtonText = computed(() => (isEditMode.value ? '保存更改' : '创建'));

const handleSubmit = async () => {
      errorMessage.value = '操作失败，请检查网络或联系管理员。';
  const payload: LinkPayload = {
    ...formData.value,
    description: formData.value.description || null,
    displayOrder: parseInt(String(formData.value.displayOrder), 10) || 0,
  };

  try {
    if (isEditMode.value && props.linkToEdit?.id) {
      const response = await apiClient.put(`/admin/links/${props.linkToEdit.id}`, payload);
      emit('link-updated', response.data);
    } else {
      const response = await apiClient.post('/admin/links', payload);
      emit('link-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('操作链接失败:', error);
    if (error.response?.data?.error) {
      errorMessage.value = error.response.data.error;
    } else if (error.response?.data?.details) {
      errorMessage.value = error.response.data.details.map((d: any) => d.message).join('; ');
    } else {
      errorMessage.value = '操作失败，请检查网络或联系管理员。';
    }
  }
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      if (isEditMode.value && props.linkToEdit) {
        formData.value = {
          title: props.linkToEdit.title || '',
          url: props.linkToEdit.url || '',
          description: props.linkToEdit.description || '',
          displayOrder: props.linkToEdit.displayOrder || 0,
        };
      } else {
        resetForm();
      }
    }
  },
);

const closeModal = () => {
  emit('close');
};

const resetForm = () => {
  formData.value = defaultFormData();
      errorMessage.value = '操作失败，请检查网络或联系管理员。';
};
</script>




<style scoped>

/* (复用样式) */

.input-group {

  display: flex;

  flex-direction: column;

}

.input-group label {

  margin-bottom: 0.5rem;

  color: #333;

  font-weight: bold;

  font-size: 0.875rem; /* 14px */

}

.input-group input {

  padding: 0.75rem;

  border: 1px solid #ddd;

  border-radius: 4px;

  font-size: 1rem;

}

.input-group input:disabled {

  background-color: #f3f4f6;

  color: #6b7280;

  cursor: not-allowed;

}

</style>