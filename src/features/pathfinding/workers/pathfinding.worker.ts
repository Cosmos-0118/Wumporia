import { expose } from 'comlink'

import { benchmarkPathfinding, solvePathfinding } from '@/features/pathfinding/engine/solver'
import type {
  PathfindingAlgorithm,
  PathfindingBlueprint,
} from '@/features/pathfinding/types/pathfinding'

interface PathfindingWorkerInput {
  map: PathfindingBlueprint
  algorithm: PathfindingAlgorithm
}

class PathfindingWorkerApi {
  async solve(input: PathfindingWorkerInput) {
    return solvePathfinding(input.map, input.algorithm)
  }

  async benchmark(map: PathfindingBlueprint) {
    return benchmarkPathfinding(map)
  }
}

expose(new PathfindingWorkerApi())
