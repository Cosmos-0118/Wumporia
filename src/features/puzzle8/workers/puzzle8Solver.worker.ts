import { expose } from 'comlink'

import { solvePuzzle8 } from '@/features/puzzle8/engine/solver'
import type {
  Puzzle8Algorithm,
  Puzzle8Board,
  Puzzle8SolverMeta,
  Puzzle8Snapshot,
} from '@/features/puzzle8/types/puzzle8'
import type { SearchState } from '@/shared/types/solver'

interface Puzzle8WorkerInput {
  board: Puzzle8Board
  algorithm: Puzzle8Algorithm
}

class Puzzle8SolverWorkerApi {
  private input: Puzzle8WorkerInput | null = null
  private state: SearchState<Puzzle8Snapshot, Puzzle8SolverMeta> = {
    algorithm: 'Puzzle8',
    status: 'idle',
    step: 0,
    frontier: [],
    explored: [],
    meta: {
      algorithm: 'A*',
      nodesExpanded: 0,
      pathLength: 0,
    },
  }

  async initialize(input: Puzzle8WorkerInput): Promise<void> {
    this.input = input
  }

  async start() {
    if (this.input === null) {
      throw new Error('Puzzle8 worker was started before initialize()')
    }

    const result = solvePuzzle8(this.input.board, this.input.algorithm)
    const lastState = result.steps.at(-1)?.state
    if (lastState !== undefined) {
      this.state = lastState
    }
    return result
  }

  async next() {
    return null
  }

  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
  async reset(): Promise<void> {}
  async setSpeed(): Promise<void> {}

  async getState() {
    return this.state
  }
}

expose(new Puzzle8SolverWorkerApi())
