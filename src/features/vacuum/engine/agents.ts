import type {
  VacuumAction,
  VacuumAgentType,
  VacuumMetrics,
  VacuumPosition,
  VacuumRunResult,
  VacuumSnapshot,
  VacuumWorld,
} from '@/features/vacuum/types/vacuum'
import { fromVacuumKey, toVacuumKey } from '@/features/vacuum/utils/position'

interface SimState {
  agent: VacuumPosition
  dirtySet: Set<string>
  step: number
  reflexDirectionIdx: number
}

const directionCycle: VacuumAction[] = ['right', 'down', 'left', 'up']

function inBounds(position: VacuumPosition, world: VacuumWorld): boolean {
  return (
    position.row >= 0 && position.row < world.rows && position.col >= 0 && position.col < world.cols
  )
}

function move(position: VacuumPosition, action: VacuumAction): VacuumPosition {
  switch (action) {
    case 'up':
      return { row: position.row - 1, col: position.col }
    case 'down':
      return { row: position.row + 1, col: position.col }
    case 'left':
      return { row: position.row, col: position.col - 1 }
    case 'right':
      return { row: position.row, col: position.col + 1 }
    default:
      return position
  }
}

function nearestDirtyTarget(agent: VacuumPosition, dirtySet: Set<string>): VacuumPosition | null {
  let best: VacuumPosition | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const key of dirtySet) {
    const candidate = fromVacuumKey(key)
    const distance = Math.abs(candidate.row - agent.row) + Math.abs(candidate.col - agent.col)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  return best
}

function chooseReflexAction(state: SimState, world: VacuumWorld): VacuumAction {
  const key = toVacuumKey(state.agent)
  if (state.dirtySet.has(key)) {
    return 'suck'
  }

  for (let i = 0; i < directionCycle.length; i++) {
    const idx = (state.reflexDirectionIdx + i) % directionCycle.length
    const action = directionCycle[idx]
    if (action === undefined) {
      continue
    }
    const next = move(state.agent, action)
    if (inBounds(next, world)) {
      state.reflexDirectionIdx = (idx + 1) % directionCycle.length
      return action
    }
  }

  return 'idle'
}

function chooseModelBasedAction(state: SimState): VacuumAction {
  const key = toVacuumKey(state.agent)
  if (state.dirtySet.has(key)) {
    return 'suck'
  }

  const target = nearestDirtyTarget(state.agent, state.dirtySet)
  if (target === null) {
    return 'idle'
  }

  if (target.row < state.agent.row) return 'up'
  if (target.row > state.agent.row) return 'down'
  if (target.col < state.agent.col) return 'left'
  if (target.col > state.agent.col) return 'right'

  return 'idle'
}

function applyAction(
  state: SimState,
  action: VacuumAction,
  world: VacuumWorld,
): { moved: boolean; cleaned: boolean } {
  if (action === 'suck') {
    const key = toVacuumKey(state.agent)
    const hadDirt = state.dirtySet.has(key)
    if (hadDirt) {
      state.dirtySet.delete(key)
    }
    return { moved: false, cleaned: hadDirt }
  }

  if (action === 'idle') {
    return { moved: false, cleaned: false }
  }

  const next = move(state.agent, action)
  if (inBounds(next, world)) {
    state.agent = next
    return { moved: true, cleaned: false }
  }

  return { moved: false, cleaned: false }
}

function buildMetrics(
  initialDirtCount: number,
  remainingDirty: number,
  moves: number,
  cleanedTiles: number,
  energyUsed: number,
  steps: number,
): VacuumMetrics {
  const cleanlinessScore =
    initialDirtCount === 0
      ? 100
      : Math.round(((initialDirtCount - remainingDirty) / initialDirtCount) * 100)

  return {
    moves,
    energyUsed,
    cleanedTiles,
    remainingDirty,
    cleanlinessScore,
    steps,
  }
}

export function simulateVacuumAgent(
  world: VacuumWorld,
  agentType: VacuumAgentType,
  maxSteps = 120,
): VacuumRunResult {
  const state: SimState = {
    agent: { ...world.start },
    dirtySet: new Set(world.dirtKeys),
    step: 0,
    reflexDirectionIdx: 0,
  }

  const initialDirtCount = state.dirtySet.size
  const history: VacuumSnapshot[] = [
    {
      step: 0,
      action: 'idle',
      agent: { ...state.agent },
      dirtyKeys: [...state.dirtySet],
    },
  ]

  let moves = 0
  let cleanedTiles = 0
  let energyUsed = 0

  while (state.step < maxSteps && state.dirtySet.size > 0) {
    const action =
      agentType === 'model-based' ? chooseModelBasedAction(state) : chooseReflexAction(state, world)

    const outcome = applyAction(state, action, world)
    state.step += 1

    if (outcome.moved) {
      moves += 1
      energyUsed += 1
    } else if (action === 'suck') {
      energyUsed += 2
    } else {
      energyUsed += 1
    }

    if (outcome.cleaned) {
      cleanedTiles += 1
    }

    history.push({
      step: state.step,
      action,
      agent: { ...state.agent },
      dirtyKeys: [...state.dirtySet],
    })
  }

  const metrics = buildMetrics(
    initialDirtCount,
    state.dirtySet.size,
    moves,
    cleanedTiles,
    energyUsed,
    state.step,
  )

  return { agentType, history, metrics }
}

export function runVacuumComparison(
  world: VacuumWorld,
  maxSteps = 120,
): {
  reflex: VacuumRunResult
  modelBased: VacuumRunResult
} {
  return {
    reflex: simulateVacuumAgent(world, 'reflex', maxSteps),
    modelBased: simulateVacuumAgent(world, 'model-based', maxSteps),
  }
}
