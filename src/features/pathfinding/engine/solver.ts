import { manhattanDistance } from '@/shared/algorithms/heuristics'
import { PriorityQueue, Queue } from '@/shared/algorithms/search'
import { getPathNeighbors } from '@/features/pathfinding/engine/grid'
import type {
  PathNodePosition,
  PathfindingAlgorithm,
  PathfindingBlueprint,
  PathfindingFrameSnapshot,
  PathfindingSolveResult,
  PathfindingStepFrame,
} from '@/features/pathfinding/types/pathfinding'
import { fromPathKey, toPathKey } from '@/features/pathfinding/utils/position'

interface SearchRecord {
  key: string
  position: PathNodePosition
  cost: number
  priority: number
}

export const pathfindingAlgorithms: PathfindingAlgorithm[] = ['BFS', 'Dijkstra', 'A*']

export function solvePathfinding(
  map: PathfindingBlueprint,
  algorithm: PathfindingAlgorithm,
): PathfindingSolveResult {
  const startedAt = Date.now()
  const startKey = toPathKey(map.start)
  const goalKey = toPathKey(map.goal)
  const closedKeys: string[] = []
  const openKeys = new Set<string>([startKey])
  const costByKey = new Map<string, number>([[startKey, 0]])
  const parentByKey = new Map<string, string | undefined>([[startKey, undefined]])
  const frames: PathfindingStepFrame[] = []

  if (algorithm === 'BFS') {
    const queue = new Queue<SearchRecord>()
    queue.enqueue({ key: startKey, position: map.start, cost: 0, priority: 0 })
    return consumeBreadthFirst(
      queue,
      map,
      goalKey,
      startedAt,
      closedKeys,
      openKeys,
      costByKey,
      parentByKey,
      frames,
    )
  }

  const priorityQueue = new PriorityQueue<SearchRecord>(
    (left, right) => left.priority - right.priority,
  )
  priorityQueue.enqueue({ key: startKey, position: map.start, cost: 0, priority: 0 })

  return consumeWeighted(
    priorityQueue,
    map,
    goalKey,
    algorithm,
    startedAt,
    closedKeys,
    openKeys,
    costByKey,
    parentByKey,
    frames,
  )
}

function consumeBreadthFirst(
  queue: Queue<SearchRecord>,
  map: PathfindingBlueprint,
  goalKey: string,
  startedAt: number,
  closedKeys: string[],
  openKeys: Set<string>,
  costByKey: Map<string, number>,
  parentByKey: Map<string, string | undefined>,
  frames: PathfindingStepFrame[],
): PathfindingSolveResult {
  while (!queue.isEmpty()) {
    const current = queue.dequeue()
    if (current === undefined) {
      break
    }

    openKeys.delete(current.key)
    if (closedKeys.includes(current.key)) {
      continue
    }
    closedKeys.push(current.key)

    const pathKeys = reconstructPath(current.key, parentByKey)
    frames.push(
      createFrame(
        frames.length,
        'BFS',
        current.position,
        openKeys,
        closedKeys,
        pathKeys,
        map,
        costByKey,
        false,
        current.cost,
      ),
    )

    if (current.key === goalKey) {
      return createSuccess(frames, closedKeys, openKeys, startedAt)
    }

    for (const neighbor of getPathNeighbors(current.position, map)) {
      const neighborKey = toPathKey(neighbor.position)
      if (costByKey.has(neighborKey)) {
        continue
      }
      costByKey.set(neighborKey, current.cost + 1)
      parentByKey.set(neighborKey, current.key)
      openKeys.add(neighborKey)
      queue.enqueue({
        key: neighborKey,
        position: neighbor.position,
        cost: current.cost + 1,
        priority: current.cost + 1,
      })
    }
  }

  return createFailure('BFS', frames, closedKeys, openKeys, startedAt)
}

function consumeWeighted(
  queue: PriorityQueue<SearchRecord>,
  map: PathfindingBlueprint,
  goalKey: string,
  algorithm: Exclude<PathfindingAlgorithm, 'BFS'>,
  startedAt: number,
  closedKeys: string[],
  openKeys: Set<string>,
  costByKey: Map<string, number>,
  parentByKey: Map<string, string | undefined>,
  frames: PathfindingStepFrame[],
): PathfindingSolveResult {
  while (!queue.isEmpty()) {
    const current = queue.dequeue()
    if (current === undefined) {
      break
    }

    openKeys.delete(current.key)
    const bestCost = costByKey.get(current.key)
    if (bestCost !== undefined && current.cost > bestCost) {
      continue
    }
    if (!closedKeys.includes(current.key)) {
      closedKeys.push(current.key)
    }

    const pathKeys = reconstructPath(current.key, parentByKey)
    frames.push(
      createFrame(
        frames.length,
        algorithm,
        current.position,
        openKeys,
        closedKeys,
        pathKeys,
        map,
        costByKey,
        false,
        current.cost,
      ),
    )

    if (current.key === goalKey) {
      return createSuccess(frames, closedKeys, openKeys, startedAt)
    }

    for (const neighbor of getPathNeighbors(current.position, map)) {
      const neighborKey = toPathKey(neighbor.position)
      const nextCost = current.cost + neighbor.moveCost
      const previousBest = costByKey.get(neighborKey)
      if (previousBest !== undefined && previousBest <= nextCost) {
        continue
      }

      costByKey.set(neighborKey, nextCost)
      parentByKey.set(neighborKey, current.key)
      openKeys.add(neighborKey)
      const heuristic = manhattanDistance(neighbor.position, map.goal)
      const priority = algorithm === 'A*' ? nextCost + heuristic : nextCost
      queue.enqueue({
        key: neighborKey,
        position: neighbor.position,
        cost: nextCost,
        priority,
      })
    }
  }

  return createFailure(algorithm, frames, closedKeys, openKeys, startedAt)
}

function createFrame(
  stepIndex: number,
  algorithm: PathfindingAlgorithm,
  current: PathNodePosition,
  openKeys: Set<string>,
  closedKeys: string[],
  pathKeys: string[],
  map: PathfindingBlueprint,
  costByKey: Map<string, number>,
  found: boolean,
  pathCost: number,
): PathfindingStepFrame {
  const heuristicByKey: Record<string, number> = {}
  const costSnapshot: Record<string, number> = {}

  for (const key of [...openKeys, ...closedKeys]) {
    const position = fromPathKey(key)
    heuristicByKey[key] = manhattanDistance(position, map.goal)
    const knownCost = costByKey.get(key)
    if (knownCost !== undefined) {
      costSnapshot[key] = knownCost
    }
  }

  const snapshot: PathfindingFrameSnapshot = {
    current,
    openKeys: [...openKeys],
    closedKeys: [...closedKeys],
    pathKeys,
    heuristicByKey,
    costByKey: costSnapshot,
  }

  return {
    stepIndex,
    timestamp: Date.now(),
    message: found
      ? `Reached goal with total cost ${String(pathCost)}`
      : `Exploring ${String(current.row)}, ${String(current.col)}`,
    state: {
      algorithm,
      status: found ? 'completed' : 'running',
      step: stepIndex,
      current: {
        id: toPathKey(current),
        state: snapshot,
        cost: pathCost,
        depth: stepIndex,
        heuristic: manhattanDistance(current, map.goal),
        score: pathCost + manhattanDistance(current, map.goal),
      },
      frontier: [],
      explored: [],
      meta: {
        algorithm,
        found,
        pathCost,
      },
    },
  }
}

function reconstructPath(
  targetKey: string,
  parentByKey: Map<string, string | undefined>,
): string[] {
  const path: string[] = []
  let currentKey: string | undefined = targetKey
  while (currentKey !== undefined) {
    path.unshift(currentKey)
    currentKey = parentByKey.get(currentKey)
  }
  return path
}

function createSuccess(
  frames: PathfindingStepFrame[],
  closedKeys: string[],
  openKeys: Set<string>,
  startedAt: number,
): PathfindingSolveResult {
  const finalFrame = frames.at(-1)
  const pathKeys = finalFrame?.state.current?.state.pathKeys ?? []
  const path = pathKeys.map((key, index) => {
    const current = fromPathKey(key)
    return {
      current,
      openKeys: [],
      closedKeys: [],
      pathKeys: pathKeys.slice(0, index + 1),
      heuristicByKey: {},
      costByKey: {},
    }
  })
  return {
    status: 'completed',
    solutionPath: path,
    steps: frames,
    exploredCount: closedKeys.length,
    frontierCount: openKeys.size,
    metrics: {
      elapsedMs: Date.now() - startedAt,
      maxFrontierSize: Math.max(
        ...frames.map((frame) => frame.state.current?.state.openKeys.length ?? 0),
        0,
      ),
      totalExpansions: closedKeys.length,
    },
  }
}

function createFailure(
  algorithm: PathfindingAlgorithm,
  frames: PathfindingStepFrame[],
  closedKeys: string[],
  openKeys: Set<string>,
  startedAt: number,
): PathfindingSolveResult {
  return {
    status: 'failed',
    solutionPath: [],
    steps: frames,
    exploredCount: closedKeys.length,
    frontierCount: openKeys.size,
    metrics: {
      elapsedMs: Date.now() - startedAt,
      maxFrontierSize: Math.max(
        ...frames.map((frame) => frame.state.current?.state.openKeys.length ?? 0),
        0,
      ),
      totalExpansions: closedKeys.length,
    },
    failureReason: `No path found using ${algorithm}`,
  }
}

export function benchmarkPathfinding(map: PathfindingBlueprint): Array<{
  algorithm: PathfindingAlgorithm
  exploredCount: number
  elapsedMs: number
  pathCost: number
  success: boolean
}> {
  return pathfindingAlgorithms.map((algorithm) => {
    const result = solvePathfinding(map, algorithm)
    const pathCost = result.steps.at(-1)?.state.meta.pathCost ?? 0
    return {
      algorithm,
      exploredCount: result.exploredCount,
      elapsedMs: result.metrics.elapsedMs,
      pathCost,
      success: result.status === 'completed',
    }
  })
}
