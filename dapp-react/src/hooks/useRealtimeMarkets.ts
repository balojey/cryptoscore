import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface RealtimeOptions {
  enabled?: boolean
  interval?: number
  onUpdate?: () => void
}

export function useRealtimeMarkets(options: RealtimeOptions = {}) {
  const { enabled = true, interval = 10000, onUpdate } = options
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const intervalId = setInterval(() => {
      // Invalidate all market-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
      
      onUpdate?.()
    }, interval)

    return () => clearInterval(intervalId)
  }, [enabled, interval, queryClient, onUpdate])

  return {
    isPolling: enabled,
    interval,
  }
}

// Toast notification helpers
export const marketToast = {
  newParticipant: () => {
    toast.success('New participant joined!', {
      icon: '👥',
      duration: 3000,
      position: 'bottom-right',
      style: {
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent-green)',
      },
    })
  },

  marketResolved: (outcome: string) => {
    toast.success(`Market resolved: ${outcome}`, {
      icon: '✅',
      duration: 5000,
      position: 'bottom-right',
      style: {
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent-green)',
      },
    })
  },

  marketStarting: () => {
    toast('Market is starting soon!', {
      icon: '⚡',
      duration: 4000,
      position: 'bottom-right',
      style: {
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent-amber)',
      },
    })
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'bottom-right',
      style: {
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent-red)',
      },
    })
  },
}
