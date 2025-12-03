<template>
  <div class="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto space-y-6">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Finance Entry</p>
      <h2 class="text-2xl font-bold text-stone-900 mt-2">录入支出数据</h2>
      <p class="text-sm text-stone-500 mt-1">按模板填写支出信息，方便后续查询与导出。</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="expenseDate" class="form-label">支出日期 *</label>
          <input
            type="date"
            id="expenseDate"
            v-model="formData.expenseDate"
            required
            class="form-input"
          />
        </div>

        <div class="space-y-2">
          <label for="itemDescription" class="form-label">项目描述 *</label>
          <input
            type="text"
            id="itemDescription"
            v-model="formData.itemDescription"
            required
            placeholder="例如：Facebook 广告费"
            class="form-input"
          />
        </div>

        <div class="space-y-2">
          <label for="amount" class="form-label">金额 (CNY) *</label>
          <input
            type="number"
            step="0.01"
            id="amount"
            v-model="formData.amount"
            required
            placeholder="0.00"
            class="form-input"
          />
        </div>

        <div class="space-y-2">
          <label for="payer" class="form-label">付款方</label>
          <input
            type="text"
            id="payer"
            v-model="formData.payer"
            required
            placeholder="例如：公司支付 / 运营A"
            class="form-input"
          />
        </div>

        <div class="space-y-2">
          <label for="payee" class="form-label">收款方</label>
          <input
            type="text"
            id="payee"
            v-model="formData.payee"
            required
            placeholder="例如：Facebook, Google"
            class="form-input"
          />
        </div>

        <div class="space-y-2">
          <label for="paymentMethod" class="form-label">付款方式 *</label>
          <select
            id="paymentMethod"
            v-model="formData.paymentMethod"
            required
            class="form-input"
            :disabled="isLoadingOptions"
          >
            <option disabled value="">请选择...</option>
            <option v-for="opt in financeOptions.paymentMethods" :key="opt" :value="opt">
              {{ paymentMethodMap[opt] || opt }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label for="country" class="form-label">归属国家（可选）</label>
          <select
            id="country"
            v-model="selectedCountry"
            class="form-input"
            :disabled="isLoadingStores"
          >
            <option value="">-- 公司支出（无归属国家） --</option>
            <option v-for="country in countryOptions" :key="country.code" :value="country.code">
              {{ country.name }} ({{ country.code }})
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label for="store" class="form-label">归属店铺（可选）</label>
          <select
            id="store"
            v-model="formData.storeId"
            :disabled="!selectedCountry || storeOptions.length === 0"
            class="form-input disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- 国家级支出（无归属店铺） --</option>
            <option v-for="store in storeOptions" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label for="invoiceStatus" class="form-label">票据状态 *</label>
          <select
            id="invoiceStatus"
            v-model="formData.invoiceStatus"
            required
            class="form-input"
            :disabled="isLoadingOptions"
          >
            <option disabled value="">请选择...</option>
            <option v-for="opt in financeOptions.invoiceStatuses" :key="opt" :value="opt">
              {{ invoiceStatusMap[opt] || opt }}
            </option>
          </select>
        </div>

        <div class="space-y-2 flex items-center pt-6">
          <input
            type="checkbox"
            id="isAdvancePayment"
            v-model="formData.isAdvancePayment"
            class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label for="isAdvancePayment" class="ml-2 font-medium text-stone-700">是否垫付（个人报销）</label>
        </div>

        <div v-if="formData.isAdvancePayment" class="space-y-2">
          <label for="reimbursementDate" class="form-label">预计报销日期</label>
          <input
            type="date"
            id="reimbursementDate"
            v-model="formData.reimbursementDate"
            class="form-input"
          />
        </div>

        <div class="space-y-2 md:col-span-2">
          <label for="notes" class="form-label">备注（可选）</label>
          <textarea
            id="notes"
            rows="3"
            v-model="formData.notes"
            class="form-input"
          ></textarea>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isLoadingStores || isLoadingOptions"
        class="mt-2 inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
      >
        提交支出
      </button>

      <p v-if="successMessage" class="text-green-600 mt-2">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-red-600 mt-2">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import financeService, { ExpensePayload, FinanceOptions, StoreOption } from '@/services/financeService';

const authStore = useAuthStore();

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
const successMessage = ref('');
const errorMessage = ref('');

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
    errorMessage.value = '无法加载店铺选项，请联系管理员。';
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
    errorMessage.value = '无法加载财务选项，请联系管理员。';
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
  successMessage.value = '';
  errorMessage.value = '';

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
    successMessage.value = `支出提交成功 (ID: ${response.id})`;
    formData.value = getDefaultFormData();
    selectedCountry.value = '';
  } catch (error: any) {
    console.error('提交失败:', error?.response || error);
    if (error?.response?.data?.details) {
      errorMessage.value = error.response.data.details.map((d: any) => d.message).join('; ');
    } else if (error?.response?.data?.error) {
      errorMessage.value = error.response.data.error;
    } else {
      errorMessage.value = '提交失败，请检查网络或联系管理员。';
    }
  }
};
</script>

<style scoped>
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: bold;
  font-size: 0.875rem;
}

.form-input {
  display: block;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d4d4d4;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  font-size: 1rem;
}

.form-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
  outline: none;
}
</style>
