"use client"

import { ref, provide, inject } from "vue"

const TOAST_SYMBOL = Symbol("toast")

export function provideToast() {
  const toasts = ref([])

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now()

    toasts.value.push({
      id,
      message,
      type,
      duration,
    })

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  provide(TOAST_SYMBOL, {
    toasts,
    showToast,
    removeToast,
  })

  return {
    toasts,
    showToast,
    removeToast,
  }
}

export function useToast() {
  const toast = inject(TOAST_SYMBOL)

  if (!toast) {
    throw new Error("useToast() must be used within a component that has called provideToast()")
  }

  return toast
}
