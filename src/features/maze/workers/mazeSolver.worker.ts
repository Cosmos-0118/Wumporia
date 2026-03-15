import { expose } from 'comlink'

import { solveMaze } from '@/features/maze/engine/solver'
import type {
  MazeAlgorithm,
  MazeBlueprint,
  MazeFrameSnapshot,
  MazeSolverMeta,
} from '@/features/maze/types/maze'
import type { SearchState } from '@/shared/types/solver'

interface MazeWorkerInput {
  maze: MazeBlueprint
  algorithm: MazeAlgorithm
}

class MazeSolverWorkerApi {
  private input: MazeWorkerInput | null = null
  private state: SearchState<MazeFrameSnapshot, MazeSolverMeta> = {
    algorithm: 'Maze',
    status: 'idle',
    step: 0,
    frontier: [],
    explored: [],
    meta: {
      algorithm: 'BFS',
      found: false,
      pathCost: 0,
    },
  }

  async initialize(input: MazeWorkerInput): Promise<void> {
    this.input = input
  }

  async start() {
    if (this.input === null) {
      throw new Error('Maze worker was started before initialize()')
    }

    const result = solveMaze(this.input.maze, this.input.algorithm)
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

expose(new MazeSolverWorkerApi())
