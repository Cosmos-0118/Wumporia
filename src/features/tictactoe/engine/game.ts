import type { TTTDifficulty, TTTGameState, TTTPlayer } from '@/features/tictactoe/types/tictactoe'
import {
  EMPTY_BOARD,
  applyMove,
  checkWin,
  isDraw,
  opponent,
} from '@/features/tictactoe/engine/board'
import { computeAIMove } from '@/features/tictactoe/engine/minimax'

function statusForWinner(state: TTTGameState, winner: TTTPlayer): 'won' | 'lost' {
  return winner === state.humanPlayer ? 'won' : 'lost'
}

/**
 * Apply one AI move for the current player.
 * Useful for both standard human-vs-AI turns and AI-vs-AI autoplay.
 */
export function applyAutoMove(state: TTTGameState): TTTGameState {
  if (state.status !== 'playing') return state

  const aiPlayer = state.currentPlayer
  const analysis = computeAIMove(state.board, aiPlayer, state.difficulty)

  if (analysis === null) {
    return {
      ...state,
      currentPlayer: aiPlayer,
      status: 'draw',
      winInfo: null,
      lastAnalysis: null,
    }
  }

  const board = applyMove(state.board, analysis.chosen, aiPlayer)
  const history = [...state.moveHistory, analysis.chosen]
  const aiWin = checkWin(board)

  if (aiWin !== null) {
    return {
      ...state,
      board,
      currentPlayer: opponent(aiPlayer),
      status: statusForWinner(state, aiWin.winner),
      winInfo: aiWin,
      moveHistory: history,
      lastAnalysis: analysis,
    }
  }

  if (isDraw(board)) {
    return {
      ...state,
      board,
      currentPlayer: opponent(aiPlayer),
      status: 'draw',
      winInfo: null,
      moveHistory: history,
      lastAnalysis: analysis,
    }
  }

  return {
    ...state,
    board,
    currentPlayer: opponent(aiPlayer),
    status: 'playing',
    winInfo: null,
    moveHistory: history,
    lastAnalysis: analysis,
  }
}

function applyAiTurn(state: TTTGameState): TTTGameState {
  return applyAutoMove({
    ...state,
    currentPlayer: opponent(state.humanPlayer),
  })
}

export function createGame(
  humanPlayer: TTTPlayer = 'X',
  difficulty: TTTDifficulty = 'hard',
): TTTGameState {
  const initialState: TTTGameState = {
    board: EMPTY_BOARD,
    currentPlayer: 'X', // X always goes first
    status: 'playing',
    winInfo: null,
    moveHistory: [],
    humanPlayer,
    difficulty,
    lastAnalysis: null,
  }

  // If the human chooses O, the AI (X) should immediately take the opening turn.
  if (humanPlayer === 'O') {
    return applyAiTurn(initialState)
  }

  return initialState
}

/** Apply a human move and — if the game continues — trigger the AI response. */
export function applyHumanMove(state: TTTGameState, index: number): TTTGameState {
  if (state.status !== 'playing') return state
  if (state.board[index] !== null) return state
  if (state.currentPlayer !== state.humanPlayer) return state

  const board = applyMove(state.board, index, state.humanPlayer)
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
  return applyAiTurn({
    ...state,
    board,
    currentPlayer: opponent(state.humanPlayer),
    status: 'playing',
    winInfo: null,
    moveHistory: history,
    lastAnalysis: null,
  })
}

export function resetGame(difficulty: TTTDifficulty, humanPlayer: TTTPlayer): TTTGameState {
  return createGame(humanPlayer, difficulty)
}
