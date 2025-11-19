import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          fontSize: 'var(--text-base)',
          fontFamily: 'var(--font-primary)',
        },
        success: {
          iconTheme: {
            primary: 'var(--accent-green)',
            secondary: 'var(--bg-elevated)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--accent-red)',
            secondary: 'var(--bg-elevated)',
          },
        },
      }}
    />
  )
}
