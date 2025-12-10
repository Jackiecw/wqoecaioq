<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="modal-panel">
              <div class="modal-header">
                <DialogTitle as="h3" class="modal-title">
                  <i :class="isEditMode ? 'pi pi-pencil' : 'pi pi-plus-circle'"></i>
                  {{ isEditMode ? '编辑在售商品' : '上架新商品' }}
                </DialogTitle>
                <button class="close-btn" @click="closeModal">
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <div v-if="isLoading" class="modal-loading">
                <i class="pi pi-spin pi-spinner"></i>
                <span>{{ isLoadingMessage }}</span>
              </div>

              <div v-else class="modal-body">
                <!-- Section 1: 产品选择 -->
                <div class="form-section">
                  <div class="section-title">
                    <i class="pi pi-box"></i>
                    选择产品
                  </div>
                  <div class="field-group">
                    <label>产品（产品目录）<span class="required">*</span></label>
                    <select v-model="formData.productId" class="field-select" :disabled="isEditMode">
                      <option disabled value="">请选择产品...</option>
                      <option v-for="product in allProducts" :key="product.id" :value="product.id">
                        {{ product.sku }} · {{ product.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Section 2: 上架位置 -->
                <div class="form-section">
                  <div class="section-title">
                    <i class="pi pi-map-marker"></i>
                    上架位置
                  </div>
                  <div class="form-row">
                    <div class="field-group">
                      <label>国家<span class="required">*</span></label>
                      <select
                        v-model="selectedCountryCode"
                        class="field-select"
                        :disabled="isEditMode"
                      >
                        <option disabled value="">请选择...</option>
                        <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                          [{{ country.code }}] {{ country.name }}
                        </option>
                      </select>
                    </div>
                    <div class="field-group">
                      <label>店铺<span class="required">*</span></label>
                      <select
                        v-model="formData.storeId"
                        class="field-select"
                        :disabled="isEditMode || filteredStores.length === 0"
                      >
                        <option disabled value="">请选择...</option>
                        <option v-for="store in filteredStores" :key="store.id" :value="store.id">
                          {{ store.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Section 3: 商品信息 -->
                <div class="form-section">
                  <div class="section-title">
                    <i class="pi pi-tag"></i>
                    商品信息
                  </div>
                  <div class="form-row">
                    <div class="field-group field-group--wide">
                      <label>商品标题<span class="required">*</span></label>
                      <input
                        type="text"
                        v-model="formData.storeTitle"
                        class="field-input"
                        placeholder="例如：Vega Pro 官方旗舰店"
                      />
                    </div>
                    <div class="field-group">
                      <label>商品代码<span class="required">*</span></label>
                      <input
                        type="text"
                        v-model="formData.productCode"
                        class="field-input"
                        placeholder="例如：VP-01"
                      />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="field-group">
                      <label>
                        售价
                        <span class="currency-hint">({{ currentCurrencyLabel }})</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        inputmode="decimal"
                        v-model="formData.currentPrice"
                        class="field-input"
                        placeholder="0.00"
                      />
                    </div>
                    <div class="field-group field-group--wide">
                      <label>商品链接<span class="optional">(可选)</span></label>
                      <input
                        type="text"
                        v-model="formData.platformUrl"
                        class="field-input"
                        placeholder="https://shopee.co.id/..."
                      />
                    </div>
                  </div>
                </div>

                <!-- Section 4: 商品图片 -->
                <div class="form-section">
                  <div class="section-title">
                    <i class="pi pi-image"></i>
                    商品主图
                    <span class="optional">({{ isEditMode ? '可替换' : '可选' }})</span>
                  </div>
                  <div class="image-upload-row">
                    <div 
                      class="image-uploader"
                      :class="{ 'has-image': previewUrl }"
                      @click="triggerFileInput"
                    >
                      <img v-if="previewUrl" :src="previewUrl" alt="商品图片" />
                      <div v-else class="upload-placeholder">
                        <i class="pi pi-cloud-upload"></i>
                        <span>点击上传图片</span>
                        <span class="upload-hint">JPG, PNG</span>
                      </div>
                      <input 
                        ref="fileInputRef"
                        type="file" 
                        @change="onFileSelected" 
                        accept="image/png, image/jpeg"
                        class="hidden-input"
                      />
                    </div>
                    <button v-if="previewUrl" class="remove-image-btn" @click="removeImage">
                      <i class="pi pi-trash"></i>
                      移除图片
                    </button>
                  </div>
                </div>

                <p v-if="errorMessage" class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  {{ errorMessage }}
                </p>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="closeModal">
                  取消
                </button>
                <button 
                  type="button" 
                  class="btn-submit" 
                  @click="handleSubmit"
                  :disabled="isLoading"
                >
                  <i :class="isEditMode ? 'pi pi-check' : 'pi pi-upload'"></i>
                  {{ isEditMode ? '保存修改' : '确认上架' }}
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
import useStoreListings from '../../composables/useStoreListings';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  listingToEditId: { type: String, default: null },
});

const emit = defineEmits(['close', 'listing-created', 'listing-updated']);

type ListingProduct = {
  id: string;
  sku?: string;
  name?: string;
};

type CountryOption = { code: string; name: string };

type ListingFormState = {
  productId: string;
  storeId: string;
  storeTitle: string;
  productCode: string;
  currentPrice: number | string;
  platformUrl: string;
};

type OptionPayload = {
  products?: ListingProduct[];
  currencyMap?: Record<string, string>;
};

const defaultFormData = (): ListingFormState => ({
  productId: '',
  storeId: '',
  storeTitle: '',
  productCode: '',
  currentPrice: '',
  platformUrl: '',
});

const formData = ref<ListingFormState>(defaultFormData());
const allProducts = ref<ListingProduct[]>([]);
const currencyMap = ref<Record<string, string>>({});
const selectedCountryCode = ref<string>('');
const isLoading = ref(false);
const isLoadingMessage = ref('');

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const errorMessage = ref<string>('');
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');

const isEditMode = computed(() => !!props.listingToEditId);
const {
  stores,
  fetchStores,
  storesError,
  getStoresByCountry,
} = useStoreListings();

const countryOptions = computed<CountryOption[]>(() => {
  const uniqueCountriesMap = new Map<string, CountryOption>();
  stores.value.forEach((store) => {
    if (store.country) {
      uniqueCountriesMap.set(store.country.code, store.country);
    } else if (store.countryCode) {
      uniqueCountriesMap.set(store.countryCode, {
        code: store.countryCode,
        name: store.country?.name || store.countryCode,
      });
    }
  });
  return Array.from(uniqueCountriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const filteredStores = computed(() => {
  if (!selectedCountryCode.value) return [];
  return getStoresByCountry(selectedCountryCode.value);
});

const currentCurrencyLabel = computed(() => {
  if (!selectedCountryCode.value) return '请选择国家';
  return currencyMap.value[selectedCountryCode.value] || '当地货币';
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const removeImage = () => {
  selectedFile.value = null;
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = null;
};

async function fetchCreateOptions() {
  isLoading.value = true;
  isLoadingMessage.value = '正在加载产品与店铺列表...';
  errorMessage.value = '';
  try {
    await fetchStores();
    const response = await apiClient.get('/admin/store-listings/options');
    applyOptionPayload(response.data);
    if (!selectedCountryCode.value && countryOptions.value.length > 0) {
      selectedCountryCode.value = countryOptions.value[0].code;
    }
    if (!formData.value.productId && allProducts.value.length > 0) {
      formData.value.productId = allProducts.value[0].id;
    }
  } catch (error) {
    console.error('加载选项失败:', error);
    errorMessage.value = '无法加载产品或店铺列表，请重试。';
  } finally {
    isLoading.value = false;
  }
}

async function fetchListingDetails() {
  if (!isEditMode.value) return;
  isLoading.value = true;
  isLoadingMessage.value = '正在加载商品详情...';
  errorMessage.value = '';
  try {
    await fetchStores();
    const [listingRes, optionsRes] = await Promise.all([
      apiClient.get(`/admin/store-listings/${props.listingToEditId}`),
      apiClient.get('/admin/store-listings/options'),
    ]);
    applyOptionPayload(optionsRes.data);

    const listing = listingRes.data;
    selectedCountryCode.value =
      listing.store?.countryCode || listing.store?.country?.code || selectedCountryCode.value || '';

    formData.value = {
      productId: listing.productId,
      storeId: listing.storeId,
      storeTitle: listing.storeTitle || '',
      productCode: listing.productCode || '',
      currentPrice: listing.currentPrice ?? '',
      platformUrl: listing.platformUrl || '',
    };

    if (listing.storeImageUrl) {
      previewUrl.value = `${apiBaseUrl}${listing.storeImageUrl}`;
    }
  } catch (error) {
    console.error('加载详情失败:', error);
    errorMessage.value = '加载此商品详情失败，请关闭后重试。';
  } finally {
    isLoading.value = false;
  }
}

function applyOptionPayload(payload: OptionPayload = {}) {
  allProducts.value = payload.products || [];
  currencyMap.value = payload.currencyMap || {};
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (file) {
    selectedFile.value = file;
    if (previewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);
  }
}

async function handleSubmit() {
  errorMessage.value = '';
  isLoading.value = true;
  isLoadingMessage.value = isEditMode.value ? '正在保存修改...' : '正在上架商品...';

  const payload = new FormData();
  payload.append('storeTitle', formData.value.storeTitle || '');
  payload.append('productCode', formData.value.productCode || '');
  const price = formData.value.currentPrice === '' ? '' : String(formData.value.currentPrice);
  payload.append('currentPrice', price);
  payload.append('platformUrl', formData.value.platformUrl || '');

  if (selectedFile.value) {
    payload.append('storeImageUrl', selectedFile.value);
  }

  try {
    if (isEditMode.value) {
      const response = await apiClient.put(`/admin/store-listings/${props.listingToEditId}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      emit('listing-updated', response.data);
    } else {
      payload.append('productId', formData.value.productId);
      payload.append('storeId', formData.value.storeId);
      const response = await apiClient.post('/admin/store-listings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      emit('listing-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('操作失败:', error);
    if (error.response?.data?.details) {
      errorMessage.value = error.response.data.details.map((d: any) => d.message).join('; ');
    } else {
      errorMessage.value = error.response?.data?.error || '操作失败，请稍后重试。';
    }
  } finally {
    isLoading.value = false;
  }
}

watch(countryOptions, (options) => {
  if (!selectedCountryCode.value && options.length > 0) {
    selectedCountryCode.value = options[0].code;
  }
});

watch(() => storesError.value, (val) => {
  if (val) {
    errorMessage.value = val;
  }
});

watch(selectedCountryCode, () => {
  if (!filteredStores.value.some((store) => store.id === formData.value.storeId)) {
    formData.value.storeId = filteredStores.value[0]?.id || '';
  }
});

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      resetForm();
      if (isEditMode.value) {
        await fetchListingDetails();
      } else {
        await fetchCreateOptions();
      }
    } else {
      if (previewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
      }
    }
  }
);

function closeModal() {
  emit('close');
}

function resetForm() {
  formData.value = defaultFormData();
  selectedFile.value = null;
  previewUrl.value = null;
  errorMessage.value = '';
  isLoadingMessage.value = '';
  selectedCountryCode.value = '';
}
</script>

<style scoped>
/* ========================================
   Store Listing Form Modal - Clean Design
   ======================================== */
.modal-panel {
  width: 100%;
  max-width: 640px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-title i {
  color: var(--color-accent);
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.modal-loading i {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 65vh;
  overflow-y: auto;
}

/* Form Sections */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-title i {
  font-size: 0.875rem;
}

.section-title .optional {
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: none;
  font-size: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* Field Group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-group--wide {
  grid-column: span 1;
}

.field-group label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required {
  color: #ef4444;
  margin-left: 0.125rem;
}

.optional {
  color: var(--color-text-muted);
  font-weight: 400;
  margin-left: 0.25rem;
}

.currency-hint {
  color: var(--color-text-muted);
  font-weight: 400;
  font-size: 0.75rem;
}

.field-input,
.field-select {
  width: 100%;
  height: 40px;
  padding: 0 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.field-input:disabled,
.field-select:disabled {
  background: var(--color-bg-page);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* Image Upload */
.image-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.image-uploader {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-fast);
  background: var(--color-bg-page);
}

.image-uploader:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.image-uploader.has-image {
  border-style: solid;
  border-color: var(--color-border);
}

.image-uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-muted);
  text-align: center;
}

.upload-placeholder i {
  font-size: 1.5rem;
}

.upload-placeholder span {
  font-size: 0.75rem;
}

.upload-hint {
  font-size: 0.625rem !important;
  color: var(--color-text-muted) !important;
}

.hidden-input {
  display: none;
}

.remove-image-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.remove-image-btn:hover {
  background: #fee2e2;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 0.875rem;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.btn-cancel {
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-submit:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .field-group--wide {
    grid-column: span 1;
  }
}
</style>
