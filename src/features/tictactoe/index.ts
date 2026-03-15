export { TicTacToeSection } from '@/features/tictactoe/components/TicTacToeSection'
export { applyHumanMove, createGame, resetGame } from '@/features/tictactoe/engine/game'
export {
  WIN_LINES,
  applyMove,
  checkWin,
  getLegalMoves,
  isDraw,
  isTerminal,
  opponent,
} from '@/features/tictactoe/engine/board'
export { computeAIMove } from '@/features/tictactoe/engine/minimax'
export type {
  TTTBoard,
  TTTCell,
  TTTDifficulty,
  TTTGameState,
  TTTMoveAnalysis,
  TTTMoveScoreEntry,
  TTTPlayer,
  TTTStatus,
  TTTWinInfo,
} from '@/features/tictactoe/types/tictactoe'
