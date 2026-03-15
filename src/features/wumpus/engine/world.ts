import type {
  WumpusBlueprint,
  WumpusDirection,
  WumpusKnowledge,
  WumpusPercepts,
  WumpusWorldState,
} from '@/features/wumpus/types/wumpus'
import {
  fromPositionKey,
  getNeighbors,
  isSamePosition,
  isWithinBounds,
  movePosition,
  toPositionKey,
} from '@/features/wumpus/utils/position'

const defaultStart = { row: 0, col: 0 }

export const defaultWumpusBlueprint: WumpusBlueprint = {
  size: 4,
  start: defaultStart,
  pits: [
    { row: 2, col: 0 },
    { row: 3, col: 1 },
  ],
  wumpus: { row: 2, col: 3 },
  gold: { row: 0, col: 2 },
}

export function createWumpusWorld(
  blueprint: WumpusBlueprint = defaultWumpusBlueprint,
): WumpusWorldState {
  validateBlueprint(blueprint)

  const start = blueprint.start ?? defaultStart
  const initialKnowledge = deriveKnowledge(blueprint, [start], start)

  return {
    size: blueprint.size,
    blueprint,
    agent: {
      position: start,
      alive: true,
      hasGold: false,
      stepsTaken: 0,
    },
    status: 'exploring',
    logs: [{ turn: 0, message: 'Agent enters the cave at the origin.' }],
    knowledge: initialKnowledge,
  }
}

export function getPercepts(
  blueprint: WumpusBlueprint,
  position: { row: number; col: number },
): WumpusPercepts {
  const neighbors = getNeighbors(position, blueprint.size)
  const breeze = blueprint.pits.some((pit) =>
    neighbors.some((neighbor) => isSamePosition(neighbor, pit)),
  )
  const smell = neighbors.some((neighbor) => isSamePosition(neighbor, blueprint.wumpus))
  const glitter = isSamePosition(position, blueprint.gold)

  return { breeze, smell, glitter }
}

export function deriveKnowledge(
  blueprint: WumpusBlueprint,
  visitedPositions: Array<{ row: number; col: number }>,
  currentPosition: { row: number; col: number },
): WumpusKnowledge {
  const visitedKeys = new Set(visitedPositions.map(toPositionKey))
  const pitSafeKeys = new Set(visitedKeys)
  const wumpusSafeKeys = new Set(visitedKeys)
  const suspectedPitKeys = new Set<string>()
  const suspectedWumpusKeys = new Set<string>()
  const reasoning: string[] = []

  for (const position of visitedPositions) {
    const percepts = getPercepts(blueprint, position)
    const positionKey = toPositionKey(position)
    const neighbors = getNeighbors(position, blueprint.size)

    reasoning.push(`${positionKey} reports ${formatPercepts(percepts)}.`)

    if (!percepts.breeze) {
      for (const neighbor of neighbors) {
        pitSafeKeys.add(toPositionKey(neighbor))
        suspectedPitKeys.delete(toPositionKey(neighbor))
      }
      reasoning.push(`No breeze at ${positionKey}, so adjacent cells are pit-safe.`)
    } else {
      for (const neighbor of neighbors) {
        const key = toPositionKey(neighbor)
        if (!visitedKeys.has(key) && !pitSafeKeys.has(key)) {
          suspectedPitKeys.add(key)
        }
      }
      reasoning.push(
        `Breeze at ${positionKey}, so at least one adjacent unknown cell may hide a pit.`,
      )
    }

    if (!percepts.smell) {
      for (const neighbor of neighbors) {
        wumpusSafeKeys.add(toPositionKey(neighbor))
        suspectedWumpusKeys.delete(toPositionKey(neighbor))
      }
      reasoning.push(`No smell at ${positionKey}, so adjacent cells are Wumpus-safe.`)
    } else {
      for (const neighbor of neighbors) {
        const key = toPositionKey(neighbor)
        if (!visitedKeys.has(key) && !wumpusSafeKeys.has(key)) {
          suspectedWumpusKeys.add(key)
        }
      }
      reasoning.push(`Smell at ${positionKey}, so an adjacent unknown cell may contain the Wumpus.`)
    }
  }

  const safeKeys = new Set([...pitSafeKeys].filter((key) => wumpusSafeKeys.has(key)))

  for (const safeKey of safeKeys) {
    suspectedPitKeys.delete(safeKey)
    suspectedWumpusKeys.delete(safeKey)
  }

  return {
    visitedCells: [...visitedKeys],
    safeCells: [...safeKeys],
    suspectedPitCells: [...suspectedPitKeys],
    suspectedWumpusCells: [...suspectedWumpusKeys],
    currentPercepts: getPercepts(blueprint, currentPosition),
    reasoning,
  }
}

export function moveAgent(world: WumpusWorldState, direction: WumpusDirection): WumpusWorldState {
  if (world.status !== 'exploring') {
    return appendLog(world, 'The run is already finished. Reset to explore again.')
  }

  const nextPosition = movePosition(world.agent.position, direction)
  if (!isWithinBounds(nextPosition, world.size)) {
    return appendLog(world, `Move ${direction} blocked by a cave wall.`)
  }

  const nextAgent = {
    ...world.agent,
    position: nextPosition,
    stepsTaken: world.agent.stepsTaken + 1,
  }

  const nextVisited = [
    ...new Set([...world.knowledge.visitedCells, toPositionKey(nextPosition)]),
  ].map(fromPositionKey)

  const nextKnowledge = deriveKnowledge(world.blueprint, nextVisited, nextPosition)
  const hitPit = world.blueprint.pits.some((pit) => isSamePosition(pit, nextPosition))
  const hitWumpus = isSamePosition(world.blueprint.wumpus, nextPosition)

  if (hitPit || hitWumpus) {
    return {
      ...world,
      agent: { ...nextAgent, alive: false },
      knowledge: nextKnowledge,
      status: 'lost',
      logs: [
        ...world.logs,
        {
          turn: nextAgent.stepsTaken,
          message: hitPit
            ? `Agent moved ${direction} into a pit and was lost.`
            : `Agent moved ${direction} into the Wumpus and was lost.`,
        },
      ],
    }
  }

  return {
    ...world,
    agent: nextAgent,
    knowledge: nextKnowledge,
    logs: [
      ...world.logs,
      {
        turn: nextAgent.stepsTaken,
        message: `Agent moved ${direction} to (${nextPosition.row}, ${nextPosition.col}).`,
      },
    ],
  }
}

export function grabGold(world: WumpusWorldState): WumpusWorldState {
  if (world.status !== 'exploring') {
    return appendLog(world, 'The run is already finished. Reset to explore again.')
  }

  const onGold = isSamePosition(world.agent.position, world.blueprint.gold)
  if (!onGold) {
    return appendLog(world, 'No gold here. Glitter is required before grabbing.')
  }

  const nextAgent = {
    ...world.agent,
    hasGold: true,
  }

  return {
    ...world,
    agent: nextAgent,
    status: 'won',
    logs: [
      ...world.logs,
      {
        turn: nextAgent.stepsTaken,
        message: 'Agent grabs the gold and wins the scenario.',
      },
    ],
  }
}

export function resetWumpusWorld(
  blueprint: WumpusBlueprint = defaultWumpusBlueprint,
): WumpusWorldState {
  return createWumpusWorld(blueprint)
}

function validateBlueprint(blueprint: WumpusBlueprint): void {
  if (blueprint.size < 4) {
    throw new Error('Wumpus world size must be at least 4.')
  }

  const start = blueprint.start ?? defaultStart
  if (!isWithinBounds(start, blueprint.size)) {
    throw new Error('Start position must be inside the board.')
  }

  const occupied = new Map<string, string>()
  const register = (entity: string, position: { row: number; col: number }, allowStart = false) => {
    if (!isWithinBounds(position, blueprint.size)) {
      throw new Error(`${entity} must be placed inside the board.`)
    }

    const key = toPositionKey(position)
    if (!allowStart && key === toPositionKey(start)) {
      throw new Error(`${entity} cannot be placed on the starting tile.`)
    }

    const existing = occupied.get(key)
    if (existing !== undefined) {
      throw new Error(`${entity} overlaps with ${existing}.`)
    }

    occupied.set(key, entity)
  }

  register('gold', blueprint.gold)
  register('wumpus', blueprint.wumpus)
  for (const pit of blueprint.pits) {
    register('pit', pit)
  }
}

function appendLog(world: WumpusWorldState, message: string): WumpusWorldState {
  return {
    ...world,
    logs: [
      ...world.logs,
      {
        turn: world.agent.stepsTaken,
        message,
      },
    ],
  }
}

function formatPercepts(percepts: WumpusPercepts): string {
  const active = [
    percepts.breeze ? 'breeze' : null,
    percepts.smell ? 'smell' : null,
    percepts.glitter ? 'glitter' : null,
  ].filter((value): value is string => value !== null)

  return active.length > 0 ? active.join(', ') : 'silence'
}
