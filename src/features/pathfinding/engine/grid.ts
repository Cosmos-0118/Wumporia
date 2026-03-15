import type {
  PathNodePosition,
  PathfindingBlueprint,
  PathfindingTool,
  WeightedTerrain,
} from '@/features/pathfinding/types/pathfinding'
import { isSamePathPosition, toPathKey } from '@/features/pathfinding/utils/position'

export const defaultPathfindingBlueprint: PathfindingBlueprint = {
  rows: 9,
  cols: 12,
  start: { row: 0, col: 0 },
  goal: { row: 8, col: 11 },
  obstacles: [
    { row: 1, col: 3 },
    { row: 1, col: 4 },
    { row: 1, col: 5 },
    { row: 2, col: 5 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
    { row: 3, col: 8 },
    { row: 4, col: 8 },
    { row: 5, col: 1 },
    { row: 5, col: 2 },
    { row: 5, col: 6 },
    { row: 6, col: 6 },
    { row: 7, col: 9 },
  ],
  weightedTiles: [
    { row: 0, col: 5, cost: 4 },
    { row: 0, col: 6, cost: 4 },
    { row: 2, col: 8, cost: 6 },
    { row: 4, col: 3, cost: 5 },
    { row: 4, col: 4, cost: 5 },
    { row: 6, col: 10, cost: 7 },
  ],
}

export function clonePathfindingMap(map: PathfindingBlueprint): PathfindingBlueprint {
  return {
    ...map,
    start: { ...map.start },
    goal: { ...map.goal },
    obstacles: map.obstacles.map((cell) => ({ ...cell })),
    weightedTiles: map.weightedTiles.map((tile) => ({ ...tile })),
  }
}

export function getTerrainCost(map: PathfindingBlueprint, position: PathNodePosition): number {
  const weighted = map.weightedTiles.find((tile) => isSamePathPosition(tile, position))
  return weighted?.cost ?? 1
}

export function getPathNeighbors(
  position: PathNodePosition,
  map: PathfindingBlueprint,
): Array<{ position: PathNodePosition; moveCost: number }> {
  const candidates = [
    { row: position.row - 1, col: position.col },
    { row: position.row + 1, col: position.col },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
  ]
  const obstacleKeys = new Set(map.obstacles.map(toPathKey))

  return candidates
    .filter(
      (candidate) =>
        candidate.row >= 0 &&
        candidate.row < map.rows &&
        candidate.col >= 0 &&
        candidate.col < map.cols &&
        !obstacleKeys.has(toPathKey(candidate)),
    )
    .map((candidate) => ({
      position: candidate,
      moveCost: getTerrainCost(map, candidate),
    }))
}

function withoutPosition<T extends PathNodePosition>(items: T[], position: PathNodePosition): T[] {
  return items.filter((item) => !isSamePathPosition(item, position))
}

export function updatePathfindingCell(
  map: PathfindingBlueprint,
  position: PathNodePosition,
  tool: PathfindingTool,
): PathfindingBlueprint {
  const nextMap = clonePathfindingMap(map)

  if (tool === 'start') {
    if (isSamePathPosition(position, nextMap.goal)) {
      return nextMap
    }
    nextMap.start = position
    nextMap.obstacles = withoutPosition(nextMap.obstacles, position)
    nextMap.weightedTiles = withoutPosition(nextMap.weightedTiles, position)
    return nextMap
  }

  if (tool === 'goal') {
    if (isSamePathPosition(position, nextMap.start)) {
      return nextMap
    }
    nextMap.goal = position
    nextMap.obstacles = withoutPosition(nextMap.obstacles, position)
    nextMap.weightedTiles = withoutPosition(nextMap.weightedTiles, position)
    return nextMap
  }

  if (tool === 'obstacle') {
    if (isSamePathPosition(position, nextMap.start) || isSamePathPosition(position, nextMap.goal)) {
      return nextMap
    }
    const exists = nextMap.obstacles.some((cell) => isSamePathPosition(cell, position))
    nextMap.weightedTiles = withoutPosition(nextMap.weightedTiles, position)
    nextMap.obstacles = exists
      ? withoutPosition(nextMap.obstacles, position)
      : [...nextMap.obstacles, position]
    return nextMap
  }

  if (tool === 'weight') {
    if (isSamePathPosition(position, nextMap.start) || isSamePathPosition(position, nextMap.goal)) {
      return nextMap
    }
    nextMap.obstacles = withoutPosition(nextMap.obstacles, position)
    const existing = nextMap.weightedTiles.find((tile) => isSamePathPosition(tile, position))
    if (existing !== undefined) {
      nextMap.weightedTiles = nextMap.weightedTiles.filter(
        (tile) => !isSamePathPosition(tile, position),
      )
    } else {
      nextMap.weightedTiles = [
        ...nextMap.weightedTiles,
        { row: position.row, col: position.col, cost: 5 },
      ]
    }
    return nextMap
  }

  nextMap.obstacles = withoutPosition(nextMap.obstacles, position)
  nextMap.weightedTiles = withoutPosition(nextMap.weightedTiles, position)
  return nextMap
}

export function randomizePathfindingMap(map: PathfindingBlueprint): PathfindingBlueprint {
  const nextMap = clonePathfindingMap(map)
  const obstacles: PathNodePosition[] = []
  const weightedTiles: WeightedTerrain[] = []

  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const position = { row, col }
      if (isSamePathPosition(position, map.start) || isSamePathPosition(position, map.goal)) {
        continue
      }
      const roll = Math.random()
      if (roll < 0.14) {
        obstacles.push(position)
      } else if (roll < 0.24) {
        weightedTiles.push({ row, col, cost: 4 + Math.floor(Math.random() * 4) })
      }
    }
  }

  nextMap.obstacles = obstacles
  nextMap.weightedTiles = weightedTiles
  return nextMap
}
