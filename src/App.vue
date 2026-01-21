<script setup lang="ts">
import Pace from './components/Pace.vue'
import VMA from './components/VMA.vue'

</script>

<style scoped>
.field-addon {
  font-family: monospace;
}
</style>

<template>
  <main>
    <section class="section">
      <div class="block">
        <h1 class="title">Running tools</h1>
      </div>
      <div class="block">
        <h3 class="subtitle">Pace calculator</h3>
      </div>
      <Pace />
      <hr />
      <div class="block">
        <h3 class="subtitle">VMA</h3>
      </div>
      <VMA />
    </section>
  </main>
</template>
