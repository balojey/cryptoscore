import { useState } from 'react'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export default function SearchBar({ onSearch, placeholder = 'Search markets...' }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <span
          className="icon-[mdi--magnify] w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-4 rounded-lg text-sm transition-all outline-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-cyan)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-cyan-glow)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span className="icon-[mdi--close] w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
