import { useEffect, useState } from 'react'

interface ConfettiProps {
  trigger: boolean
  duration?: number
}

export default function Confetti({ trigger, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number, left: number, color: string, delay: number }>>([])

  useEffect(() => {
    if (!trigger)
      return

    const colors = [
      'var(--accent-cyan)',
      'var(--accent-green)',
      'var(--accent-amber)',
      'var(--accent-purple)',
      'var(--accent-red)',
    ]

    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }))

    setParticles(newParticles)

    const timer = setTimeout(() => {
      setParticles([])
    }, duration)

    return () => clearTimeout(timer)
  }, [trigger, duration])

  if (particles.length === 0)
    return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="confetti"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
