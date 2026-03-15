export type WumpusDirection = 'up' | 'down' | 'left' | 'right'
export type WumpusStatus = 'exploring' | 'won' | 'lost'
export type WumpusEntity = 'pit' | 'wumpus' | 'gold'

export interface WumpusPosition {
  row: number
  col: number
}

export interface WumpusPercepts {
  breeze: boolean
  smell: boolean
  glitter: boolean
}

export interface WumpusAgentState {
  position: WumpusPosition
  alive: boolean
  hasGold: boolean
  stepsTaken: number
}

export interface WumpusLogEntry {
  turn: number
  message: string
}

export interface WumpusKnowledge {
  visitedCells: string[]
  safeCells: string[]
  suspectedPitCells: string[]
  suspectedWumpusCells: string[]
  currentPercepts: WumpusPercepts
  reasoning: string[]
}

export interface WumpusBlueprint {
  size: number
  start?: WumpusPosition
  pits: WumpusPosition[]
  wumpus: WumpusPosition
  gold: WumpusPosition
}

export interface WumpusWorldState {
  size: number
  blueprint: WumpusBlueprint
  agent: WumpusAgentState
  status: WumpusStatus
  logs: WumpusLogEntry[]
  knowledge: WumpusKnowledge
}

export interface WumpusSolverMeta {
  reasoning: string[]
  status: WumpusStatus
}

export interface WumpusSolverSnapshot {
  agent: WumpusAgentState
  knowledge: WumpusKnowledge
}
