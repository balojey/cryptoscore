// Circuit breaker pattern implementation for MNEE operations

import type { CircuitBreakerConfig } from './types'
import { MneeError } from './types'

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class MneeCircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failures = 0
  private nextAttemptTime = 0
  private successCount = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new MneeError('Circuit breaker is open', 'CIRCUIT_BREAKER_OPEN')
      }
      // Transition to half-open to test if service is recovered
      this.state = CircuitBreakerState.HALF_OPEN
      this.successCount = 0
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++
      // After a few successful calls, close the circuit
      if (this.successCount >= 3) {
        this.state = CircuitBreakerState.CLOSED
      }
    }
  }

  private onFailure(): void {
    this.failures++

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN
      this.nextAttemptTime = Date.now() + this.config.timeout
    }
  }

  getState(): CircuitBreakerState {
    return this.state
  }

  getFailureCount(): number {
    return this.failures
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failures = 0
    this.nextAttemptTime = 0
    this.successCount = 0
  }

  isOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN
  }

  isClosed(): boolean {
    return this.state === CircuitBreakerState.CLOSED
  }

  isHalfOpen(): boolean {
    return this.state === CircuitBreakerState.HALF_OPEN
  }
}