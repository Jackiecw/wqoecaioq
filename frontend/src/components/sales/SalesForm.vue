<template>
  <div class="sales-form">
    <!-- Step 1: Select Product -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">1</span>
          <span class="step-label">选择商品</span>
        </div>
        <p class="section-hint">依次选择平台、店铺，然后选择要录入销售数据的商品链接</p>
      </div>

      <div v-if="!selectedCountry" class="country-warning">
        <i class="pi pi-info-circle"></i>
        <span>请先在上方选择国家</span>
      </div>

      <div v-else class="fields-grid fields-grid--3col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-desktop"></i>
            平台 <span class="required">*</span>
          </label>
          <select v-model="selectedPlatform" class="field-select" :disabled="!selectedCountry">
            <option disabled value="">请选择平台...</option>
            <option v-for="platform in platformOptions" :key="platform" :value="platform">
              {{ platform }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-shop"></i>
            店铺 <span class="required">*</span>
          </label>
          <select v-model="selectedStoreId" class="field-select" :disabled="!selectedPlatform">
            <option disabled value="">请选择店铺...</option>
            <option v-for="store in storeOptions" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>

        <div class="field-group field-group--full">
          <label class="field-label">
            <i class="pi pi-link"></i>
            商品链接 (Listing) <span class="required">*</span>
            <span class="field-hint">格式: [商品代码] 标题 (SKU)</span>
          </label>
          <select 
            v-model="selectedListingId" 
            class="field-select" 
            :disabled="!selectedStoreId || isLoadingListings"
          >
            <option disabled value="">
              {{ isLoadingListings ? '加载链接中...' : '请选择具体链接...' }}
            </option>
            <option v-for="listing in storeListings" :key="listing.id" :value="listing.id">
              <template v-if="listing.productCode">[{{ listing.productCode }}]</template>
              {{ listing.storeTitle || '未命名链接' }} ({{ listing.product.sku }})
            </option>
          </select>
          <p v-if="storeListings.length === 0 && selectedStoreId && !isLoadingListings" class="field-error">
            <i class="pi pi-exclamation-triangle"></i>
            该店铺下暂无上架商品，请先去「店铺在售」板块上架。
          </p>
        </div>
      </div>
    </div>

    <!-- Step 2: Order Details -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">2</span>
          <span class="step-label">订单信息</span>
        </div>
        <p class="section-hint">填写订单的基本信息</p>
      </div>

      <div class="fields-grid fields-grid--4col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-calendar"></i>
            记录日期 <span class="required">*</span>
          </label>
          <input 
            type="date" 
            v-model="formOtherData.recordDate" 
            class="field-input" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-hashtag"></i>
            平台订单号 <span class="required">*</span>
          </label>
          <input 
            type="text" 
            v-model="formOtherData.platformOrderId" 
            class="field-input" 
            placeholder="例: 230101ABC..." 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-box"></i>
            销量 <span class="required">*</span>
          </label>
          <input 
            type="number" 
            v-model="formOtherData.salesVolume" 
            class="field-input" 
            placeholder="0" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-dollar"></i>
            销售额 <span class="required">*</span>
          </label>
          <div class="input-with-suffix">
            <input 
              type="number" 
              step="0.01" 
              v-model="formOtherData.revenue" 
              class="field-input field-input--currency" 
              placeholder="0.00" 
              required 
            />
            <span class="input-suffix">{{ formOtherData.currency || 'CNY' }}</span>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-tag"></i>
            订单状态 <span class="required">*</span>
          </label>
          <select v-model="formOtherData.orderStatus" class="field-select" required>
            <option value="" disabled>请选择状态...</option>
            <option v-for="status in orderStatusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <div class="field-group field-group--span3">
          <label class="field-label">
            <i class="pi pi-pencil"></i>
            备注 (可选)
          </label>
          <textarea 
            v-model="formOtherData.notes" 
            class="field-textarea" 
            rows="2" 
            placeholder="添加备注信息..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Submit Section -->
    <div class="form-actions">
      <div class="form-messages">
        <p v-if="successMessage" class="message message--success">
          <i class="pi pi-check-circle"></i>
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="message message--error">
          <i class="pi pi-times-circle"></i>
          {{ errorMessage }}
        </p>
      </div>
      <button type="button" class="btn-submit" @click="handleSubmit">
        <i class="pi pi-check"></i>
        提交录入
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import useStoreListings from '../../composables/useStoreListings';
import apiClient from '@/services/apiClient';

const props = defineProps({
  selectedCountry: String
});

const {
  fetchStores,
  storesLoading,
  storesError,
  getStoresByCountry,
  getStoresByCountryAndPlatform,
  permittedCountries,
  fetchListings,
} = useStoreListings();
const isLoadingStores = storesLoading;

// const selectedCountry = ref(''); // Removed, using prop
const selectedPlatform = ref('');
const selectedStoreId = ref('');
const selectedListingId = ref('');
const storeListings = ref([]);
const isLoadingListings = ref(false);

const formOtherData = ref({
  recordDate: new Date().toISOString().split('T')[0],
  salesVolume: null,
  revenue: null,
  currency: 'CNY',
  notes: '',
  platformOrderId: '',
  orderStatus: ''
});

const successMessage = ref('');
const errorMessage = ref('');

onMounted(() => {
  fetchStores();
});

watch(() => storesError.value, (val) => {
  if (val) {
    errorMessage.value = val;
  }
});

const platformOptions = computed(() => {
  if (!props.selectedCountry) return [];
  const platforms = getStoresByCountry(props.selectedCountry).map((store) => store.platform);
  return [...new Set(platforms)].sort();
});

const storeOptions = computed(() => {
  if (!props.selectedCountry || !selectedPlatform.value) return [];
  return getStoresByCountryAndPlatform(props.selectedCountry, selectedPlatform.value).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
});

const currencyMap = {
  'ID': 'IDR',
  'TH': 'THB',
  'VN': 'VND',
  'MY': 'MYR',
  'PH': 'PHP',
  'SG': 'SGD',
  'OTHER': 'USD'
};

const orderStatusOptions = [
  'Completed',
  'Pending',
  'Cancelled',
  'Refunded',
  'Returned'
];

watch(() => props.selectedCountry, (newVal) => {
  selectedPlatform.value = '';
  selectedStoreId.value = '';
  selectedListingId.value = '';
  storeListings.value = [];
  
  if (newVal && currencyMap[newVal]) {
    formOtherData.value.currency = currencyMap[newVal];
  } else {
    formOtherData.value.currency = 'USD';
  }
});

watch(selectedPlatform, () => {
  selectedStoreId.value = '';
  selectedListingId.value = '';
  storeListings.value = [];
});

watch(selectedStoreId, async (newStoreId) => {
  selectedListingId.value = '';
  storeListings.value = [];
  errorMessage.value = '';

  if (!newStoreId) return;

  isLoadingListings.value = true;
  try {
    storeListings.value = await fetchListings(newStoreId);
  } catch (error) {
    console.error('获取链接失败:', error);
    errorMessage.value = error.message || '获取链接失败，请稍后重试';
  } finally {
    isLoadingListings.value = false;
  }
});

const handleSubmit = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!selectedStoreId.value || !selectedListingId.value) {
    errorMessage.value = '请选择店铺和商品链接';
    return;
  }

  const targetListing = storeListings.value.find((l) => l.id === selectedListingId.value);
  if (!targetListing) {
    errorMessage.value = '未找到目标商品';
    return;
  }

  const payload = {
    ...formOtherData.value,
    storeId: selectedStoreId.value,
    listingId: selectedListingId.value,
    productId: targetListing.product.id,
    salesVolume: parseInt(formOtherData.value.salesVolume, 10) || 0,
    revenue: parseFloat(formOtherData.value.revenue) || 0,
    currency: formOtherData.value.currency || 'CNY',
    notes: formOtherData.value.notes || null,
    platformOrderId: formOtherData.value.platformOrderId || null,
    orderStatus: formOtherData.value.orderStatus || null,
  };

  if (!payload.platformOrderId || !payload.orderStatus) {
      errorMessage.value = '请填写平台订单号和订单状态';
      return;
  }

  try {
    const response = await apiClient.post('/sales', payload);
    successMessage.value = `录入成功！ID: ${response.data.id}`;

    formOtherData.value.salesVolume = null;
    formOtherData.value.revenue = null;
  } catch (error) {
    console.error('录入失败:', error.response);
    if (error.response && error.response.data.error) {
      errorMessage.value = error.response.data.error;
    } else {
      errorMessage.value = '录入失败，请检查网络或联系管理员';
    }
  }
};
</script>

<style scoped>
/* ========================================
   Sales Form - Clean Modern Design
   ======================================== */
.sales-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.step-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  padding-left: 2.5rem;
}

/* Country Warning */
.country-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: var(--radius-md);
  color: #92400e;
  font-size: 0.9375rem;
  font-weight: 500;
}

.country-warning i {
  font-size: 1.125rem;
}

/* Fields Grid */
.fields-grid {
  display: grid;
  gap: 1rem;
}

.fields-grid--3col {
  grid-template-columns: repeat(2, 1fr);
}

.fields-grid--4col {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1024px) {
  .fields-grid--3col,
  .fields-grid--4col {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .fields-grid--3col,
  .fields-grid--4col {
    grid-template-columns: 1fr;
  }
}

/* Field Group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group--full {
  grid-column: 1 / -1;
}

.field-group--span3 {
  grid-column: span 3;
}

@media (max-width: 640px) {
  .field-group--span3 {
    grid-column: span 1;
  }
}

.field-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-label i {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.field-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.required {
  color: #ef4444;
}

/* Inputs */
.field-input,
.field-select,
.field-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.field-input:disabled,
.field-select:disabled,
.field-textarea:disabled {
  background: var(--color-bg-page);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: var(--color-text-muted);
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

/* Input with suffix */
.input-with-suffix {
  position: relative;
}

.field-input--currency {
  padding-right: 3.5rem;
  text-align: right;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 1rem;
  font-weight: 600;
}

.input-suffix {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Field Error */
.field-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #ef4444;
  margin: 0;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.form-messages {
  flex: 1;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  margin: 0;
}

.message--success {
  color: #10b981;
}

.message--error {
  color: #ef4444;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-submit:hover {
  filter: brightness(0.95);
}

.btn-submit:active {
  transform: scale(0.98);
}
</style>

