import { useToast as useVueToast } from 'vue-toastification'

export const useToast = () => {
  const toast = useVueToast()

  return {
    success: message => toast.success(message),
    error: message => toast.error(message),
    warning: message => toast.warning(message),
    info: message => toast.info(message),
  }
}
