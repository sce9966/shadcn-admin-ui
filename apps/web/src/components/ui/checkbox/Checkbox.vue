<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Check } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  checked?: boolean
  id?: string
}>()

const emit = defineEmits<{
  'update:checked': [value: boolean]
}>()

/**
 * 切换勾选状态。
 */
function toggle() {
  emit('update:checked', !props.checked)
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :id="id"
    :aria-checked="checked"
    data-slot="checkbox"
    :data-state="checked ? 'checked' : 'unchecked'"
    :class="
      cn(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @click="toggle"
  >
    <span
      v-if="checked"
      class="flex items-center justify-center text-current"
    >
      <Check class="size-3.5" />
    </span>
  </button>
</template>
