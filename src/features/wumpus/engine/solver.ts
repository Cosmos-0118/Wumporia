import type { SolverResult, StepFrame } from '@/shared/types/solver'

import type {
  WumpusSolverMeta,
  WumpusSolverSnapshot,
  WumpusWorldState,
} from '@/features/wumpus/types/wumpus'
import {
  deriveKnowledge,
  getPercepts,
  grabGold,
  moveAgent,
  resetWumpusWorld,
} from '@/features/wumpus/engine/world'
import { fromPositionKey, getNeighbors, toPositionKey } from '@/features/wumpus/utils/position'

const directionPriority: Record<'up' | 'down' | 'left' | 'right', number> = {
  right: 0,
  down: 1,
  left: 2,
  up: 3,
}

export function solveWumpusWorld(
  initialWorld: WumpusWorldState,
): SolverResult<WumpusSolverSnapshot, WumpusSolverMeta> {
  let world = resetWumpusWorld(initialWorld.blueprint)
  const steps: StepFrame<WumpusSolverSnapshot, WumpusSolverMeta>[] = []
  const startedAt = Date.now()
  let exploredCount = 0
  let frontierCount = 0
  const maxSteps = Math.max(24, initialWorld.size * initialWorld.size * 2)

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex += 1) {
    const currentKey = toPositionKey(world.agent.position)
    const currentPercepts = getPercepts(world.blueprint, world.agent.position)
    const reasoning = [...world.knowledge.reasoning]

    if (currentPercepts.glitter) {
      world = grabGold(world)
      steps.push(
        createFrame(stepIndex, world, [
          ...reasoning,
          `Glitter at ${currentKey} means the gold is in the current cell.`,
          'Best action: grab the gold immediately.',
        ]),
      )
      break
    }

    const safeNeighbors = getNeighbors(world.agent.position, world.size)
      .filter(
        (neighbor) =>
          world.knowledge.safeCells.includes(toPositionKey(neighbor)) &&
          !world.knowledge.visitedCells.includes(toPositionKey(neighbor)),
      )
      .sort(
        (left, right) =>
          directionPriority[getDirectionLabel(world.agent.position, left)] -
          directionPriority[getDirectionLabel(world.agent.position, right)],
      )

    const fallbackNeighbors = getNeighbors(world.agent.position, world.size).filter((neighbor) => {
      const key = toPositionKey(neighbor)
      return (
        !world.knowledge.suspectedPitCells.includes(key) &&
        !world.knowledge.suspectedWumpusCells.includes(key)
      )
    })

    const backtrackStep = findBacktrackStep(world)
    const lowRiskStep = findLowRiskFrontierStep(world)

    const nextMove =
      safeNeighbors[0] ??
      backtrackStep ??
      lowRiskStep ??
      fallbackNeighbors.find(
        (neighbor) => !world.knowledge.visitedCells.includes(toPositionKey(neighbor)),
      )

    if (nextMove === undefined) {
      steps.push(
        createFrame(stepIndex, world, [
          ...reasoning,
          'No unvisited safe move remains, so the solver stops to avoid a reckless guess.',
        ]),
      )
      return {
        status: 'failed',
        solutionPath: steps
          .map((step) => step.state.current?.state)
          .filter((value): value is WumpusSolverSnapshot => value !== undefined),
        steps,
        exploredCount,
        frontierCount,
        failureReason: 'Solver could not infer a guaranteed safe next move.',
        metrics: {
          elapsedMs: Date.now() - startedAt,
          maxFrontierSize: frontierCount,
          totalExpansions: exploredCount,
        },
      }
    }

    exploredCount += 1
    frontierCount = Math.max(frontierCount, safeNeighbors.length + fallbackNeighbors.length)

    const direction = getDirectionLabel(world.agent.position, nextMove)
    world = moveAgent(world, direction)
    world = {
      ...world,
      knowledge: deriveKnowledge(
        world.blueprint,
        world.knowledge.visitedCells.map(fromPositionKey),
        world.agent.position,
      ),
    }

    steps.push(
      createFrame(stepIndex, world, [
        ...world.knowledge.reasoning,
        safeNeighbors.length > 0
          ? `A safe unvisited neighbor exists, so the solver moves ${direction}.`
          : backtrackStep !== undefined
            ? `No adjacent safe frontier exists, so the solver backtracks ${direction} to reach unexplored safe cells.`
            : lowRiskStep !== undefined
              ? `No guaranteed-safe frontier remains nearby, so the solver routes ${direction} toward a reachable low-risk frontier.`
              : `No proven safe move exists, so the solver chooses the least risky neighbor ${direction}.`,
      ]),
    )

    if (world.status !== 'exploring') {
      break
    }
  }

  return {
    status: world.status === 'won' ? 'completed' : 'failed',
    solutionPath: steps
      .map((step) => step.state.current?.state)
      .filter((value): value is WumpusSolverSnapshot => value !== undefined),
    steps,
    exploredCount,
    frontierCount,
    metrics: {
      elapsedMs: Date.now() - startedAt,
      maxFrontierSize: frontierCount,
      totalExpansions: exploredCount,
    },
    ...(world.status === 'won' ? {} : { failureReason: 'Solver ended before finding the gold.' }),
  }
}

function createFrame(
  stepIndex: number,
  world: WumpusWorldState,
  reasoning: string[],
): StepFrame<WumpusSolverSnapshot, WumpusSolverMeta> {
  return {
    stepIndex,
    timestamp: Date.now(),
    message: reasoning.at(-1) ?? 'Solver updated the world state.',
    state: {
      algorithm: 'Explainable Wumpus Explorer',
      status:
        world.status === 'exploring' ? 'running' : world.status === 'won' ? 'completed' : 'failed',
      step: stepIndex,
      current: {
        id: `${stepIndex}-${toPositionKey(world.agent.position)}`,
        state: {
          agent: world.agent,
          knowledge: world.knowledge,
        },
        cost: world.agent.stepsTaken,
        depth: world.agent.stepsTaken,
      },
      frontier: [],
      explored: [],
      meta: {
        reasoning,
        status: world.status,
      },
    },
  }
}

function getDirectionLabel(from: { row: number; col: number }, to: { row: number; col: number }) {
  if (to.row < from.row) {
    return 'up'
  }
  if (to.row > from.row) {
    return 'down'
  }
  if (to.col < from.col) {
    return 'left'
  }
  return 'right'
}

function findBacktrackStep(world: WumpusWorldState): { row: number; col: number } | undefined {
  const visitedKeys = new Set(world.knowledge.visitedCells)
  const safeKeys = new Set(world.knowledge.safeCells)
  const safeUnvisitedKeys = [...safeKeys].filter((key) => !visitedKeys.has(key))

  if (safeUnvisitedKeys.length === 0) {
    return undefined
  }

  return findStepTowardTargets(world, new Set(safeUnvisitedKeys))
}

function findLowRiskFrontierStep(
  world: WumpusWorldState,
): { row: number; col: number } | undefined {
  const visitedKeys = new Set(world.knowledge.visitedCells)
  const suspectedPit = new Set(world.knowledge.suspectedPitCells)
  const suspectedWumpus = new Set(world.knowledge.suspectedWumpusCells)
  const safeKeys = new Set(world.knowledge.safeCells)
  const lowRiskTargets = new Set<string>()

  for (let row = 0; row < world.size; row += 1) {
    for (let col = 0; col < world.size; col += 1) {
      const key = toPositionKey({ row, col })
      if (
        visitedKeys.has(key) ||
        suspectedPit.has(key) ||
        suspectedWumpus.has(key) ||
        safeKeys.has(key)
      ) {
        continue
      }
      lowRiskTargets.add(key)
    }
  }

  if (lowRiskTargets.size === 0) {
    return undefined
  }

  return findStepTowardTargets(world, lowRiskTargets)
}

function findStepTowardTargets(
  world: WumpusWorldState,
  targetKeys: Set<string>,
): { row: number; col: number } | undefined {
  if (targetKeys.size === 0) {
    return undefined
  }

  const visitedKeys = new Set(world.knowledge.visitedCells)
  const safeKeys = new Set(world.knowledge.safeCells)
  const startKey = toPositionKey(world.agent.position)
  const traversableKeys = new Set([...visitedKeys, ...safeKeys, startKey])

  const queue = [world.agent.position]
  const seenKeys = new Set([startKey])
  const parentByKey = new Map<string, string | null>([[startKey, null]])

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) {
      break
    }

    const currentKey = toPositionKey(current)
    if (targetKeys.has(currentKey) && currentKey !== startKey) {
      const firstStepKey = reconstructFirstStep(startKey, currentKey, parentByKey)
      return firstStepKey === undefined ? undefined : fromPositionKey(firstStepKey)
    }

    const neighbors = getNeighbors(current, world.size)
      .filter((neighbor) => {
        const key = toPositionKey(neighbor)
        return traversableKeys.has(key) || targetKeys.has(key)
      })
      .sort(
        (left, right) =>
          directionPriority[getDirectionLabel(current, left)] -
          directionPriority[getDirectionLabel(current, right)],
      )

    for (const neighbor of neighbors) {
      const neighborKey = toPositionKey(neighbor)
      if (seenKeys.has(neighborKey)) {
        continue
      }

      seenKeys.add(neighborKey)
      parentByKey.set(neighborKey, currentKey)
      queue.push(neighbor)
    }
  }

  return undefined
}

function reconstructFirstStep(
  startKey: string,
  goalKey: string,
  parentByKey: Map<string, string | null>,
): string | undefined {
  let cursorKey = goalKey
  let parentKey = parentByKey.get(cursorKey)

  while (parentKey !== null && parentKey !== undefined && parentKey !== startKey) {
    cursorKey = parentKey
    parentKey = parentByKey.get(cursorKey)
  }

  return parentKey === startKey ? cursorKey : undefined
}
