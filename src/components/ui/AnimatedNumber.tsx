import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
  className?: string
  style?: React.CSSProperties
}

export default function AnimatedNumber({
  value,
  duration = 500,
  decimals = 0,
  suffix = '',
  className = '',
  style = {},
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValueRef = useRef(value)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValueRef.current
    const endValue = value
    const startTime = Date.now()

    const animate = (): void => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - (1 - progress) ** 3

      const currentValue = startValue + (endValue - startValue) * easeOut
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      else {
        previousValueRef.current = endValue
      }
    }

    if (startValue !== endValue) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration])

  return (
    <span className={className} style={style}>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}
