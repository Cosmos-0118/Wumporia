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

interface RandomBlueprintOptions {
  size?: number
  pitCount?: number
}

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

export function generateRandomWumpusBlueprint(
  options: RandomBlueprintOptions = {},
): WumpusBlueprint {
  const size = Math.max(4, options.size ?? 6)
  const start = defaultStart
  const allCells = getAllCells(size)

  const goldCandidates = allCells.filter(
    (cell) =>
      !isSamePosition(cell, start) &&
      manhattanDistance(cell, start) >= Math.max(3, Math.floor(size / 2) + 1),
  )
  const gold = pickRandom(
    goldCandidates.length > 0
      ? goldCandidates
      : allCells.filter((cell) => !isSamePosition(cell, start)),
  )
  const safePath = createPathBetween(start, gold)
  const safePathKeys = new Set(safePath.map(toPositionKey))

  const hazardCandidates = allCells.filter((cell) => !safePathKeys.has(toPositionKey(cell)))
  const guardedHazardCandidates = hazardCandidates.filter(
    (cell) => manhattanDistance(cell, start) >= 2,
  )
  const wumpusCandidates =
    guardedHazardCandidates.length > 0 ? guardedHazardCandidates : hazardCandidates
  const defaultPitCount = Math.max(2, Math.floor(size * 0.7))
  const pitCount = Math.min(
    options.pitCount ?? defaultPitCount,
    Math.max(1, hazardCandidates.length - 1),
  )

  const wumpus = pickRandom(wumpusCandidates)
  const pitCandidates =
    guardedHazardCandidates.length > 0
      ? guardedHazardCandidates.filter((cell) => !isSamePosition(cell, wumpus))
      : hazardCandidates.filter((cell) => !isSamePosition(cell, wumpus))
  const pits = sampleUnique(pitCandidates, pitCount)

  return {
    size,
    start,
    pits,
    wumpus,
    gold,
  }
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

function getAllCells(size: number): Array<{ row: number; col: number }> {
  return Array.from({ length: size * size }, (_, index) => ({
    row: Math.floor(index / size),
    col: index % size,
  }))
}

function createPathBetween(
  start: { row: number; col: number },
  goal: { row: number; col: number },
): Array<{ row: number; col: number }> {
  const path = [{ ...start }]
  let cursor = { ...start }

  while (cursor.row !== goal.row || cursor.col !== goal.col) {
    const canMoveRow = cursor.row !== goal.row
    const canMoveCol = cursor.col !== goal.col

    if (canMoveRow && canMoveCol) {
      if (Math.random() > 0.5) {
        cursor = {
          row: cursor.row + Math.sign(goal.row - cursor.row),
          col: cursor.col,
        }
      } else {
        cursor = {
          row: cursor.row,
          col: cursor.col + Math.sign(goal.col - cursor.col),
        }
      }
    } else if (canMoveRow) {
      cursor = {
        row: cursor.row + Math.sign(goal.row - cursor.row),
        col: cursor.col,
      }
    } else {
      cursor = {
        row: cursor.row,
        col: cursor.col + Math.sign(goal.col - cursor.col),
      }
    }

    path.push({ ...cursor })
  }

  return path
}

function manhattanDistance(
  left: { row: number; col: number },
  right: { row: number; col: number },
): number {
  return Math.abs(left.row - right.row) + Math.abs(left.col - right.col)
}

function pickRandom<T>(items: T[]): T {
  const picked = items[Math.floor(Math.random() * items.length)]
  if (picked === undefined) {
    throw new Error('Cannot pick a random item from an empty list.')
  }
  return picked
}

function sampleUnique<T>(items: T[], count: number): T[] {
  const copy = [...items]
  const result: T[] = []

  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const index = Math.floor(Math.random() * copy.length)
    const [next] = copy.splice(index, 1)
    if (next !== undefined) {
      result.push(next)
    }
  }

  return result
}
