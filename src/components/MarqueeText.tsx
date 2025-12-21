import React from 'react'

interface MarqueeTextProps {
  text: string
  threshold: number
  className?: string
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, threshold, className }) => {
  const useMarquee = text.length > threshold

  if (!useMarquee) {
    return <h4 className={`${className} truncate`} title={text}>{text}</h4>
  }

  return (
    <div 
      className={className}
      style={{ 
        overflow: 'hidden',
        width: '100%',
        minWidth: 0
      }}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div 
        style={{ 
          animation: 'marquee 10s linear infinite',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          willChange: 'transform'
        }}
      >
        <span style={{ display: 'inline-block', paddingRight: '2rem' }}>{text}</span>
        <span style={{ display: 'inline-block', paddingRight: '2rem' }}>{text}</span>
      </div>
    </div>
  )
}
