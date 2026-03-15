import { describe, expect, it } from 'vitest'

import { solveWumpusWorld } from '@/features/wumpus/engine/solver'
import {
  createWumpusWorld,
  defaultWumpusBlueprint,
  getPercepts,
  moveAgent,
} from '@/features/wumpus/engine/world'

describe('Wumpus world engine', () => {
  it('rejects hazards on the starting tile', () => {
    expect(() =>
      createWumpusWorld({
        ...defaultWumpusBlueprint,
        pits: [{ row: 0, col: 0 }],
      }),
    ).toThrow(/starting tile/i)
  })

  it('rejects overlapping entities', () => {
    expect(() =>
      createWumpusWorld({
        ...defaultWumpusBlueprint,
        gold: { row: 2, col: 3 },
      }),
    ).toThrow(/overlaps/i)
  })

  it('derives percepts for breeze, smell, and glitter', () => {
    const perceptsNearPit = getPercepts(defaultWumpusBlueprint, { row: 1, col: 0 })
    const perceptsNearWumpus = getPercepts(defaultWumpusBlueprint, { row: 1, col: 3 })
    const perceptsOnGold = getPercepts(defaultWumpusBlueprint, defaultWumpusBlueprint.gold)

    expect(perceptsNearPit.breeze).toBe(true)
    expect(perceptsNearWumpus.smell).toBe(true)
    expect(perceptsOnGold.glitter).toBe(true)
  })

  it('blocks out-of-bounds movement without changing the agent position', () => {
    const world = createWumpusWorld(defaultWumpusBlueprint)
    const nextWorld = moveAgent(world, 'left')

    expect(nextWorld.agent.position).toEqual(world.agent.position)
    expect(nextWorld.logs.at(-1)?.message).toMatch(/blocked by a cave wall/i)
  })

  it('solves the default blueprint with an explainable timeline', () => {
    const result = solveWumpusWorld(createWumpusWorld(defaultWumpusBlueprint))

    expect(result.status).toBe('completed')
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.solutionPath.at(-1)?.agent.hasGold).toBe(true)
  })
})
