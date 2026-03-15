import type { WumpusDirection, WumpusPosition } from '@/features/wumpus/types/wumpus'

export function toPositionKey(position: WumpusPosition): string {
  return `${position.row},${position.col}`
}

export function fromPositionKey(key: string): WumpusPosition {
  const parts = key.split(',')
  const row = Number(parts[0])
  const col = Number(parts[1])

  if (Number.isNaN(row) || Number.isNaN(col)) {
    throw new Error(`Invalid position key: ${key}`)
  }

  return { row, col }
}

export function isSamePosition(left: WumpusPosition, right: WumpusPosition): boolean {
  return left.row === right.row && left.col === right.col
}

export function movePosition(position: WumpusPosition, direction: WumpusDirection): WumpusPosition {
  switch (direction) {
    case 'up':
      return { row: position.row - 1, col: position.col }
    case 'down':
      return { row: position.row + 1, col: position.col }
    case 'left':
      return { row: position.row, col: position.col - 1 }
    case 'right':
      return { row: position.row, col: position.col + 1 }
  }
}

export function isWithinBounds(position: WumpusPosition, size: number): boolean {
  return position.row >= 0 && position.row < size && position.col >= 0 && position.col < size
}

export function getNeighbors(position: WumpusPosition, size: number): WumpusPosition[] {
  return (['up', 'down', 'left', 'right'] as const)
    .map((direction) => movePosition(position, direction))
    .filter((neighbor) => isWithinBounds(neighbor, size))
}
