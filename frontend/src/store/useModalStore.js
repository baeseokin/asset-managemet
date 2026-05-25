import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  const type = ref('alert') // 'alert', 'confirm', 'prompt'
  const title = ref('')
  const message = ref('')
  const resolvePromise = ref(null)

  const promptValue = ref('')
  const promptPlaceholder = ref('')

  const showAlert = (msg, t = '알림') => {
    return new Promise((resolve) => {
      title.value = t
      message.value = msg
      type.value = 'alert'
      isOpen.value = true
      resolvePromise.value = resolve
    })
  }

  const showConfirm = (msg, t = '확인') => {
    return new Promise((resolve) => {
      title.value = t
      message.value = msg
      type.value = 'confirm'
      isOpen.value = true
      resolvePromise.value = resolve
    })
  }

  const showPrompt = (msg, placeholder = '', t = '입력') => {
    return new Promise((resolve) => {
      title.value = t
      message.value = msg
      promptPlaceholder.value = placeholder
      promptValue.value = ''
      type.value = 'prompt'
      isOpen.value = true
      resolvePromise.value = resolve
    })
  }

  const close = (result = false) => {
    isOpen.value = false
    const finalResult = type.value === 'prompt' ? (result ? promptValue.value : null) : result
    if (resolvePromise.value) {
      resolvePromise.value(finalResult)
      resolvePromise.value = null
    }
  }

  return {
    isOpen,
    type,
    title,
    message,
    promptValue,
    promptPlaceholder,
    showAlert,
    showConfirm,
    showPrompt,
    close
  }
})
