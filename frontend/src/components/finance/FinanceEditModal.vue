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
            <DialogPanel class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                修改支出数据
              </DialogTitle>

              <div v-if="loadingState.initial" class="mt-4 p-6 text-center text-stone-500">
                正在加载表单选项...
              </div>

              <form v-else @submit.prevent="handleSubmit" class="mt-4 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label for="edit_expenseDate" class="form-label">支出日期 *</label>
                    <input type="date" id="edit_expenseDate" v-model="formData.expenseDate" required class="form-input" />
                  </div>

                  <div class="space-y-2">
                    <label for="edit_itemDescription" class="form-label">项目描述 *</label>
                    <input type="text" id="edit_itemDescription" v-model="formData.itemDescription" required class="form-input" />
                  </div>

                  <div class="space-y-2">
                    <label for="edit_amount" class="form-label">金额 (CNY) *</label>
                    <input type="number" step="0.01" id="edit_amount" v-model="formData.amount" required class="form-input" />
                  </div>

                  <div class="space-y-2">
                    <label for="edit_payer" class="form-label">付款方</label>
                    <input type="text" id="edit_payer" v-model="formData.payer" required class="form-input" />
                  </div>

                  <div class="space-y-2">
                    <label for="edit_payee" class="form-label">收款方</label>
                    <input type="text" id="edit_payee" v-model="formData.payee" required class="form-input" />
                  </div>

                  <div class="space-y-2">
                    <label for="edit_paymentMethod" class="form-label">付款方式 *</label>
                    <select id="edit_paymentMethod" v-model="formData.paymentMethod" required class="form-input">
                      <option v-for="opt in financeOptions.paymentMethods" :key="opt" :value="opt">
                        {{ paymentMethodMap[opt] || opt }}
                      </option>
                    </select>
                  </div>

                  <div class="space-y-2">
                    <label for="edit_country" class="form-label">归属国家（可选）</label>
                    <select id="edit_country" v-model="selectedCountry" class="form-input">
                      <option value="">-- 公司支出（无归属国家） --</option>
                      <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                        {{ country.name }} ({{ country.code }})
                      </option>
                    </select>
                  </div>

                  <div class="space-y-2">
                    <label for="edit_store" class="form-label">归属店铺（可选）</label>
                    <select
                      id="edit_store"
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
                    <label for="edit_invoiceStatus" class="form-label">票据状态 *</label>
                    <select id="edit_invoiceStatus" v-model="formData.invoiceStatus" required class="form-input">
                      <option v-for="opt in financeOptions.invoiceStatuses" :key="opt" :value="opt">
                        {{ invoiceStatusMap[opt] || opt }}
                      </option>
                    </select>
                  </div>

                  <div class="space-y-2 flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="edit_isAdvancePayment"
                      v-model="formData.isAdvancePayment"
                      class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label for="edit_isAdvancePayment" class="ml-2 font-medium text-stone-700">是否垫付（个人报销）</label>
                  </div>

                  <div v-if="formData.isAdvancePayment" class="space-y-2">
                    <label for="edit_reimbursementDate" class="form-label">预计报销日期</label>
                    <input type="date" id="edit_reimbursementDate" v-model="formData.reimbursementDate" class="form-input" />
                  </div>

                  <div class="space-y-2 md:col-span-2">
                    <label for="edit_notes" class="form-label">备注（可选）</label>
                    <textarea id="edit_notes" rows="3" v-model="formData.notes" class="form-input"></textarea>
                  </div>
                </div>

                <div class="flex justify-end space-x-3">
                  <button
                    type="button"
                    class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    @click="closeModal"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    :disabled="loadingState.submit"
                    class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                  >
                    {{ loadingState.submit ? '保存中...' : '保存' }}
                  </button>
                </div>

                <p v-if="successMessage" class="text-green-600 text-sm">{{ successMessage }}</p>
                <p v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</p>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import financeService, { ExpensePayload, ExpenseRecord, FinanceOptions, StoreOption } from '@/services/financeService';

const props = defineProps<{
  isOpen: boolean;
  expenseToEdit: ExpenseRecord | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'expense-updated', value: ExpenseRecord): void;
}>();

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

const financeOptions = ref<FinanceOptions>({ paymentMethods: [], invoiceStatuses: [] });
const allStores = ref<StoreOption[]>([]);
const selectedCountry = ref<string>('');
const formData = ref<ExpensePayload>({
  expenseDate: '',
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

const loadingState = ref({ initial: true, submit: false });
const successMessage = ref('');
const errorMessage = ref('');

const countryOptions = computed(() => {
  const map = new Map<string, StoreOption['country']>();
  allStores.value.forEach((store) => {
    if (store.country) map.set(store.country.code, store.country);
  });
  return Array.from(map.values()).filter(Boolean) as { code: string; name: string }[];
});

const storeOptions = computed(() =>
  allStores.value
    .filter((store) => (selectedCountry.value ? store.countryCode === selectedCountry.value : true))
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toISOString().split('T')[0];
};

const hydrateForm = () => {
  if (!props.expenseToEdit) return;
  const expense = props.expenseToEdit;
  formData.value = {
    expenseDate: normalizeDate(expense.expenseDate) || '',
    itemDescription: expense.itemDescription,
    amount: Number(expense.amount) || 0,
    paymentMethod: expense.paymentMethod,
    payer: expense.payer,
    payee: expense.payee,
    invoiceStatus: expense.invoiceStatus,
    isAdvancePayment: !!expense.isAdvancePayment,
    reimbursementDate: normalizeDate((expense as any).reimbursementDate),
    storeId: (expense as any).storeId || expense.store?.id || '',
    notes: (expense as any).notes || '',
  };
  selectedCountry.value = expense.store?.countryCode || expense.store?.country?.code || '';
};

const fetchOptions = async () => {
  loadingState.value.initial = true;
  try {
    const [stores, options] = await Promise.all([financeService.getStores(), financeService.getOptions()]);
    allStores.value = stores;
    financeOptions.value = options;
  } catch (error) {
    console.error('加载编辑选项失败:', error);
    errorMessage.value = '无法加载表单选项，请稍后重试。';
  } finally {
    loadingState.value.initial = false;
  }
};

onMounted(() => {
  fetchOptions();
});

watch(
  () => props.expenseToEdit,
  () => {
    hydrateForm();
  },
  { immediate: true },
);

watch(
  () => formData.value.isAdvancePayment,
  (isAdvance) => {
    if (!isAdvance) {
      formData.value.reimbursementDate = null;
    }
  },
);

watch(selectedCountry, () => {
  formData.value.storeId = '';
});

const handleSubmit = async () => {
  if (!props.expenseToEdit) return;
  loadingState.value.submit = true;
  successMessage.value = '';
  errorMessage.value = '';

  const payload: ExpensePayload = {
    ...formData.value,
    amount: Number(formData.value.amount) || 0,
    expenseDate: normalizeDate(formData.value.expenseDate) || '',
    reimbursementDate: normalizeDate(formData.value.reimbursementDate),
    storeId: formData.value.storeId || null,
    notes: formData.value.notes || null,
  };

  try {
    const updated = await financeService.updateExpense(props.expenseToEdit.id, payload);
    successMessage.value = '保存成功';
    emit('expense-updated', updated);
    closeModal();
  } catch (error: any) {
    console.error('保存失败:', error);
    errorMessage.value = error?.response?.data?.error || '保存失败，请重试';
  } finally {
    loadingState.value.submit = false;
  }
};

const closeModal = () => {
  emit('close');
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
