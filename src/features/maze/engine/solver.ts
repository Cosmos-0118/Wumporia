import { manhattanDistance } from '@/shared/algorithms/heuristics'
import { PriorityQueue, Queue } from '@/shared/algorithms/search'
import type {
  MazeAlgorithm,
  MazeBlueprint,
  MazePosition,
  MazeSolveResult,
  MazeStepFrame,
} from '@/features/maze/types/maze'
import { fromMazeKey, toMazeKey } from '@/features/maze/utils/position'
import { getMazeNeighbors } from '@/features/maze/engine/grid'

interface SearchRecord {
  key: string
  position: MazePosition
  parentKey?: string
  cost: number
  priority: number
}

const algorithmList: MazeAlgorithm[] = ['BFS', 'DFS', 'Uniform Cost', 'Greedy Best First', 'A*']

export { algorithmList }

export function solveMaze(maze: MazeBlueprint, algorithm: MazeAlgorithm): MazeSolveResult {
  const startedAt = Date.now()
  const startKey = toMazeKey(maze.start)
  const goalKey = toMazeKey(maze.goal)
  const exploredKeys: string[] = []
  const frontierKeys = new Set<string>([startKey])
  const bestCostByKey = new Map<string, number>([[startKey, 0]])
  const parentByKey = new Map<string, string | undefined>([[startKey, undefined]])
  const frames: MazeStepFrame[] = []

  if (algorithm === 'DFS') {
    const stack: SearchRecord[] = [{ key: startKey, position: maze.start, cost: 0, priority: 0 }]
    return consumeDepthFirst(
      stack,
      maze,
      goalKey,
      startedAt,
      exploredKeys,
      frontierKeys,
      bestCostByKey,
      parentByKey,
      frames,
    )
  }

  if (algorithm === 'BFS') {
    const queue = new Queue<SearchRecord>()
    queue.enqueue({ key: startKey, position: maze.start, cost: 0, priority: 0 })
    return consumeBreadthFirst(
      queue,
      maze,
      goalKey,
      startedAt,
      exploredKeys,
      frontierKeys,
      bestCostByKey,
      parentByKey,
      frames,
    )
  }

  const priorityQueue = new PriorityQueue<SearchRecord>(
    (left, right) => left.priority - right.priority,
  )
  priorityQueue.enqueue({ key: startKey, position: maze.start, cost: 0, priority: 0 })
  return consumeWeightedSearch(
    priorityQueue,
    maze,
    goalKey,
    algorithm,
    startedAt,
    exploredKeys,
    frontierKeys,
    bestCostByKey,
    parentByKey,
    frames,
  )
}

function consumeBreadthFirst(
  queue: Queue<SearchRecord>,
  maze: MazeBlueprint,
  goalKey: string,
  startedAt: number,
  exploredKeys: string[],
  frontierKeys: Set<string>,
  bestCostByKey: Map<string, number>,
  parentByKey: Map<string, string | undefined>,
  frames: MazeStepFrame[],
): MazeSolveResult {
  while (!queue.isEmpty()) {
    const current = queue.dequeue()
    if (current === undefined) {
      break
    }

    frontierKeys.delete(current.key)
    if (exploredKeys.includes(current.key)) {
      continue
    }

    exploredKeys.push(current.key)
    const pathKeys = reconstructPath(current.key, parentByKey)
    frames.push(
      createFrame(
        frames.length,
        'BFS',
        current.position,
        frontierKeys,
        exploredKeys,
        pathKeys,
        false,
        current.cost,
      ),
    )

    if (current.key === goalKey) {
      return createSuccessResult('BFS', frames, exploredKeys, frontierKeys, current.cost, startedAt)
    }

    for (const neighbor of getMazeNeighbors(current.position, maze)) {
      const neighborKey = toMazeKey(neighbor)
      if (bestCostByKey.has(neighborKey)) {
        continue
      }

      bestCostByKey.set(neighborKey, current.cost + 1)
      parentByKey.set(neighborKey, current.key)
      frontierKeys.add(neighborKey)
      queue.enqueue({
        key: neighborKey,
        position: neighbor,
        parentKey: current.key,
        cost: current.cost + 1,
        priority: current.cost + 1,
      })
    }
  }

  return createFailureResult('BFS', frames, exploredKeys, frontierKeys, startedAt)
}

function consumeDepthFirst(
  stack: SearchRecord[],
  maze: MazeBlueprint,
  goalKey: string,
  startedAt: number,
  exploredKeys: string[],
  frontierKeys: Set<string>,
  bestCostByKey: Map<string, number>,
  parentByKey: Map<string, string | undefined>,
  frames: MazeStepFrame[],
): MazeSolveResult {
  while (stack.length > 0) {
    const current = stack.pop()
    if (current === undefined) {
      break
    }

    frontierKeys.delete(current.key)
    if (exploredKeys.includes(current.key)) {
      continue
    }

    exploredKeys.push(current.key)
    const pathKeys = reconstructPath(current.key, parentByKey)
    frames.push(
      createFrame(
        frames.length,
        'DFS',
        current.position,
        frontierKeys,
        exploredKeys,
        pathKeys,
        false,
        current.cost,
      ),
    )

    if (current.key === goalKey) {
      return createSuccessResult('DFS', frames, exploredKeys, frontierKeys, current.cost, startedAt)
    }

    const neighbors = getMazeNeighbors(current.position, maze).reverse()
    for (const neighbor of neighbors) {
      const neighborKey = toMazeKey(neighbor)
      if (bestCostByKey.has(neighborKey)) {
        continue
      }

      bestCostByKey.set(neighborKey, current.cost + 1)
      parentByKey.set(neighborKey, current.key)
      frontierKeys.add(neighborKey)
      stack.push({
        key: neighborKey,
        position: neighbor,
        parentKey: current.key,
        cost: current.cost + 1,
        priority: current.cost + 1,
      })
    }
  }

  return createFailureResult('DFS', frames, exploredKeys, frontierKeys, startedAt)
}

function consumeWeightedSearch(
  queue: PriorityQueue<SearchRecord>,
  maze: MazeBlueprint,
  goalKey: string,
  algorithm: Exclude<MazeAlgorithm, 'BFS' | 'DFS'>,
  startedAt: number,
  exploredKeys: string[],
  frontierKeys: Set<string>,
  bestCostByKey: Map<string, number>,
  parentByKey: Map<string, string | undefined>,
  frames: MazeStepFrame[],
): MazeSolveResult {
  while (!queue.isEmpty()) {
    const current = queue.dequeue()
    if (current === undefined) {
      break
    }

    frontierKeys.delete(current.key)
    const bestCost = bestCostByKey.get(current.key)
    if (bestCost !== undefined && current.cost > bestCost) {
      continue
    }

    if (!exploredKeys.includes(current.key)) {
      exploredKeys.push(current.key)
    }

    const pathKeys = reconstructPath(current.key, parentByKey)
    frames.push(
      createFrame(
        frames.length,
        algorithm,
        current.position,
        frontierKeys,
        exploredKeys,
        pathKeys,
        false,
        current.cost,
      ),
    )

    if (current.key === goalKey) {
      return createSuccessResult(
        algorithm,
        frames,
        exploredKeys,
        frontierKeys,
        current.cost,
        startedAt,
      )
    }

    for (const neighbor of getMazeNeighbors(current.position, maze)) {
      const neighborKey = toMazeKey(neighbor)
      const tentativeCost = current.cost + 1
      const existingCost = bestCostByKey.get(neighborKey)

      if (existingCost !== undefined && tentativeCost >= existingCost) {
        continue
      }

      bestCostByKey.set(neighborKey, tentativeCost)
      parentByKey.set(neighborKey, current.key)
      frontierKeys.add(neighborKey)
      queue.enqueue({
        key: neighborKey,
        position: neighbor,
        parentKey: current.key,
        cost: tentativeCost,
        priority: scorePriority(algorithm, neighbor, maze.goal, tentativeCost),
      })
    }
  }

  return createFailureResult(algorithm, frames, exploredKeys, frontierKeys, startedAt)
}

function scorePriority(
  algorithm: Exclude<MazeAlgorithm, 'BFS' | 'DFS'>,
  current: MazePosition,
  goal: MazePosition,
  cost: number,
): number {
  const heuristic = manhattanDistance(current, goal)

  if (algorithm === 'Uniform Cost') {
    return cost
  }
  if (algorithm === 'Greedy Best First') {
    return heuristic
  }
  return cost + heuristic
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

function createFrame(
  stepIndex: number,
  algorithm: MazeAlgorithm,
  current: MazePosition,
  frontierKeys: Set<string>,
  exploredKeys: string[],
  pathKeys: string[],
  found: boolean,
  pathCost: number,
): MazeStepFrame {
  return {
    stepIndex,
    timestamp: Date.now(),
    message: found
      ? `${algorithm} reached the goal with cost ${pathCost}.`
      : `${algorithm} expanded ${current.row},${current.col}.`,
    state: {
      algorithm,
      status: found ? 'completed' : 'running',
      step: stepIndex,
      current: {
        id: `${stepIndex}-${current.row}-${current.col}`,
        state: {
          current,
          frontierKeys: [...frontierKeys],
          exploredKeys: [...exploredKeys],
          pathKeys: [...pathKeys],
        },
        cost: pathCost,
        depth: pathKeys.length - 1,
      },
      frontier: [...frontierKeys].map((key, index) => ({
        id: `frontier-${stepIndex}-${index}-${key}`,
        state: {
          current: fromMazeKey(key),
          frontierKeys: [...frontierKeys],
          exploredKeys: [...exploredKeys],
          pathKeys: [...pathKeys],
        },
        cost: 0,
        depth: 0,
      })),
      explored: exploredKeys.map((key, index) => ({
        id: `explored-${stepIndex}-${index}-${key}`,
        state: {
          current: fromMazeKey(key),
          frontierKeys: [...frontierKeys],
          exploredKeys: [...exploredKeys],
          pathKeys: [...pathKeys],
        },
        cost: 0,
        depth: 0,
      })),
      meta: {
        algorithm,
        found,
        pathCost,
      },
    },
  }
}

function createSuccessResult(
  algorithm: MazeAlgorithm,
  frames: MazeStepFrame[],
  exploredKeys: string[],
  frontierKeys: Set<string>,
  pathCost: number,
  startedAt: number,
): MazeSolveResult {
  const finalFrame = frames.at(-1)
  if (finalFrame !== undefined) {
    finalFrame.state.status = 'completed'
    finalFrame.state.meta.found = true
    finalFrame.message = `${algorithm} reached the goal with cost ${pathCost}.`
  }

  return {
    status: 'completed',
    solutionPath: frames
      .map((frame) => frame.state.current?.state)
      .filter((value) => value !== undefined),
    steps: frames,
    exploredCount: exploredKeys.length,
    frontierCount: frontierKeys.size,
    metrics: {
      elapsedMs: Date.now() - startedAt,
      maxFrontierSize: Math.max(...frames.map((frame) => frame.state.frontier.length), 0),
      totalExpansions: exploredKeys.length,
    },
  }
}

function createFailureResult(
  algorithm: MazeAlgorithm,
  frames: MazeStepFrame[],
  exploredKeys: string[],
  frontierKeys: Set<string>,
  startedAt: number,
): MazeSolveResult {
  return {
    status: 'failed',
    solutionPath: frames
      .map((frame) => frame.state.current?.state)
      .filter((value) => value !== undefined),
    steps: frames,
    exploredCount: exploredKeys.length,
    frontierCount: frontierKeys.size,
    metrics: {
      elapsedMs: Date.now() - startedAt,
      maxFrontierSize: Math.max(...frames.map((frame) => frame.state.frontier.length), 0),
      totalExpansions: exploredKeys.length,
    },
    failureReason: `${algorithm} could not reach the goal on this maze.`,
  }
}
