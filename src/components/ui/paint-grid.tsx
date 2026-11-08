import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface CellView {
  className?: string
  content?: ReactNode
  label?: string | undefined
}

interface PaintGridProps {
  rows: number
  cols: number
  renderCell: (row: number, col: number) => CellView
  onPaint?: (row: number, col: number) => void
  label: string
}

/** Square-celled grid that supports click and drag painting. */
export function PaintGrid({ rows, cols, renderCell, onPaint, label }: PaintGridProps) {
  const cells = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const view = renderCell(row, col)
    return (
      <button
        key={index}
        type="button"
        tabIndex={-1}
        aria-label={view.label ?? `Row ${String(row + 1)}, column ${String(col + 1)}`}
        disabled={onPaint === undefined}
        onPointerDown={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId)
          onPaint?.(row, col)
        }}
        onPointerEnter={(event) => {
          if (event.buttons === 1) onPaint?.(row, col)
        }}
        className={cn(
          'relative flex aspect-square items-center justify-center rounded-[6px] border border-transparent text-[11px] font-medium transition-colors duration-200 disabled:cursor-default',
          view.className,
        )}
      >
        {view.content}
      </button>
    )
  })

  return (
    <div
      role="grid"
      aria-label={label}
      className="grid w-full touch-none gap-1 select-none"
      style={{
        gridTemplateColumns: `repeat(${String(cols)}, minmax(0, 1fr))`,
        maxWidth: `min(100%, max(240px, calc((100vh - 21rem) * ${String(cols)} / ${String(rows)})))`,
      }}
    >
      {cells}
    </div>
  )
}
