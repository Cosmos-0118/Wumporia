import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted">{label}</div>
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'bad' | 'warn'
  className?: string
}) {
  const tones = {
    neutral: 'border-border-strong text-muted',
    good: 'border-good/40 bg-good/10 text-good',
    bad: 'border-bad/40 bg-bad/10 text-bad',
    warn: 'border-warn/40 bg-warn/10 text-warn',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: ReactNode
  tone?: 'good' | 'bad' | undefined
}) {
  return (
    <div className="rounded-lg border bg-surface-2/50 px-3 py-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={cn(
          'mt-0.5 font-mono text-lg font-medium tabular-nums',
          tone === 'good' && 'text-good',
          tone === 'bad' && 'text-bad',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-surface-2/50 px-3 py-2.5 text-sm leading-relaxed text-muted">
      {children}
    </div>
  )
}

export function Legend({ items }: { items: Array<{ label: string; className: string }> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className={cn('size-3 rounded-[3px] border', item.className)} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
