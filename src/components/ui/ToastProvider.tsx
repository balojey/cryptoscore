import { Toaster } from '@/components/ui/sonner'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      duration={4000}
      closeButton
      richColors
    />
  )
}
