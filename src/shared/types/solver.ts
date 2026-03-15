export type SolverStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed'

export interface SolverMetrics {
  elapsedMs: number
  maxFrontierSize: number
  totalExpansions: number
}

export interface SearchNode<TState> {
  id: string
  state: TState
  parentId?: string
  cost: number
  depth: number
  heuristic?: number
  score?: number
}

export interface SearchState<TState, TMeta = Record<string, unknown>> {
  algorithm: string
  status: SolverStatus
  step: number
  current?: SearchNode<TState>
  frontier: SearchNode<TState>[]
  explored: SearchNode<TState>[]
  meta: TMeta
}

export interface StepFrame<TState, TMeta = Record<string, unknown>> {
  stepIndex: number
  timestamp: number
  message: string
  state: SearchState<TState, TMeta>
}

export interface SolverResult<TState, TMeta = Record<string, unknown>> {
  status: Extract<SolverStatus, 'completed' | 'failed'>
  solutionPath: TState[]
  steps: StepFrame<TState, TMeta>[]
  exploredCount: number
  frontierCount: number
  metrics: SolverMetrics
  failureReason?: string
}
