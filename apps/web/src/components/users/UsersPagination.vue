<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const from = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const to = computed(() =>
  Math.min(props.page * props.pageSize, props.total),
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize) || 1),
)
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm"
  >
    <span class="font-mono text-muted-foreground">
      显示 {{ from }}–{{ to }} / 共 {{ total }}
    </span>
    <div class="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        上一页
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        下一页
      </Button>
    </div>
  </div>
</template>
