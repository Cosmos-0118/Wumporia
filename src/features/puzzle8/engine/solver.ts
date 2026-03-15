import { totalManhattanForTiles } from '@/shared/algorithms/heuristics'
import { PriorityQueue, Queue } from '@/shared/algorithms/search'
import type {
  Puzzle8Algorithm,
  Puzzle8Board,
  Puzzle8SolveResult,
  Puzzle8SolverMeta,
  Puzzle8StepFrame,
} from '@/features/puzzle8/types/puzzle8'
import {
  GOAL_BOARD,
  boardKey,
  getBlankIndex,
  getLegalMoves,
  isGoal,
} from '@/features/puzzle8/engine/board'

export const puzzle8AlgorithmList: Puzzle8Algorithm[] = ['BFS', 'Greedy', 'A*']

/** Max nodes to expand before giving up — keeps the browser responsive */
const MAX_NODES = 60_000

const GOAL_ARRAY = [...GOAL_BOARD]

// ---------------------------------------------------------------------------
// Internal search record types
// ---------------------------------------------------------------------------

interface BFSRecord {
  board: Puzzle8Board
  key: string
  parentKey: string | undefined
  movedTile: number | null
  depth: number
}

interface WeightedRecord {
  board: Puzzle8Board
  key: string
  parentKey: string | undefined
  movedTile: number | null
  g: number
  priority: number
}

interface ParentInfo {
  parentKey: string | undefined
  movedTile: number | null
  board: Puzzle8Board
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reconstructPath(
  goalKey: string,
  parentMap: Map<string, ParentInfo>,
): Array<{ board: Puzzle8Board; movedTile: number | null }> {
  const path: Array<{ board: Puzzle8Board; movedTile: number | null }> = []
  let currentKey: string | undefined = goalKey
  while (currentKey !== undefined) {
    const node = parentMap.get(currentKey)
    if (node === undefined) break
    path.unshift({ board: node.board, movedTile: node.movedTile })
    currentKey = node.parentKey
  }
  return path
}

function buildFrames(
  path: Array<{ board: Puzzle8Board; movedTile: number | null }>,
  algorithm: Puzzle8Algorithm,
  nodesExpanded: number,
): Puzzle8StepFrame[] {
  const pathLength = path.length - 1
  return path.map((step, i) => {
    const meta: Puzzle8SolverMeta = { algorithm, nodesExpanded, pathLength }
    return {
      stepIndex: i,
      timestamp: 0,
      message: i === 0 ? 'Initial state' : `Step ${i}: slide tile ${String(step.movedTile ?? 0)}`,
      state: {
        algorithm,
        status: i === pathLength ? 'completed' : 'running',
        step: i,
        current: {
          id: boardKey(step.board),
          state: {
            board: step.board,
            blankIndex: getBlankIndex(step.board),
            movedTile: step.movedTile,
          },
          cost: i,
          depth: i,
        },
        frontier: [],
        explored: [],
        meta,
      },
    }
  })
}

function buildFailedResult(
  initialBoard: Puzzle8Board,
  nodesExpanded: number,
  startedAt: number,
  reason: string,
): Puzzle8SolveResult {
  return {
    status: 'failed',
    solutionPath: [
      {
        board: initialBoard,
        blankIndex: getBlankIndex(initialBoard),
        movedTile: null,
      },
    ],
    steps: [],
    exploredCount: nodesExpanded,
    frontierCount: 0,
    metrics: {
      elapsedMs: Date.now() - startedAt,
      maxFrontierSize: 0,
      totalExpansions: nodesExpanded,
    },
    ...(reason !== '' ? { failureReason: reason } : {}),
  }
}

// ---------------------------------------------------------------------------
// BFS
// ---------------------------------------------------------------------------

function solveBFS(
  initialBoard: Puzzle8Board,
  startKey: string,
  startedAt: number,
): Puzzle8SolveResult {
  const queue = new Queue<BFSRecord>()
  const visited = new Set<string>([startKey])
  const parentMap = new Map<string, ParentInfo>([
    [startKey, { parentKey: undefined, movedTile: null, board: initialBoard }],
  ])
  let nodesExpanded = 0
  let maxFrontierSize = 1

  queue.enqueue({
    board: initialBoard,
    key: startKey,
    parentKey: undefined,
    movedTile: null,
    depth: 0,
  })

  while (!queue.isEmpty()) {
    const record = queue.dequeue()
    if (record === undefined) break
    nodesExpanded++

    if (isGoal(record.board)) {
      const path = reconstructPath(record.key, parentMap)
      const frames = buildFrames(path, 'BFS', nodesExpanded)
      const solutionPath = path.map((s) => ({
        board: s.board,
        blankIndex: getBlankIndex(s.board),
        movedTile: s.movedTile,
      }))
      return {
        status: 'completed',
        solutionPath,
        steps: frames,
        exploredCount: nodesExpanded,
        frontierCount: queue.size,
        metrics: {
          elapsedMs: Date.now() - startedAt,
          maxFrontierSize,
          totalExpansions: nodesExpanded,
        },
      }
    }

    if (nodesExpanded > MAX_NODES) {
      return buildFailedResult(initialBoard, nodesExpanded, startedAt, 'Search limit reached')
    }

    for (const move of getLegalMoves(record.board)) {
      const nextKey = boardKey(move.board)
      if (!visited.has(nextKey)) {
        visited.add(nextKey)
        parentMap.set(nextKey, {
          parentKey: record.key,
          movedTile: move.movedTile,
          board: move.board,
        })
        queue.enqueue({
          board: move.board,
          key: nextKey,
          parentKey: record.key,
          movedTile: move.movedTile,
          depth: record.depth + 1,
        })
        if (queue.size > maxFrontierSize) maxFrontierSize = queue.size
      }
    }
  }

  return buildFailedResult(initialBoard, nodesExpanded, startedAt, 'No solution found')
}

// ---------------------------------------------------------------------------
// Greedy Best-First / A*
// ---------------------------------------------------------------------------

function solveWeighted(
  initialBoard: Puzzle8Board,
  startKey: string,
  algorithm: Exclude<Puzzle8Algorithm, 'BFS'>,
  startedAt: number,
): Puzzle8SolveResult {
  const pq = new PriorityQueue<WeightedRecord>((a, b) => a.priority - b.priority)
  const bestCost = new Map<string, number>([[startKey, 0]])
  const parentMap = new Map<string, ParentInfo>([
    [startKey, { parentKey: undefined, movedTile: null, board: initialBoard }],
  ])
  let nodesExpanded = 0
  let maxFrontierSize = 1

  const h0 = totalManhattanForTiles([...initialBoard], GOAL_ARRAY)
  const initPriority = algorithm === 'A*' ? h0 : h0
  pq.enqueue({
    board: initialBoard,
    key: startKey,
    parentKey: undefined,
    movedTile: null,
    g: 0,
    priority: initPriority,
  })

  while (!pq.isEmpty()) {
    const record = pq.dequeue()
    if (record === undefined) break
    nodesExpanded++

    if (isGoal(record.board)) {
      const path = reconstructPath(record.key, parentMap)
      const frames = buildFrames(path, algorithm, nodesExpanded)
      const solutionPath = path.map((s) => ({
        board: s.board,
        blankIndex: getBlankIndex(s.board),
        movedTile: s.movedTile,
      }))
      return {
        status: 'completed',
        solutionPath,
        steps: frames,
        exploredCount: nodesExpanded,
        frontierCount: pq.size,
        metrics: {
          elapsedMs: Date.now() - startedAt,
          maxFrontierSize,
          totalExpansions: nodesExpanded,
        },
      }
    }

    if (nodesExpanded > MAX_NODES) {
      return buildFailedResult(initialBoard, nodesExpanded, startedAt, 'Search limit reached')
    }

    for (const move of getLegalMoves(record.board)) {
      const nextKey = boardKey(move.board)
      const nextG = record.g + 1
      const existing = bestCost.get(nextKey)
      if (existing !== undefined && existing <= nextG) continue

      bestCost.set(nextKey, nextG)
      parentMap.set(nextKey, {
        parentKey: record.key,
        movedTile: move.movedTile,
        board: move.board,
      })
      const h = totalManhattanForTiles([...move.board], GOAL_ARRAY)
      const priority = algorithm === 'A*' ? nextG + h : h
      pq.enqueue({
        board: move.board,
        key: nextKey,
        parentKey: record.key,
        movedTile: move.movedTile,
        g: nextG,
        priority,
      })
      if (pq.size > maxFrontierSize) maxFrontierSize = pq.size
    }
  }

  return buildFailedResult(initialBoard, nodesExpanded, startedAt, 'No solution found')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function solvePuzzle8(
  initialBoard: Puzzle8Board,
  algorithm: Puzzle8Algorithm,
): Puzzle8SolveResult {
  const startedAt = Date.now()
  const startKey = boardKey(initialBoard)

  if (isGoal(initialBoard)) {
    const trivialPath = [{ board: initialBoard, movedTile: null }]
    return {
      status: 'completed',
      solutionPath: [
        { board: initialBoard, blankIndex: getBlankIndex(initialBoard), movedTile: null },
      ],
      steps: buildFrames(trivialPath, algorithm, 0),
      exploredCount: 0,
      frontierCount: 0,
      metrics: { elapsedMs: 0, maxFrontierSize: 0, totalExpansions: 0 },
    }
  }

  if (algorithm === 'BFS') {
    return solveBFS(initialBoard, startKey, startedAt)
  }

  return solveWeighted(initialBoard, startKey, algorithm, startedAt)
}
