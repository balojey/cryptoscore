/**
 * MNEE Notification Service
 * 
 * Handles balance change notifications and user alerts
 */

import type { BalanceNotification } from './balance-subscription-service'
import { MNEE_UNITS } from '@/config/mnee'

export interface NotificationOptions {
  enableToasts?: boolean
  enableBrowserNotifications?: boolean
  minAmountForNotification?: number // in atomic units
  notificationTimeout?: number
}

export interface NotificationService {
  showBalanceNotification(notification: BalanceNotification): void
  requestNotificationPermission(): Promise<boolean>
  configure(options: NotificationOptions): void
}

export class MneeNotificationService implements NotificationService {
  private options: Required<NotificationOptions> = {
    enableToasts: true,
    enableBrowserNotifications: false,
    minAmountForNotification: MNEE_UNITS.toAtomicUnits(0.01), // 0.01 MNEE minimum
    notificationTimeout: 5000 // 5 seconds
  }

  private hasNotificationPermission = false

  constructor(options: NotificationOptions = {}) {
    this.configure(options)
    this.checkNotificationPermission()
  }

  /**
   * Configure notification options
   */
  configure(options: NotificationOptions): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      this.hasNotificationPermission = true
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.hasNotificationPermission = permission === 'granted'
      return this.hasNotificationPermission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  /**
   * Show balance change notification
   */
  showBalanceNotification(notification: BalanceNotification): void {
    const amountChange = Math.abs(notification.newBalance - notification.previousBalance)
    
    // Skip if change is below minimum threshold
    if (amountChange < this.options.minAmountForNotification) {
      return
    }

    const formattedAmount = MNEE_UNITS.formatMneeAmount(amountChange)
    const formattedBalance = MNEE_UNITS.formatMneeAmount(notification.newBalance)
    
    const message = this.createNotificationMessage(notification, formattedAmount, formattedBalance)
    
    // Show toast notification
    if (this.options.enableToasts) {
      this.showToastNotification(message, notification.type)
    }
    
    // Show browser notification
    if (this.options.enableBrowserNotifications && this.hasNotificationPermission) {
      this.showBrowserNotification(message, notification.type)
    }
  }

  /**
   * Check current notification permission status
   */
  private checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.hasNotificationPermission = Notification.permission === 'granted'
    }
  }

  /**
   * Create notification message based on balance change
   */
  private createNotificationMessage(
    notification: BalanceNotification, 
    formattedAmount: string, 
    formattedBalance: string
  ): string {
    switch (notification.type) {
      case 'increase':
        return `Balance increased by ${formattedAmount}. New balance: ${formattedBalance}`
      case 'decrease':
        return `Balance decreased by ${formattedAmount}. New balance: ${formattedBalance}`
      default:
        return `Balance updated: ${formattedBalance}`
    }
  }

  /**
   * Show toast notification using Sonner
   */
  private showToastNotification(message: string, type: BalanceNotification['type']): void {
    // Import toast dynamically to avoid SSR issues
    import('sonner').then(({ toast }) => {
      switch (type) {
        case 'increase':
          toast.success('Balance Updated', {
            description: message,
            duration: this.options.notificationTimeout
          })
          break
        case 'decrease':
          toast.info('Balance Updated', {
            description: message,
            duration: this.options.notificationTimeout
          })
          break
        default:
          toast.info('Balance Updated', {
            description: message,
            duration: this.options.notificationTimeout
          })
      }
    }).catch(error => {
      console.error('Failed to show toast notification:', error)
    })
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(message: string, type: BalanceNotification['type']): void {
    if (!this.hasNotificationPermission) return

    try {
      const title = 'MNEE Balance Update'
      const icon = '/icon-192.svg' // Use app icon
      
      const notification = new Notification(title, {
        body: message,
        icon,
        badge: icon,
        tag: 'mnee-balance', // Replace previous balance notifications
        requireInteraction: false,
        silent: type === 'unchanged'
      })

      // Auto-close after timeout
      setTimeout(() => {
        notification.close()
      }, this.options.notificationTimeout)

    } catch (error) {
      console.error('Failed to show browser notification:', error)
    }
  }
}

/**
 * Global notification service instance
 */
let globalNotificationService: MneeNotificationService | null = null

/**
 * Get or create the global notification service
 */
export function getNotificationService(options?: NotificationOptions): MneeNotificationService {
  if (!globalNotificationService) {
    globalNotificationService = new MneeNotificationService(options)
  }
  return globalNotificationService
}

/**
 * Cleanup global service (useful for testing)
 */
export function cleanupNotificationService(): void {
  globalNotificationService = null
}