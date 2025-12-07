<template>
  <section
    class="content-card"
    :class="[{ 'content-card--ghost': ghost }, customClass]"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  ghost?: boolean;
  customClass?: string | string[] | Record<string, boolean>;
}>();
</script>
