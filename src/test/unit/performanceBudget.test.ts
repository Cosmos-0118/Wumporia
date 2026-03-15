import { describe, expect, it } from 'vitest'

import { updateMazeCell, defaultMazeBlueprint } from '@/features/maze/engine/grid'
import { solveMaze } from '@/features/maze/engine/solver'
import {
  defaultPathfindingBlueprint,
  updatePathfindingCell,
} from '@/features/pathfinding/engine/grid'
import { solvePathfinding } from '@/features/pathfinding/engine/solver'
import { solvePuzzle8 } from '@/features/puzzle8/engine/solver'

function durationMs(task: () => void): number {
  const start = performance.now()
  task()
  return performance.now() - start
}

describe('Performance budgets', () => {
  it('keeps common editor interactions under the latency budget', () => {
    const mazeInteractionMs = durationMs(() => {
      let current = defaultMazeBlueprint
      for (let index = 0; index < 200; index++) {
        current = updateMazeCell(
          current,
          { row: index % current.rows, col: index % current.cols },
          'wall',
        )
      }
    })

    const pathfindingInteractionMs = durationMs(() => {
      let current = defaultPathfindingBlueprint
      for (let index = 0; index < 200; index++) {
        current = updatePathfindingCell(
          current,
          { row: index % current.rows, col: index % current.cols },
          index % 2 === 0 ? 'obstacle' : 'weight',
        )
      }
    })

    expect(mazeInteractionMs).toBeLessThan(250)
    expect(pathfindingInteractionMs).toBeLessThan(250)
  })

  it('keeps representative solver execution under the latency budget', () => {
    const mazeSolveMs = durationMs(() => {
      solveMaze(defaultMazeBlueprint, 'A*')
    })
    const puzzleSolveMs = durationMs(() => {
      solvePuzzle8([1, 2, 3, 4, 5, 6, 7, 0, 8], 'A*')
    })
    const pathfindingSolveMs = durationMs(() => {
      solvePathfinding(defaultPathfindingBlueprint, 'A*')
    })

    expect(mazeSolveMs).toBeLessThan(250)
    expect(puzzleSolveMs).toBeLessThan(250)
    expect(pathfindingSolveMs).toBeLessThan(250)
  })
})
