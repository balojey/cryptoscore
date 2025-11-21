import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface RealtimeOptions {
  enabled?: boolean
  interval?: number
  onUpdate?: () => void
}

export function useRealtimeMarkets(options: RealtimeOptions = {}) {
  const { enabled = true, interval = 10000, onUpdate } = options
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled)
      return

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
      description: '👥',
      duration: 3000,
    })
  },

  marketResolved: (outcome: string) => {
    toast.success(`Market resolved: ${outcome}`, {
      description: '✅',
      duration: 5000,
    })
  },

  marketStarting: () => {
    toast.info('Market is starting soon!', {
      description: '⚡',
      duration: 4000,
    })
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
    })
  },
}
