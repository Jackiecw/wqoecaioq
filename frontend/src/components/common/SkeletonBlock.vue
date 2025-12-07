<template>
  <div
    class="skeleton-block"
    :style="{
      width,
      height,
      borderRadius: radius,
    }"
  />
</template>

<script setup lang="ts">
defineProps<{
  width?: string;
  height?: string;
  radius?: string;
}>();
</script>

<style scoped>
.skeleton-block {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  display: inline-block;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
