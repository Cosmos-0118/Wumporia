import type { MazePosition } from '@/features/maze/types/maze'

export function toMazeKey(position: MazePosition): string {
  return `${position.row},${position.col}`
}

export function fromMazeKey(key: string): MazePosition {
  const parts = key.split(',')
  const row = Number(parts[0])
  const col = Number(parts[1])

  if (Number.isNaN(row) || Number.isNaN(col)) {
    throw new Error(`Invalid maze key: ${key}`)
  }

  return { row, col }
}

export function isSameMazePosition(left: MazePosition, right: MazePosition): boolean {
  return left.row === right.row && left.col === right.col
}
