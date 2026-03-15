import { describe, expect, it } from 'vitest'

import { runVacuumComparison, simulateVacuumAgent } from '@/features/vacuum/engine/agents'
import { createVacuumWorld, generateDirtKeys } from '@/features/vacuum/engine/world'
import type { VacuumWorld } from '@/features/vacuum/types/vacuum'

function fixedRng(value: number): () => number {
  return () => value
}

describe('Vacuum World Engine', () => {
  it('generates dirt keys in bounds and not on start tile', () => {
    const world = createVacuumWorld(
      {
        rows: 4,
        cols: 4,
        start: { row: 0, col: 0 },
        dirtProbability: 0.5,
      },
      fixedRng(0.2),
    )

    expect(world.dirtKeys.length).toBeGreaterThan(0)
    expect(world.dirtKeys).not.toContain('0,0')
    for (const key of world.dirtKeys) {
      const [rText, cText] = key.split(',')
      const row = Number(rText)
      const col = Number(cText)
      expect(row).toBeGreaterThanOrEqual(0)
      expect(col).toBeGreaterThanOrEqual(0)
      expect(row).toBeLessThan(4)
      expect(col).toBeLessThan(4)
    }
  })

  it('ensures at least one dirty tile even with very low probability', () => {
    const dirt = generateDirtKeys(
      {
        rows: 3,
        cols: 3,
        start: { row: 1, col: 1 },
        dirtProbability: 0,
      },
      fixedRng(1),
    )

    expect(dirt.length).toBeGreaterThan(0)
  })

  it('model-based agent should be at least as clean as reflex on same world', () => {
    const world: VacuumWorld = {
      rows: 4,
      cols: 4,
      start: { row: 0, col: 0 },
      dirtKeys: ['0,3', '2,2', '3,0', '3,3'],
    }

    const comparison = runVacuumComparison(world, 80)

    expect(comparison.modelBased.metrics.remainingDirty).toBeLessThanOrEqual(
      comparison.reflex.metrics.remainingDirty,
    )
  })

  it('simulation history starts with step 0 snapshot', () => {
    const world: VacuumWorld = {
      rows: 3,
      cols: 3,
      start: { row: 1, col: 1 },
      dirtKeys: ['0,0'],
    }

    const result = simulateVacuumAgent(world, 'model-based', 10)
    expect(result.history.length).toBeGreaterThan(0)
    const first = result.history[0]
    expect(first?.step).toBe(0)
    expect(first?.action).toBe('idle')
  })
})
