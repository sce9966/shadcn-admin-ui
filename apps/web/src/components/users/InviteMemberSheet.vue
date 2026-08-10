<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { UserRole } from '@/types/users'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  submit: [payload: { email: string; role: UserRole; note?: string }]
}>()

const submitting = ref(false)
const form = reactive({
  email: '',
  role: 'ops' as UserRole,
  note: '',
})
const emailError = ref('')

watch(open, (value) => {
  if (value) {
    form.email = ''
    form.role = 'ops'
    form.note = ''
    emailError.value = ''
    submitting.value = false
  }
})

/**
 * 基础邮箱校验。
 */
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * 提交邀请。
 */
function onSubmit() {
  const email = form.email.trim()
  if (!isEmail(email)) {
    emailError.value = '请输入有效邮箱'
    return
  }
  emailError.value = ''
  submitting.value = true
  emit('submit', {
    email,
    role: form.role,
    note: form.note.trim() || undefined,
  })
}

/**
 * 供父组件在请求结束后关闭 loading / 设置字段错误。
 */
function setSubmitting(value: boolean) {
  submitting.value = value
}

/**
 * 设置邮箱错误文案。
 */
function setEmailError(message: string) {
  emailError.value = message
}

defineExpose({ setSubmitting, setEmailError })
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="flex w-full flex-col sm:max-w-[420px]">
      <SheetHeader>
        <SheetTitle>邀请成员</SheetTitle>
        <SheetDescription>
          发送后对方需在 7 天内接受（首期仅创建待接受记录）。
        </SheetDescription>
      </SheetHeader>

      <form
        id="invite-form"
        class="flex flex-1 flex-col gap-4 px-4"
        @submit.prevent="onSubmit"
      >
        <div class="flex flex-col gap-1.5">
          <Label for="invite-email">工作邮箱</Label>
          <Input
            id="invite-email"
            v-model="form.email"
            type="email"
            placeholder="name@company.com"
            :aria-invalid="Boolean(emailError)"
            @input="emailError = ''"
          />
          <p v-if="emailError" class="text-sm text-destructive">
            {{ emailError }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>角色</Label>
          <Select v-model="form.role">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="admin">工作区管理员</SelectItem>
                <SelectItem value="ops">运营</SelectItem>
                <SelectItem value="viewer">只读观察者</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            邀请发送后，对方需在 7 天内接受。
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="invite-note">备注（可选）</Label>
          <Textarea
            id="invite-note"
            v-model="form.note"
            placeholder="例如：负责华东门店运营"
            rows="3"
          />
        </div>
      </form>

      <SheetFooter class="flex-row justify-end gap-2 sm:flex-row">
        <Button type="button" variant="secondary" @click="open = false">
          取消
        </Button>
        <Button type="submit" form="invite-form" :disabled="submitting">
          {{ submitting ? '发送中…' : '发送邀请' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
