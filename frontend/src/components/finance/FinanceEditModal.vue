<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="修改支出数据"
    :style="{ width: '720px' }"
    class="finance-edit-modal"
    @hide="closeModal"
  >
    <div v-if="loadingState.initial" class="p-5 text-center text-color-secondary">正在加载表单选项...</div>

    <div v-else class="flex flex-column gap-3">
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
      <Message v-if="successMessage" severity="success" :closable="false">{{ successMessage }}</Message>

      <div class="grid formgrid p-fluid">
        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">支出日期 *</label>
          <Calendar v-model="formData.expenseDate" show-icon date-format="yy-mm-dd" class="w-full" />
        </div>
        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">项目描述 *</label>
          <InputText v-model="formData.itemDescription" class="w-full" />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">金额 (CNY) *</label>
          <InputNumber
            v-model="formData.amount"
            mode="decimal"
            :min="0"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">付款方式 *</label>
          <Dropdown
            v-model="formData.paymentMethod"
            :options="paymentMethodOptions"
            option-label="label"
            option-value="value"
            placeholder="请选择"
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">付款人 *</label>
          <InputText v-model="formData.payer" class="w-full" />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">收款人 *</label>
          <InputText v-model="formData.payee" class="w-full" />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">票据状态 *</label>
          <Dropdown
            v-model="formData.invoiceStatus"
            :options="invoiceStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="请选择"
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6 flex align-items-center gap-2 mt-4">
          <Checkbox v-model="formData.isAdvancePayment" binary input-id="advancePayment" />
          <label for="advancePayment" class="font-semibold text-sm text-color">是否垫付（个人报销）</label>
        </div>

        <div v-if="formData.isAdvancePayment" class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">预计报销日期</label>
          <Calendar v-model="formData.reimbursementDate" show-icon date-format="yy-mm-dd" class="w-full" />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">归属国家（可选）</label>
          <Dropdown
            v-model="selectedCountry"
            :options="countryOptions"
            option-label="name"
            option-value="code"
            placeholder="公司支出（无归属国家）"
            show-clear
            filter
            class="w-full"
          />
        </div>

        <div class="field col-12 md:col-6">
          <label class="font-semibold text-sm mb-2 block">归属店铺（可选）</label>
          <Dropdown
            v-model="formData.storeId"
            :options="storeOptions"
            option-label="name"
            option-value="id"
            placeholder="国家级支出（无归属店铺）"
            show-clear
            filter
            :disabled="storeOptions.length === 0"
            class="w-full"
          />
        </div>

        <div class="field col-12">
          <label class="font-semibold text-sm mb-2 block">备注（可选）</label>
          <Textarea v-model="formData.notes" rows="3" auto-resize class="w-full" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" :loading="loadingState.submit" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import financeService, { type ExpensePayload, type ExpenseRecord, type StoreOption } from '@/services/financeService';

type FinanceOptionItem = { label: string; value: string };

type FinanceOptions = {
  paymentMethods: string[];
  invoiceStatuses: string[];
};

type FormState = {
  expenseDate: Date | null;
  itemDescription: string;
  amount: number;
  paymentMethod: string;
  payer: string;
  payee: string;
  invoiceStatus: string;
  isAdvancePayment: boolean;
  reimbursementDate: Date | null;
  storeId: string | null;
  notes: string;
};

const props = defineProps<{
  isOpen: boolean;
  expenseToEdit: ExpenseRecord | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'expense-updated', payload: ExpenseRecord): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const loadingState = ref({ initial: false, submit: false });
const errorMessage = ref('');
const successMessage = ref('');
const financeOptions = ref<FinanceOptions>({ paymentMethods: [], invoiceStatuses: [] });
const allStores = ref<StoreOption[]>([]);
const selectedCountry = ref<string | null>(null);

const formData = ref<FormState>({
  expenseDate: null,
  itemDescription: '',
  amount: 0,
  paymentMethod: '',
  payer: '',
  payee: '',
  invoiceStatus: '',
  isAdvancePayment: false,
  reimbursementDate: null,
  storeId: null,
  notes: '',
});

const countryOptions = computed(() => {
  const unique = new Map<string, { code: string; name: string }>();
  allStores.value.forEach((store) => {
    if (store.country) {
      unique.set(store.country.code, store.country);
    }
  });
  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const storeOptions = computed(() => {
  let list = allStores.value;
  if (selectedCountry.value) {
    list = list.filter((store) => store.countryCode === selectedCountry.value);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
});

const paymentMethodOptions = computed<FinanceOptionItem[]>(() =>
  financeOptions.value.paymentMethods?.map((value) => ({
    value,
    label: paymentMethodMap[value] || value,
  })) ?? [],
);

const invoiceStatusOptions = computed<FinanceOptionItem[]>(() =>
  financeOptions.value.invoiceStatuses?.map((value) => ({
    value,
    label: invoiceStatusMap[value] || value,
  })) ?? [],
);

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

const normalizeDate = (value?: string | Date | null) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.setHours(0, 0, 0, 0));
};

const formatDate = (value: Date | null) => {
  if (!value) return null;
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const hydrateForm = () => {
  if (!props.expenseToEdit) return;
  const expense = props.expenseToEdit;
  formData.value = {
    expenseDate: normalizeDate(expense.expenseDate),
    itemDescription: expense.itemDescription,
    amount: Number(expense.amount) || 0,
    paymentMethod: expense.paymentMethod,
    payer: expense.payer,
    payee: expense.payee,
    invoiceStatus: expense.invoiceStatus,
    isAdvancePayment: !!expense.isAdvancePayment,
    reimbursementDate: normalizeDate((expense as any).reimbursementDate),
    storeId: (expense as any).storeId || expense.store?.id || null,
    notes: (expense as any).notes || '',
  };
  selectedCountry.value = expense.store?.countryCode || expense.store?.country?.code || null;
};

const fetchOptions = async () => {
  loadingState.value.initial = true;
  errorMessage.value = '';
  try {
    const [stores, options] = await Promise.all([financeService.getStores(), financeService.getOptions()]);
    allStores.value = stores || [];
    financeOptions.value = {
      paymentMethods: options.paymentMethods || [],
      invoiceStatuses: options.invoiceStatuses || [],
    };
  } catch (error) {
    console.error('加载编辑选项失败:', error);
    errorMessage.value = '无法加载表单选项，请稍后重试。';
  } finally {
    loadingState.value.initial = false;
  }
};

const handleSubmit = async () => {
  if (!props.expenseToEdit) return;
  loadingState.value.submit = true;
  successMessage.value = '';
  errorMessage.value = '';

  const payload: ExpensePayload = {
    expenseDate: formatDate(formData.value.expenseDate) || '',
    itemDescription: formData.value.itemDescription.trim(),
    amount: Number(formData.value.amount) || 0,
    paymentMethod: formData.value.paymentMethod,
    payer: formData.value.payer.trim(),
    payee: formData.value.payee.trim(),
    invoiceStatus: formData.value.invoiceStatus,
    isAdvancePayment: formData.value.isAdvancePayment,
    reimbursementDate: formatDate(formData.value.reimbursementDate),
    storeId: formData.value.storeId || null,
    notes: formData.value.notes.trim() || null,
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

watch(
  () => props.expenseToEdit,
  () => {
    hydrateForm();
  },
  { immediate: true },
);

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      fetchOptions();
    }
  },
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
  formData.value.storeId = null;
});
</script>
