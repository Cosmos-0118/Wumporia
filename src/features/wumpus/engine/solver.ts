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

  for (let stepIndex = 0; stepIndex < 24; stepIndex += 1) {
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

    const nextMove =
      safeNeighbors[0] ??
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
