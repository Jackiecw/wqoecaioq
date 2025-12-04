<template>
  <Dialog v-model:visible="isVisible" modal header="物流详情" :style="{ width: '28rem' }" @update:visible="handleDialogClose">
    <div class="flex flex-column gap-3">
      <Message severity="info" :closable="false">功能开发中...</Message>
      <p class="text-sm text-500">Order ID: {{ orderId }}</p>
    </div>

    <template #footer>
      <Button label="关闭" @click="closeModal" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';

const props = defineProps({
  isOpen: Boolean,
  orderId: [String, Number],
});

const emit = defineEmits(['close']);

const isVisible = ref(false);

watch(
  () => props.isOpen,
  (newVal) => {
    isVisible.value = newVal;
  },
);

const handleDialogClose = (val: boolean) => {
  if (!val) {
    closeModal();
  }
};

function closeModal() {
  isVisible.value = false;
  emit('close');
}
</script>
