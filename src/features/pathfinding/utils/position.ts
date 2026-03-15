import type { PathNodePosition } from '@/features/pathfinding/types/pathfinding'

export function toPathKey(position: PathNodePosition): string {
  return `${String(position.row)},${String(position.col)}`
}

export function fromPathKey(key: string): PathNodePosition {
  const [rowText, colText] = key.split(',')
  const row = Number(rowText)
  const col = Number(colText)
  return {
    row: Number.isFinite(row) ? row : 0,
    col: Number.isFinite(col) ? col : 0,
  }
}

export function isSamePathPosition(left: PathNodePosition, right: PathNodePosition): boolean {
  return left.row === right.row && left.col === right.col
}
