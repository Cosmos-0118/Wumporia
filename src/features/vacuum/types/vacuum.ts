export type VacuumAgentType = 'reflex' | 'model-based'
export type VacuumAction = 'suck' | 'up' | 'down' | 'left' | 'right' | 'idle'

export interface VacuumPosition {
  row: number
  col: number
}

export interface VacuumBlueprint {
  rows: number
  cols: number
  start: VacuumPosition
  dirtProbability: number
}

export interface VacuumWorld {
  rows: number
  cols: number
  start: VacuumPosition
  dirtKeys: string[]
}

export interface VacuumSnapshot {
  step: number
  action: VacuumAction
  agent: VacuumPosition
  dirtyKeys: string[]
}

export interface VacuumMetrics {
  moves: number
  energyUsed: number
  cleanedTiles: number
  remainingDirty: number
  cleanlinessScore: number
  steps: number
}

export interface VacuumRunResult {
  agentType: VacuumAgentType
  history: VacuumSnapshot[]
  metrics: VacuumMetrics
}
