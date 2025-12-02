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
              
              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div v-if="isLoadingOptions" class="col-span-2 text-stone-500">
                  正在加载表单选项...
                </div>

                <template v-if="!isLoadingOptions">
                  <div class="input-group col-span-2">
                    <label for="name">店铺名称 (易读) *</label>
                    <input 
                      type="text" 
                      id="name" 
                      v-model="formData.name"
                      placeholder="例如: Shopee 印尼 Mall 店"
                    />
                  </div>

                  <div class="input-group">
                    <label for="platform">平台 *</label>
                    <select id="platform" v-model="formData.platform">
                      <option disabled value="">请选择...</option>
                      <option v-for="opt in options.platforms" :key="opt" :value="opt">
                        {{ opt }}
                      </option>
                    </select>
                  </div>

                  <div class="input-group">
                    <label for="country">国家 *</label>
                    <select id="country" v-model="formData.countryCode">
                      <option disabled value="">请选择...</option>
                      <option v-for="opt in countriesList" :key="opt.code" :value="opt.code">
                        {{ opt.name }} ({{ opt.code }})
                      </option>
                    </select>
                  </div>

                  <div class="input-group">
                    <label for="status">状态*</label>
                    <select id="status" v-model="formData.status">
                      <option disabled value="">请选择...</option>
                      <option v-for="opt in options.storeStatuses" :key="opt" :value="opt">
                        {{ opt }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="input-group">
                    <label for="registeredAt">注册日期</label>
                    <input 
                      type="date" 
                      id="registeredAt" 
                      v-model="formData.registeredAt"
                    />
                  </div>

                  <div class="input-group col-span-2">
                    <label for="platformStoreId">平台店铺 ID (可选)</label>
                    <input 
                      type="text" 
                      id="platformStoreId" 
                      v-model="formData.platformStoreId"
                      placeholder="例如: 123456789"
                    />
                  </div>
                </template>
                
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
                  :disabled="isLoadingOptions"
                  class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300"
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

<script setup>
import { ref, watch, computed } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import apiClient from '../../api';

// --- 1. Props & Emits ---
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  storeToEditId: {
    type: String,
    default: null,
  }
});
const emit = defineEmits(['close', 'store-created', 'store-updated']);

// --- 2. Internal State ---
const defaultFormData = () => ({
  name: '',
  platform: '',
  countryCode: '',
  status: 'ACTIVE',
  platformStoreId: '',
  registeredAt: null,
});

const formData = ref(defaultFormData());
const errorMessage = ref('');
const isLoadingOptions = ref(false);

// Options
const options = ref({
  platforms: [],
  storeStatuses: [],
});
const countriesList = ref([]);

// --- 3. Computed Properties ---
const isEditMode = computed(() => !!props.storeToEditId);
const dialogTitle = computed(() => isEditMode.value ? '编辑店铺' : '新建店铺');
const submitButtonText = computed(() => isEditMode.value ? '保存' : '创建');

// --- 4. Methods ---

// Fetch dropdown options (Platforms, Statuses)
async function fetchOptions() {
  try {
    const response = await apiClient.get('/admin/management-options');
    options.value = response.data;
  } catch (error) {
    console.error('Failed to fetch options:', error);
    errorMessage.value = '加载选项失败，请刷新重试';
  }
}

// Fetch available countries
async function fetchCountries() {
  try {
    const response = await apiClient.get('/admin/countries');
    countriesList.value = response.data;
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    errorMessage.value = '加载国家列表失败';
  }
}

// Fetch store details for editing
async function fetchStoreDetails(id) {
  isLoadingOptions.value = true;
  try {
    const response = await apiClient.get(`/admin/stores/${id}`);
    const store = response.data;
    
    // Populate form
    formData.value = {
      name: store.name,
      platform: store.platform,
      countryCode: store.countryCode,
      status: store.status,
      platformStoreId: store.platformStoreId || '',
      registeredAt: store.registeredAt ? store.registeredAt.split('T')[0] : null,
    };
  } catch (error) {
    console.error('Failed to fetch store details:', error);
    errorMessage.value = '加载店铺详情失败';
  } finally {
    isLoadingOptions.value = false;
  }
}

// Handle Form Submission
async function handleSubmit() {
  errorMessage.value = '';
  
  // Basic Validation
  if (!formData.value.name || !formData.value.platform || !formData.value.countryCode) {
    errorMessage.value = '请填写所有必填项 (*)。';
    return;
  }

  // Prepare payload
  const payload = { ...formData.value };
  
  // Format registeredAt to ISO string if present
  if (payload.registeredAt) {
    payload.registeredAt = new Date(payload.registeredAt).toISOString();
  } else {
    payload.registeredAt = null;
  }

  // Handle empty platformStoreId
  if (!payload.platformStoreId) {
    payload.platformStoreId = null;
  }

  try {
    if (isEditMode.value) {
      await apiClient.put(`/admin/stores/${props.storeToEditId}`, payload);
      emit('store-updated');
    } else {
      await apiClient.post('/admin/stores', payload);
      emit('store-created');
    }
    closeModal();
  } catch (error) {
    console.error('Operation failed:', error);
    errorMessage.value = error.response?.data?.error || '操作失败，请重试。';
  }
}

function closeModal() {
  emit('close');
  // Reset form after a short delay to allow transition to finish
  setTimeout(() => {
    formData.value = defaultFormData();
    errorMessage.value = '';
  }, 300);
}

// --- 5. Watchers ---

// Initialize when modal opens
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    isLoadingOptions.value = true;
    errorMessage.value = '';
    
    // Load options if not already loaded
    if (options.value.platforms.length === 0) {
      await Promise.all([fetchOptions(), fetchCountries()]);
    }

    // If edit mode, fetch details
    if (props.storeToEditId) {
      await fetchStoreDetails(props.storeToEditId);
    } else {
      // Reset for new store
      formData.value = defaultFormData();
    }
    
    isLoadingOptions.value = false;
  }
});
</script>

<style scoped>
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
.input-group input,
.input-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
</style>