<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: boolean
  id?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checked = computed({
  get: () => props.modelValue ?? false,
  set: (val: boolean) => emit('update:modelValue', val),
})
</script>

<template>
  <input
    type="checkbox"
    :id="id"
    v-model="checked"
    :disabled="disabled"
    class="h-4 w-4 shrink-0 rounded border border-input ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-primary cursor-pointer"
  />
</template>
