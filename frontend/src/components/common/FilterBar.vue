<template>
  <div class="filter-bar-shell">
    <div class="filter-left">
      <slot name="start" />
    </div>
    <div class="filter-right">
      <slot name="end" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 布局组件，无额外逻辑
</script>
