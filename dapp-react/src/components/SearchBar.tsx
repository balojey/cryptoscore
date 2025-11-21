import { useState } from 'react'
import { Input } from '@/components/ui/input'

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
          className="icon-[mdi--magnify] w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <Input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity z-10"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span className="icon-[mdi--close] w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
