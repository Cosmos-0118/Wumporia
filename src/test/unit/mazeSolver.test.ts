import { describe, expect, it } from 'vitest'

import { defaultMazeBlueprint } from '@/features/maze/engine/grid'
import { solveMaze } from '@/features/maze/engine/solver'

describe('maze solver', () => {
  it('finds a path for BFS on the default maze', () => {
    const result = solveMaze(defaultMazeBlueprint, 'BFS')

    expect(result.status).toBe('completed')
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.metrics.totalExpansions).toBeGreaterThan(0)
  })

  it('finds a path for A* on the default maze', () => {
    const result = solveMaze(defaultMazeBlueprint, 'A*')

    expect(result.status).toBe('completed')
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.metrics.totalExpansions).toBeGreaterThan(0)
  })
})
