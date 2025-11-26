import React from 'react'

interface MarqueeTextProps {
  text: string
  threshold: number
  className?: string
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, threshold, className }) => {
  const useMarquee = text.length > threshold

  if (!useMarquee) {
    return <h4 className={`${className} truncate w-full`} title={text}>{text}</h4>
  }

  return (
    <div className={`w-full overflow-hidden relative ${className}`} style={{ height: '1.5rem' }}>
      <div className="absolute whitespace-nowrap animate-marquee will-change-transform">
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
      </div>
    </div>
  )
}
