import type { VacuumPosition } from '@/features/vacuum/types/vacuum'

export function toVacuumKey(position: VacuumPosition): string {
  return `${String(position.row)},${String(position.col)}`
}

export function fromVacuumKey(key: string): VacuumPosition {
  const [rowText, colText] = key.split(',')
  const row = Number(rowText)
  const col = Number(colText)
  return {
    row: Number.isFinite(row) ? row : 0,
    col: Number.isFinite(col) ? col : 0,
  }
}

export function isSameVacuumPosition(left: VacuumPosition, right: VacuumPosition): boolean {
  return left.row === right.row && left.col === right.col
}
