import { describe, expect, it } from 'vitest'

import {
  defaultPathfindingBlueprint,
  getTerrainCost,
  updatePathfindingCell,
} from '@/features/pathfinding/engine/grid'
import { benchmarkPathfinding, solvePathfinding } from '@/features/pathfinding/engine/solver'

describe('Pathfinding Robot', () => {
  it('toggles weighted terrain with the weight tool', () => {
    const position = { row: 2, col: 2 }
    const first = updatePathfindingCell(defaultPathfindingBlueprint, position, 'weight')
    expect(getTerrainCost(first, position)).toBeGreaterThan(1)

    const second = updatePathfindingCell(first, position, 'weight')
    expect(getTerrainCost(second, position)).toBe(1)
  })

  it('BFS finds a path on the default map', () => {
    const result = solvePathfinding(defaultPathfindingBlueprint, 'BFS')
    expect(result.status).toBe('completed')
    expect(result.solutionPath.length).toBeGreaterThan(0)
  })

  it('Dijkstra finds a path on the default map', () => {
    const result = solvePathfinding(defaultPathfindingBlueprint, 'Dijkstra')
    expect(result.status).toBe('completed')
  })

  it('A* finds a path on the default map', () => {
    const result = solvePathfinding(defaultPathfindingBlueprint, 'A*')
    expect(result.status).toBe('completed')
  })

  it('benchmark panel returns one row per algorithm', () => {
    const benchmarks = benchmarkPathfinding(defaultPathfindingBlueprint)
    expect(benchmarks).toHaveLength(3)
    expect(benchmarks.every((item) => typeof item.elapsedMs === 'number')).toBe(true)
  })
})
