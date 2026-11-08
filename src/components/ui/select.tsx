import { ChevronDown } from 'lucide-react'

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  label: string
}

export function Select<T extends string>({ value, onChange, options, label }: SelectProps<T>) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value as T)
        }}
        className="h-9 w-full appearance-none rounded-md border border-border-strong bg-surface px-3 pr-8 text-sm text-fg transition-colors hover:bg-surface-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
}
