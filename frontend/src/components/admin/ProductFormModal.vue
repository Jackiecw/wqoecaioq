<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '672px' }" 
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :dismissableMask="true"
    :draggable="false"
    class="p-dialog-custom"
    :pt="{
      header: { class: 'p-6 pb-0 border-none' },
      content: { class: 'p-6' }
    }"
    @hide="closeModal"
  >
    <template #header>
      <div class="text-lg font-medium leading-6 text-gray-900">
        {{ dialogTitle }}
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <Toast />
      
      <!-- Section 1: Basic Info -->
      <div class="section-group">
        <h3 class="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
          <i class="pi pi-file-edit text-gray-500"></i> 基本信息 (Basic Information)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div class="input-group">
            <label>内部型号 (SKU) <span class="text-red-500">*</span></label>
            <InputText v-model="formData.sku" class="w-full" placeholder="例如: P-2024-001" />
          </div>
          <div class="input-group">
            <label>产品名称 <span class="text-red-500">*</span></label>
            <InputText v-model="formData.name" class="w-full" placeholder="内部管理名称" />
          </div>
          <div class="input-group">
            <label>对外型号 (Public Model)</label>
            <InputText v-model="formData.publicName" class="w-full" placeholder="例如: ProView X1" />
          </div>
          <div class="input-group">
            <label>产品分类 <span class="text-red-500">*</span></label>
            <Dropdown
              v-model="formData.category"
              :options="categoryOptions"
              placeholder="选择产品分类"
              class="w-full"
            />
          </div>
          <div class="input-group">
             <label>成本价 (CNY)</label>
             <InputNumber 
               v-model="formData.cost" 
               mode="currency" 
               currency="CNY" 
               locale="zh-CN" 
               placeholder="¥ 0.00"
               class="w-full" 
               input-class="w-full"
             />
          </div>
          <div class="md:col-span-2 input-group">
            <label>产品简介</label>
            <Textarea v-model="formData.description" rows="2" auto-resize class="w-full" placeholder="简要描述产品特点..." />
          </div>
        </div>
      </div>

      <!-- Section 2: Physical Specs -->
      <div class="section-group">
        <h3 class="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
          <i class="pi pi-box text-gray-500"></i> 物理规格 (Physical Specs)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div class="input-group">
            <label>重量 (kg)</label>
            <InputNumber v-model="formData.weightKg" :min="0" :max-fraction-digits="2" class="w-full" input-class="w-full" suffix=" kg" />
          </div>
          <div class="input-group">
             <label>尺寸 (mm)</label>
             <div class="flex items-center gap-2">
                <InputNumber v-model="formData.lengthMm" :min="0" placeholder="长" class="w-full" :max-fraction-digits="0" />
                <span class="text-gray-400">×</span>
                <InputNumber v-model="formData.widthMm" :min="0" placeholder="宽" class="w-full" :max-fraction-digits="0" />
                <span class="text-gray-400">×</span>
                <InputNumber v-model="formData.heightMm" :min="0" placeholder="高" class="w-full" :max-fraction-digits="0" />
             </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Tech Specs -->
      <div class="section-group">
        <h3 class="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
          <i class="pi pi-bolt text-gray-500"></i> 技术参数 & 光学 (Tech & Optics)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
           <div class="input-group">
             <label>分辨率</label>
             <InputText v-model="formData.resolution" class="w-full" placeholder="1920x1080" />
           </div>
           <div class="input-group">
             <label>亮度 (ANSI)</label>
             <InputNumber v-model="formData.brightnessAnsi" :min="0" class="w-full" input-class="w-full" />
           </div>
           <div class="input-group">
             <label>光源亮度 (Lumens)</label>
             <InputNumber v-model="formData.lightSourceBrightness" :min="0" class="w-full" input-class="w-full" />
           </div>
           <div class="input-group">
             <label>亮度均匀度 (%)</label>
             <InputNumber v-model="formData.brightnessUniformity" :min="0" :max="100" class="w-full" input-class="w-full" suffix="%" />
           </div>
           <div class="input-group">
             <label>噪声 (dB)</label>
             <InputNumber v-model="formData.noiseDb" :min="0" class="w-full" input-class="w-full" suffix=" dB" />
           </div>
           <div class="input-group">
             <label>主控芯片</label>
             <InputText v-model="formData.chipset" class="w-full" />
           </div>
           <div class="col-span-1 md:col-span-2 input-group">
             <label>接口 (Interfaces)</label>
             <InputText v-model="formData.interfaces" class="w-full" placeholder="HDMI x2, USB x2, LAN..." />
           </div>
           <div class="col-span-1 md:col-span-2 input-group">
             <label>光源技术</label>
             <InputText v-model="formData.lightSource" class="w-full" placeholder="LED / Laser / Hybrid" />
           </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-2">
        <Button label="取消" severity="secondary" @click="closeModal" class="p-button-outlined" />
        <Button label="保存" :loading="isSubmitting" @click="handleSubmit" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
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

const toast = useToast();

const visible = computed({
  get: () => props.isOpen,
  set: (val) => {
    if (!val) emit('close');
  },
});

const dialogTitle = computed(() => (props.productId ? '编辑产品' : '新建产品'));
const isSubmitting = ref(false);

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
    toast.add({ severity: 'error', summary: 'Error', detail: '加载产品详情失败', life: 3000 });
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
};

const handleSubmit = async () => {
  if (!formData.value.sku || !formData.value.name) {
      toast.add({ severity: 'warn', summary: '提示', detail: '请填写必要的基本信息 (SKU / 名称)', life: 3000 });
      return;
  }

  isSubmitting.value = true;
  try {
    if (props.productId) {
      const response = await apiClient.put<ProductResponse>(`/admin/products/${props.productId}`, formData.value);
      emit('product-updated', response.data);
      toast.add({ severity: 'success', summary: '成功', detail: '产品更新成功', life: 3000 });
    } else {
      const response = await apiClient.post<ProductResponse>('/admin/products', formData.value);
      emit('product-created', response.data);
      toast.add({ severity: 'success', summary: '成功', detail: '产品创建成功', life: 3000 });
    }
    closeModal();
  } catch (error: any) {
    console.error('保存失败:', error);
    toast.add({ severity: 'error', summary: '保存失败', detail: error?.response?.data?.error || '保存失败，请重试', life: 3000 });
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
