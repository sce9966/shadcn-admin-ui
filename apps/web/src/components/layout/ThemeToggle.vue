<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

/**
 * 切换主题并 Toast 提示。
 */
function onToggle(): void {
  const next = toggleTheme()
  toast(next === 'dark' ? '已切换为深色主题' : '已切换为浅色主题')
}
</script>

<template>
  <Button
    type="button"
    variant="ghost"
    size="icon"
    :aria-pressed="isDark"
    :aria-label="
      isDark ? '当前深色主题，点击切换为浅色' : '当前浅色主题，点击切换为深色'
    "
    :title="isDark ? '深色主题' : '浅色主题'"
    @click="onToggle"
  >
    <Moon v-if="isDark" aria-hidden="true" />
    <Sun v-else aria-hidden="true" />
  </Button>
</template>
