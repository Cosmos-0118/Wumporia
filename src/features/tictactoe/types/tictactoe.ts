/** Board is a 9-element array. 'X' | 'O' | null for each cell. */
export type TTTPlayer = 'X' | 'O'
export type TTTCell = TTTPlayer | null
export type TTTBoard = readonly TTTCell[]

export type TTTDifficulty = 'easy' | 'medium' | 'hard'
export type TTTStatus = 'playing' | 'won' | 'lost' | 'draw'

export interface TTTWinInfo {
  winner: TTTPlayer
  /** Three cell indices of the winning line */
  line: [number, number, number]
}

/** A single move candidate evaluated by Minimax */
export interface TTTMoveScoreEntry {
  index: number
  score: number
  depth: number
}

/** Metadata produced per AI move for the decision breakdown panel */
export interface TTTMoveAnalysis {
  /** All legal moves evaluated at the root, with their Minimax scores */
  candidates: TTTMoveScoreEntry[]
  /** The chosen move index */
  chosen: number
  /** Whether alpha-beta pruning was active */
  alphaBetaUsed: boolean
  /** Total nodes evaluated during this turn */
  nodesEvaluated: number
  /** Difficulty in effect when this move was made */
  difficulty: TTTDifficulty
}

export interface TTTGameState {
  board: TTTBoard
  currentPlayer: TTTPlayer
  status: TTTStatus
  winInfo: TTTWinInfo | null
  moveHistory: number[]
  /** X = human, O = AI by default */
  humanPlayer: TTTPlayer
  difficulty: TTTDifficulty
  lastAnalysis: TTTMoveAnalysis | null
}
