<template>
  <div class="finance-form">
    <!-- Step 1: Basic Info -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">1</span>
          <span class="step-label">基本信息</span>
        </div>
        <p class="section-hint">填写支出的基本信息</p>
      </div>

      <div class="fields-grid fields-grid--3col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-calendar"></i>
            支出日期 <span class="required">*</span>
          </label>
          <input 
            type="date" 
            v-model="formData.expenseDate" 
            class="field-input" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-file-edit"></i>
            项目描述 <span class="required">*</span>
          </label>
          <input 
            type="text" 
            v-model="formData.itemDescription" 
            class="field-input" 
            placeholder="例如：Facebook 广告费" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-dollar"></i>
            金额 (CNY) <span class="required">*</span>
          </label>
          <input 
            type="number" 
            step="0.01" 
            v-model="formData.amount" 
            class="field-input field-input--right" 
            placeholder="0.00" 
            required 
          />
        </div>
      </div>
    </div>

    <!-- Step 2: Payment Info -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">2</span>
          <span class="step-label">付款信息</span>
        </div>
        <p class="section-hint">填写付款方、收款方及付款方式</p>
      </div>

      <div class="fields-grid fields-grid--3col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-user"></i>
            付款方
          </label>
          <input 
            type="text" 
            v-model="formData.payer" 
            class="field-input" 
            placeholder="例如：公司支付 / 运营A" 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-building"></i>
            收款方
          </label>
          <input 
            type="text" 
            v-model="formData.payee" 
            class="field-input" 
            placeholder="例如：Facebook, Google" 
          />
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-credit-card"></i>
            付款方式 <span class="required">*</span>
          </label>
          <select 
            v-model="formData.paymentMethod" 
            class="field-select" 
            :disabled="isLoadingOptions"
            required
          >
            <option disabled value="">请选择...</option>
            <option v-for="opt in financeOptions.paymentMethods" :key="opt" :value="opt">
              {{ paymentMethodMap[opt] || opt }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Step 3: Attribution -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">3</span>
          <span class="step-label">归属信息（可选）</span>
        </div>
        <p class="section-hint">选择支出归属的国家和店铺，留空则为公司级支出</p>
      </div>

      <div class="fields-grid fields-grid--2col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-globe"></i>
            归属国家
          </label>
          <select 
            v-model="selectedCountry" 
            class="field-select" 
            :disabled="isLoadingStores"
          >
            <option value="">-- 公司支出（无归属国家） --</option>
            <option v-for="country in countryOptions" :key="country.code" :value="country.code">
              {{ country.name }} ({{ country.code }})
            </option>
          </select>
        </div>

        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-shop"></i>
            归属店铺
          </label>
          <select 
            v-model="formData.storeId" 
            class="field-select" 
            :disabled="!selectedCountry || storeOptions.length === 0"
          >
            <option value="">-- 国家级支出（无归属店铺） --</option>
            <option v-for="store in storeOptions" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Step 4: Invoice & Reimbursement -->
    <div class="form-section">
      <div class="section-header">
        <div class="step-indicator">
          <span class="step-number">4</span>
          <span class="step-label">票据与报销</span>
        </div>
        <p class="section-hint">选择票据状态，如需报销请勾选并填写预计报销日期</p>
      </div>

      <div class="fields-grid fields-grid--3col">
        <div class="field-group">
          <label class="field-label">
            <i class="pi pi-file"></i>
            票据状态 <span class="required">*</span>
          </label>
          <select 
            v-model="formData.invoiceStatus" 
            class="field-select" 
            :disabled="isLoadingOptions"
            required
          >
            <option disabled value="">请选择...</option>
            <option v-for="opt in financeOptions.invoiceStatuses" :key="opt" :value="opt">
              {{ invoiceStatusMap[opt] || opt }}
            </option>
          </select>
        </div>

        <div class="field-group field-group--checkbox">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="formData.isAdvancePayment" 
              class="checkbox-input"
            />
            <span>是否垫付（个人报销）</span>
          </label>
        </div>

        <div v-if="formData.isAdvancePayment" class="field-group">
          <label class="field-label">
            <i class="pi pi-calendar-plus"></i>
            预计报销日期
          </label>
          <input 
            type="date" 
            v-model="formData.reimbursementDate" 
            class="field-input" 
          />
        </div>

        <div :class="['field-group', formData.isAdvancePayment ? '' : 'field-group--span2']">
          <label class="field-label">
            <i class="pi pi-pencil"></i>
            备注（可选）
          </label>
          <textarea 
            v-model="formData.notes" 
            class="field-textarea" 
            rows="2" 
            placeholder="添加备注信息..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Submit Section -->
    <div class="form-actions">
      <div></div>
      <button 
        type="button" 
        class="btn-submit" 
        @click="handleSubmit"
        :disabled="isLoadingStores || isLoadingOptions"
      >
        <i class="pi pi-check"></i>
        提交支出
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import financeService, { ExpensePayload, FinanceOptions, StoreOption } from '@/services/financeService';

const authStore = useAuthStore();
const toast = useToast();

const paymentMethodMap: Record<string, string> = {
  ALIPAY: '支付宝',
  WECHAT_PAY: '微信支付',
  BANK_TRANSFER: '银行转账',
  CREDIT_CARD: '信用卡',
  CASH: '现金',
  OTHER: '其他',
};

const invoiceStatusMap: Record<string, string> = {
  NONE: '无票',
  REGULAR: '普票',
  SPECIAL: '专票',
};

const getDefaultFormData = (): ExpensePayload => ({
  expenseDate: new Date().toISOString().split('T')[0],
  itemDescription: '',
  amount: 0,
  paymentMethod: 'OTHER',
  payer: '',
  payee: '',
  invoiceStatus: 'NONE',
  isAdvancePayment: false,
  reimbursementDate: null,
  storeId: '',
  notes: '',
});

const formData = ref<ExpensePayload>(getDefaultFormData());
const financeOptions = ref<FinanceOptions>({ paymentMethods: [], invoiceStatuses: [] });
const allStores = ref<StoreOption[]>([]);
const isLoadingOptions = ref(true);
const isLoadingStores = ref(true);
const selectedCountry = ref<string>('');

const countryOptions = computed(() => {
  const map = new Map<string, StoreOption['country']>();
  allStores.value.forEach((store) => {
    if (store.country) {
      map.set(store.country.code, store.country);
    }
  });
  const allCountries = Array.from(map.values()).sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  if (authStore.role === 'admin') return allCountries.filter(Boolean) as { code: string; name: string }[];
  const userCountryCodes = authStore.operatedCountries || [];
  return allCountries.filter((c): c is { code: string; name: string } => !!c && userCountryCodes.includes(c.code));
});

const storeOptions = computed(() =>
  allStores.value
    .filter((store) => selectedCountry.value ? store.countryCode === selectedCountry.value : true)
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const fetchStores = async () => {
  isLoadingStores.value = true;
  try {
    allStores.value = await financeService.getStores();
  } catch (error) {
    console.error('加载店铺列表失败:', error);
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法加载店铺选项，请联系管理员。', life: 5000 });
  } finally {
    isLoadingStores.value = false;
  }
};

const fetchFinanceOptions = async () => {
  isLoadingOptions.value = true;
  try {
    financeOptions.value = await financeService.getOptions();
  } catch (error) {
    console.error('获取财务选项失败:', error);
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法加载财务选项，请联系管理员。', life: 5000 });
  } finally {
    isLoadingOptions.value = false;
  }
};

onMounted(() => {
  fetchStores();
  fetchFinanceOptions();
});

watch(selectedCountry, () => {
  formData.value.storeId = '';
});

watch(
  () => formData.value.isAdvancePayment,
  (isAdvance) => {
    if (!isAdvance) {
      formData.value.reimbursementDate = null;
    }
  },
);

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toISOString().split('T')[0];
};

const handleSubmit = async () => {
  const payload: ExpensePayload = {
    ...formData.value,
    amount: Number(formData.value.amount) || 0,
    storeId: formData.value.storeId || null,
    notes: formData.value.notes || null,
    reimbursementDate: normalizeDate(formData.value.reimbursementDate),
    expenseDate: normalizeDate(formData.value.expenseDate) || new Date().toISOString().split('T')[0],
  };

  try {
    const response = await financeService.createExpense(payload);
    toast.add({
      severity: 'success',
      summary: '提交成功',
      detail: `支出已成功录入 (ID: ${response.id})`,
      life: 4000,
    });
    formData.value = getDefaultFormData();
    selectedCountry.value = '';
  } catch (error: any) {
    console.error('提交失败:', error?.response || error);
    let errorMsg = '提交失败，请检查网络或联系管理员。';
    if (error?.response?.data?.details) {
      errorMsg = error.response.data.details.map((d: any) => d.message).join('; ');
    } else if (error?.response?.data?.error) {
      errorMsg = error.response.data.error;
    }
    toast.add({
      severity: 'error',
      summary: '提交失败',
      detail: errorMsg,
      life: 5000,
    });
  }
};
</script>

<style scoped>
/* ========================================
   Finance Form - Clean Modern Design
   ======================================== */
.finance-form {
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

/* Fields Grid */
.fields-grid {
  display: grid;
  gap: 1rem;
}

.fields-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.fields-grid--3col {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 1024px) {
  .fields-grid--3col {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .fields-grid--2col,
  .fields-grid--3col {
    grid-template-columns: 1fr;
  }
}

/* Field Group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group--span2 {
  grid-column: span 2;
}

.field-group--checkbox {
  justify-content: center;
  padding-top: 1.5rem;
}

@media (max-width: 640px) {
  .field-group--span2 {
    grid-column: span 1;
  }
  .field-group--checkbox {
    padding-top: 0;
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

.field-input--right {
  text-align: right;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  accent-color: var(--color-accent);
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

.btn-submit:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
