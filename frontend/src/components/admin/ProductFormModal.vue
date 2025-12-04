<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '760px' }"
    :header="dialogTitle"
    class="product-form-modal"
    @hide="closeModal"
  >
    <div class="flex flex-column gap-3">
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
      <div class="grid formgrid p-fluid">
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">内部型号 (SKU) *</label>
          <InputText v-model="formData.sku" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">内部名称 *</label>
          <InputText v-model="formData.name" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">对外型号 (可选)</label>
          <InputText v-model="formData.publicName" class="w-full" placeholder="例如: ProView X1" />
        </div>

        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">分类 *</label>
          <Dropdown
            v-model="formData.category"
            :options="categoryOptions"
            placeholder="请选择分类"
            class="w-full"
          />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">成本价 (¥)</label>
          <InputNumber
            v-model="formData.cost"
            mode="decimal"
            :min="0"
            :max-fraction-digits="2"
            class="w-full"
            input-class="w-full"
          />
        </div>
        <div class="field col-12">
          <label class="font-semibold text-sm mb-2 block">简介</label>
          <Textarea v-model="formData.description" rows="2" auto-resize class="w-full" />
        </div>

        <Divider class="col-12">物理规格</Divider>
        <div class="field col-12 md:col-3">
          <label class="font-semibold text-sm mb-2 block">重量 (kg)</label>
          <InputNumber v-model="formData.weightKg" mode="decimal" :min="0" :max-fraction-digits="2" class="w-full" />
        </div>
        <div class="field col-12 md:col-3">
          <label class="font-semibold text-sm mb-2 block">长度 (mm)</label>
          <InputNumber v-model="formData.lengthMm" :min="0" class="w-full" />
        </div>
        <div class="field col-12 md:col-3">
          <label class="font-semibold text-sm mb-2 block">宽度 (mm)</label>
          <InputNumber v-model="formData.widthMm" :min="0" class="w-full" />
        </div>
        <div class="field col-12 md:col-3">
          <label class="font-semibold text-sm mb-2 block">高度 (mm)</label>
          <InputNumber v-model="formData.heightMm" :min="0" class="w-full" />
        </div>

        <Divider class="col-12">性能参数</Divider>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">分辨率</label>
          <InputText v-model="formData.resolution" class="w-full" placeholder="例如: 1920x1080" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">亮度 (ANSI)</label>
          <InputNumber v-model="formData.brightnessAnsi" :min="0" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">光源亮度 (LM)</label>
          <InputNumber v-model="formData.lightSourceBrightness" :min="0" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">亮度均匀度 (%)</label>
          <InputNumber v-model="formData.brightnessUniformity" :min="0" :max="100" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">噪声 (dB)</label>
          <InputNumber v-model="formData.noiseDb" :min="0" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">接口</label>
          <InputText v-model="formData.interfaces" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">芯片</label>
          <InputText v-model="formData.chipset" class="w-full" />
        </div>
        <div class="field col-12 md:col-4">
          <label class="font-semibold text-sm mb-2 block">光源</label>
          <InputText v-model="formData.lightSource" class="w-full" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button label="取消" severity="secondary" text @click="closeModal" />
        <Button label="保存" icon="pi pi-check" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import apiClient from '@/services/apiClient';

type ProductPayload = {
  sku: string;
  name: string;
  publicName?: string | null;
  category: string;
  cost?: number | null;
  description?: string | null;
  weightKg?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  resolution?: string | null;
  brightnessAnsi?: number | null;
  lightSourceBrightness?: number | null;
  brightnessUniformity?: number | null;
  noiseDb?: number | null;
  interfaces?: string | null;
  chipset?: string | null;
  lightSource?: string | null;
};

type ProductResponse = ProductPayload & { id: string };

const props = defineProps<{
  isOpen: boolean;
  productId: string | null;
  categoryOptions: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'product-created', payload: ProductResponse): void;
  (e: 'product-updated', payload: ProductResponse): void;
}>();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const dialogTitle = computed(() => (props.productId ? '编辑产品' : '新建产品'));
const isSubmitting = ref(false);
const errorMessage = ref('');

const formData = ref<ProductPayload>({
  sku: '',
  name: '',
  publicName: '',
  category: '',
  cost: null,
  description: '',
  weightKg: null,
  lengthMm: null,
  widthMm: null,
  heightMm: null,
  resolution: '',
  brightnessAnsi: null,
  lightSourceBrightness: null,
  brightnessUniformity: null,
  noiseDb: null,
  interfaces: '',
  chipset: '',
  lightSource: '',
});

const hydrateForm = async () => {
  if (!props.productId) return;
  errorMessage.value = '';
  try {
    const response = await apiClient.get(`/admin/products/${props.productId}`);
    const data = response.data as ProductResponse;
    formData.value = {
      sku: data.sku,
      name: data.name,
      publicName: data.publicName || '',
      category: data.category,
      cost: data.cost ?? null,
      description: data.description || '',
      weightKg: data.weightKg ?? null,
      lengthMm: data.lengthMm ?? null,
      widthMm: data.widthMm ?? null,
      heightMm: data.heightMm ?? null,
      resolution: data.resolution || '',
      brightnessAnsi: data.brightnessAnsi ?? null,
      lightSourceBrightness: data.lightSourceBrightness ?? null,
      brightnessUniformity: data.brightnessUniformity ?? null,
      noiseDb: data.noiseDb ?? null,
      interfaces: data.interfaces || '',
      chipset: data.chipset || '',
      lightSource: data.lightSource || '',
    };
  } catch (error: any) {
    console.error('加载产品详情失败:', error);
    errorMessage.value = error?.response?.data?.error || '加载产品详情失败';
  }
};

const resetForm = () => {
  formData.value = {
    sku: '',
    name: '',
    publicName: '',
    category: '',
    cost: null,
    description: '',
    weightKg: null,
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    resolution: '',
    brightnessAnsi: null,
    lightSourceBrightness: null,
    brightnessUniformity: null,
    noiseDb: null,
    interfaces: '',
    chipset: '',
    lightSource: '',
  };
  errorMessage.value = '';
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    if (props.productId) {
      const response = await apiClient.put<ProductResponse>(`/admin/products/${props.productId}`, formData.value);
      emit('product-updated', response.data);
    } else {
      const response = await apiClient.post<ProductResponse>('/admin/products', formData.value);
      emit('product-created', response.data);
    }
    closeModal();
  } catch (error: any) {
    console.error('保存失败:', error);
    errorMessage.value = error?.response?.data?.error || '保存失败，请检查输入或稍后再试。';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  resetForm();
  emit('close');
};

watch(
  () => props.productId,
  (val) => {
    if (val) {
      hydrateForm();
    } else {
      resetForm();
    }
  },
  { immediate: true },
);
</script>
