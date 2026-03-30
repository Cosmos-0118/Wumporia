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
  reflexPatrol: VacuumPosition[]
  reflexPatrolIdx: number
  reflexPatrolForward: boolean
}

function createReflexPatrol(world: VacuumWorld): VacuumPosition[] {
  const path: VacuumPosition[] = []

  for (let row = 0; row < world.rows; row += 1) {
    if (row % 2 === 0) {
      for (let col = 0; col < world.cols; col += 1) {
        path.push({ row, col })
      }
    } else {
      for (let col = world.cols - 1; col >= 0; col -= 1) {
        path.push({ row, col })
      }
    }
  }

  if (path.length === 0) {
    return [{ ...world.start }]
  }

  return path
}

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

  if (state.reflexPatrol.length <= 1) {
    return 'idle'
  }

  let nextIdx = state.reflexPatrolForward ? state.reflexPatrolIdx + 1 : state.reflexPatrolIdx - 1

  if (nextIdx >= state.reflexPatrol.length) {
    state.reflexPatrolForward = false
    nextIdx = state.reflexPatrolIdx - 1
  } else if (nextIdx < 0) {
    state.reflexPatrolForward = true
    nextIdx = state.reflexPatrolIdx + 1
  }

  if (nextIdx < 0 || nextIdx >= state.reflexPatrol.length) {
    return 'idle'
  }

  const nextTarget = state.reflexPatrol[nextIdx]
  if (nextTarget === undefined) {
    return 'idle'
  }

  let action: VacuumAction = 'idle'
  if (nextTarget.row < state.agent.row) {
    action = 'up'
  } else if (nextTarget.row > state.agent.row) {
    action = 'down'
  } else if (nextTarget.col < state.agent.col) {
    action = 'left'
  } else if (nextTarget.col > state.agent.col) {
    action = 'right'
  }

  if (action !== 'idle') {
    const next = move(state.agent, action)
    if (inBounds(next, world)) {
      state.reflexPatrolIdx = nextIdx
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
  const reflexPatrol = createReflexPatrol(world)
  const reflexStartIdx = Math.max(
    0,
    reflexPatrol.findIndex(
      (position) => position.row === world.start.row && position.col === world.start.col,
    ),
  )
  const state: SimState = {
    agent: { ...world.start },
    dirtySet: new Set(world.dirtKeys),
    step: 0,
    reflexPatrol,
    reflexPatrolIdx: reflexStartIdx,
    reflexPatrolForward: true,
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
