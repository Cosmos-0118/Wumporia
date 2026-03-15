export interface GridPoint {
  row: number
  col: number
}

export type HeuristicFn<TState> = (current: TState, goal: TState) => number

export function manhattanDistance(current: GridPoint, goal: GridPoint): number {
  return Math.abs(current.row - goal.row) + Math.abs(current.col - goal.col)
}

export function euclideanDistance(current: GridPoint, goal: GridPoint): number {
  const deltaRow = current.row - goal.row
  const deltaCol = current.col - goal.col
  return Math.sqrt(deltaRow * deltaRow + deltaCol * deltaCol)
}

export function weightedHeuristic<TState>(
  heuristic: HeuristicFn<TState>,
  weight: number,
): HeuristicFn<TState> {
  return (current: TState, goal: TState) => heuristic(current, goal) * weight
}

export function totalManhattanForTiles(current: number[], goal: number[], width = 3): number {
  const goalIndices = new Map<number, number>()
  goal.forEach((tile, index) => {
    goalIndices.set(tile, index)
  })

  let score = 0
  current.forEach((tile, index) => {
    if (tile === 0) {
      return
    }

    const goalIndex = goalIndices.get(tile)
    if (goalIndex === undefined) {
      return
    }

    const currentPoint = { row: Math.floor(index / width), col: index % width }
    const goalPoint = { row: Math.floor(goalIndex / width), col: goalIndex % width }
    score += manhattanDistance(currentPoint, goalPoint)
  })

  return score
}
