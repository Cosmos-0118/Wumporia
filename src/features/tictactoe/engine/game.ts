import type { TTTDifficulty, TTTGameState, TTTPlayer } from '@/features/tictactoe/types/tictactoe'
import {
  EMPTY_BOARD,
  applyMove,
  checkWin,
  isDraw,
  opponent,
} from '@/features/tictactoe/engine/board'
import { computeAIMove } from '@/features/tictactoe/engine/minimax'

export function createGame(
  humanPlayer: TTTPlayer = 'X',
  difficulty: TTTDifficulty = 'hard',
): TTTGameState {
  return {
    board: EMPTY_BOARD,
    currentPlayer: 'X', // X always goes first
    status: 'playing',
    winInfo: null,
    moveHistory: [],
    humanPlayer,
    difficulty,
    lastAnalysis: null,
  }
}

/** Apply a human move and — if the game continues — trigger the AI response. */
export function applyHumanMove(state: TTTGameState, index: number): TTTGameState {
  if (state.status !== 'playing') return state
  if (state.board[index] !== null) return state
  if (state.currentPlayer !== state.humanPlayer) return state

  let board = applyMove(state.board, index, state.humanPlayer)
  const history = [...state.moveHistory, index]

  const win = checkWin(board)
  if (win !== null) {
    return {
      ...state,
      board,
      currentPlayer: opponent(state.humanPlayer),
      status: 'won',
      winInfo: win,
      moveHistory: history,
      lastAnalysis: null,
    }
  }
  if (isDraw(board)) {
    return {
      ...state,
      board,
      currentPlayer: opponent(state.humanPlayer),
      status: 'draw',
      winInfo: null,
      moveHistory: history,
      lastAnalysis: null,
    }
  }

  // AI turn
  const aiPlayer = opponent(state.humanPlayer)
  const analysis = computeAIMove(board, aiPlayer, state.difficulty)

  if (analysis === null) {
    return {
      ...state,
      board,
      currentPlayer: aiPlayer,
      status: 'draw',
      winInfo: null,
      moveHistory: history,
      lastAnalysis: null,
    }
  }

  board = applyMove(board, analysis.chosen, aiPlayer)
  const history2 = [...history, analysis.chosen]

  const aiWin = checkWin(board)
  if (aiWin !== null) {
    return {
      ...state,
      board,
      currentPlayer: state.humanPlayer,
      status: 'lost',
      winInfo: aiWin,
      moveHistory: history2,
      lastAnalysis: analysis,
    }
  }
  if (isDraw(board)) {
    return {
      ...state,
      board,
      currentPlayer: state.humanPlayer,
      status: 'draw',
      winInfo: null,
      moveHistory: history2,
      lastAnalysis: analysis,
    }
  }

  return {
    ...state,
    board,
    currentPlayer: state.humanPlayer,
    status: 'playing',
    winInfo: null,
    moveHistory: history2,
    lastAnalysis: analysis,
  }
}

export function resetGame(difficulty: TTTDifficulty, humanPlayer: TTTPlayer): TTTGameState {
  return createGame(humanPlayer, difficulty)
}
