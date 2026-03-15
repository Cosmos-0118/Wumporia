import type {
  TTTBoard,
  TTTDifficulty,
  TTTMoveAnalysis,
  TTTMoveScoreEntry,
  TTTPlayer,
} from '@/features/tictactoe/types/tictactoe'
import {
  applyMove,
  checkWin,
  getLegalMoves,
  isDraw,
  isTerminal,
  opponent,
} from '@/features/tictactoe/engine/board'

// ---------------------------------------------------------------------------
// Difficulty configuration
// ---------------------------------------------------------------------------

/**
 * MaxDepth limits how many plies ahead the AI searches.
 * random% is the probability (0–1) of picking a random move instead of optimal.
 *
 * | Level  | Depth | Random |
 * |--------|-------|--------|
 * | easy   |   1   |  0.7   |
 * | medium |   3   |  0.3   |
 * | hard   |  ∞    |  0.0   |
 */
const DIFFICULTY_CONFIG: Record<TTTDifficulty, { maxDepth: number; randomChance: number }> = {
  easy: { maxDepth: 1, randomChance: 0.7 },
  medium: { maxDepth: 4, randomChance: 0.25 },
  hard: { maxDepth: 9, randomChance: 0.0 },
}

// ---------------------------------------------------------------------------
// Static evaluation
// ---------------------------------------------------------------------------

/**
 * Terminal-state score for the maximising player.
 * Rewarding faster wins (depth remaining used as a tiebreaker).
 */
function evaluate(board: TTTBoard, aiPlayer: TTTPlayer, depthRemaining: number): number {
  const win = checkWin(board)
  if (win === null) return 0
  return win.winner === aiPlayer ? 10 + depthRemaining : -(10 + depthRemaining)
}

// ---------------------------------------------------------------------------
// Minimax with Alpha-Beta pruning (Steps 31 + 32)
// ---------------------------------------------------------------------------

function minimax(
  board: TTTBoard,
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  isMaximising: boolean,
  aiPlayer: TTTPlayer,
  counter: { nodes: number },
): number {
  counter.nodes++

  if (isTerminal(board) || depth >= maxDepth) {
    return evaluate(board, aiPlayer, maxDepth - depth)
  }

  const humanPlayer = opponent(aiPlayer)
  const moves = getLegalMoves(board)

  if (isMaximising) {
    let best = -Infinity
    for (const move of moves) {
      const next = applyMove(board, move, aiPlayer)
      const score = minimax(next, depth + 1, maxDepth, alpha, beta, false, aiPlayer, counter)
      if (score > best) best = score
      if (score > alpha) alpha = score
      if (beta <= alpha) break // β-cutoff
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      const next = applyMove(board, move, humanPlayer)
      const score = minimax(next, depth + 1, maxDepth, alpha, beta, true, aiPlayer, counter)
      if (score < best) best = score
      if (score < beta) beta = score
      if (beta <= alpha) break // α-cutoff
    }
    return best
  }
}

// ---------------------------------------------------------------------------
// Public: compute the best AI move
// ---------------------------------------------------------------------------

export function computeAIMove(
  board: TTTBoard,
  aiPlayer: TTTPlayer,
  difficulty: TTTDifficulty,
): TTTMoveAnalysis | null {
  const moves = getLegalMoves(board)
  if (moves.length === 0) return null

  const { maxDepth, randomChance } = DIFFICULTY_CONFIG[difficulty]
  const counter = { nodes: 0 }

  // With some probability (easy/medium) pick an entirely random move
  if (Math.random() < randomChance) {
    const idx = Math.floor(Math.random() * moves.length)
    const chosen = moves[idx] ?? moves[0] ?? 0
    const candidates: TTTMoveScoreEntry[] = moves.map((m) => ({ index: m, score: 0, depth: 0 }))
    return {
      candidates,
      chosen,
      alphaBetaUsed: false,
      nodesEvaluated: 1,
      difficulty,
    }
  }

  const candidates: TTTMoveScoreEntry[] = []
  let bestScore = -Infinity
  let bestMove = moves[0] ?? 0

  for (const move of moves) {
    const next = applyMove(board, move, aiPlayer)
    const score = minimax(next, 1, maxDepth, -Infinity, Infinity, false, aiPlayer, counter)
    candidates.push({ index: move, score, depth: 1 })
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  // Sort candidates for display: best score first
  candidates.sort((a, b) => b.score - a.score)

  return {
    candidates,
    chosen: bestMove,
    alphaBetaUsed: true,
    nodesEvaluated: counter.nodes,
    difficulty,
  }
}
