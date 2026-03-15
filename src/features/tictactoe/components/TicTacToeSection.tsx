import { useCallback, useState } from 'react'

import { applyHumanMove, createGame, resetGame } from '@/features/tictactoe/engine/game'
import type {
  TTTDifficulty,
  TTTGameState,
  TTTMoveScoreEntry,
  TTTPlayer,
} from '@/features/tictactoe/types/tictactoe'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTIES: TTTDifficulty[] = ['easy', 'medium', 'hard']
const PLAYER_OPTIONS: TTTPlayer[] = ['X', 'O']

function difficultyLabel(d: TTTDifficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function scoreColor(score: number): string {
  if (score > 0) return 'ttt-score--win'
  if (score < 0) return 'ttt-score--lose'
  return 'ttt-score--draw'
}

// ---------------------------------------------------------------------------
// Sub-component: Board
// ---------------------------------------------------------------------------

interface TTTBoardDisplayProps {
  game: TTTGameState
  onCellClick: (index: number) => void
}

function TTTBoardDisplay({ game, onCellClick }: TTTBoardDisplayProps) {
  const { board, winInfo, status, currentPlayer, humanPlayer } = game
  const isPlayerTurn = status === 'playing' && currentPlayer === humanPlayer
  const winSet = new Set<number>(winInfo?.line ?? [])

  return (
    <div className="ttt-board" aria-label="Tic Tac Toe board">
      {board.map((cell, index) => {
        const isWinCell = winSet.has(index)
        const isClickable = cell === null && isPlayerTurn

        const cls = [
          'ttt-cell',
          cell === 'X' ? 'ttt-cell--x' : cell === 'O' ? 'ttt-cell--o' : 'ttt-cell--empty',
          isWinCell ? 'ttt-cell--win' : '',
          isClickable ? 'ttt-cell--clickable' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={index}
            type="button"
            className={cls}
            onClick={() => onCellClick(index)}
            disabled={!isClickable}
            aria-label={cell ?? `empty cell ${String(index + 1)}`}
          >
            {cell !== null && (
              <span className="ttt-cell__mark">{cell}</span>
            )}
            {cell === null && isClickable && (
              <span className="ttt-cell__ghost">{humanPlayer}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Status banner
// ---------------------------------------------------------------------------

function StatusBanner({ game }: { game: TTTGameState }) {
  const { status, currentPlayer, humanPlayer, winInfo } = game

  let message: string
  let cls = 'ttt-status'

  if (status === 'won') {
    message = '🎉 You win!'
    cls += ' ttt-status--win'
  } else if (status === 'lost') {
    message = `🤖 AI wins! (${winInfo?.winner ?? 'O'})`
    cls += ' ttt-status--lose'
  } else if (status === 'draw') {
    message = "🤝 It's a draw!"
    cls += ' ttt-status--draw'
  } else if (currentPlayer === humanPlayer) {
    message = `Your turn (${humanPlayer})`
    cls += ' ttt-status--playing'
  } else {
    message = 'AI is thinking…'
    cls += ' ttt-status--thinking'
  }

  return <div className={cls}>{message}</div>
}

// ---------------------------------------------------------------------------
// Sub-component: AI decision breakdown (Step 33)
// ---------------------------------------------------------------------------

function AIBreakdownPanel({ game }: { game: TTTGameState }) {
  const { lastAnalysis } = game
  if (lastAnalysis === null) {
    return (
      <div className="ttt-breakdown ttt-breakdown--empty">
        <p>Play a move to see the AI's decision breakdown.</p>
      </div>
    )
  }

  const { candidates, chosen, alphaBetaUsed, nodesEvaluated, difficulty } = lastAnalysis

  return (
    <div className="ttt-breakdown">
      <div className="ttt-breakdown__header">
        <span className="ttt-breakdown__title">AI Decision Breakdown</span>
        <span className="ttt-breakdown__meta">
          {nodesEvaluated.toLocaleString()} nodes · {difficultyLabel(difficulty)} · {alphaBetaUsed ? 'α-β pruning' : 'random'}
        </span>
      </div>

      <div className="ttt-breakdown__candidates">
        {candidates.map((entry: TTTMoveScoreEntry) => {
          const row = Math.floor(entry.index / 3) + 1
          const col = (entry.index % 3) + 1
          const isChosen = entry.index === chosen
          const barWidth = `${Math.min(100, Math.max(4, Math.abs(entry.score) * 10))}%`
          return (
            <div
              key={entry.index}
              className={`ttt-candidate ${isChosen ? 'ttt-candidate--chosen' : ''}`}
            >
              <div className="ttt-candidate__label">
                <span className="ttt-candidate__cell">
                  ({row},{col})
                </span>
                {isChosen && <span className="ttt-candidate__badge">Chosen</span>}
              </div>
              <div className="ttt-candidate__bar-track">
                <div
                  className={`ttt-candidate__bar ${scoreColor(entry.score)}`}
                  style={{ width: barWidth }}
                />
              </div>
              <span className={`ttt-candidate__score ${scoreColor(entry.score)}`}>
                {entry.score > 0 ? `+${String(entry.score)}` : String(entry.score)}
              </span>
            </div>
          )
        })}
      </div>

      <p className="ttt-breakdown__note">
        Positive score = AI wins · Negative = human wins · 0 = draw
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TicTacToeSection() {
  const [difficulty, setDifficulty] = useState<TTTDifficulty>('hard')
  const [humanPlayer, setHumanPlayer] = useState<TTTPlayer>('X')
  const [game, setGame] = useState<TTTGameState>(() => createGame('X', 'hard'))

  const handleCellClick = useCallback(
    (index: number) => {
      setGame((prev) => applyHumanMove(prev, index))
    },
    [],
  )

  const handleReset = useCallback(() => {
    setGame(resetGame(difficulty, humanPlayer))
  }, [difficulty, humanPlayer])

  const handleDifficultyChange = (next: TTTDifficulty) => {
    setDifficulty(next)
    setGame(resetGame(next, humanPlayer))
  }

  const handlePlayerChange = (next: TTTPlayer) => {
    setHumanPlayer(next)
    setGame(resetGame(difficulty, next))
  }

  const moveCount = game.moveHistory.length

  return (
    <section className="ttt-lab" id="tictactoe" aria-label="Tic Tac Toe AI lab">
      {/* Header */}
      <div className="ttt-lab__header">
        <div>
          <p className="eyebrow">Game Tree Search</p>
          <h2>Tic Tac Toe AI</h2>
          <p>
            Challenge a Minimax AI with optional Alpha-Beta pruning. Choose your difficulty, pick
            your side, and inspect every branch score the AI evaluates before it moves.
          </p>
        </div>
        <div className="ttt-summary-chips">
          <span className="ttt-chip">Move {moveCount}</span>
          <span className={`ttt-chip ttt-chip--diff-${difficulty}`}>
            {difficultyLabel(difficulty)}
          </span>
          <span className="ttt-chip">Playing as {humanPlayer}</span>
        </div>
      </div>

      <div className="ttt-workspace">
        {/* Left column: settings + board */}
        <div className="ttt-board-col">
          {/* Difficulty selector */}
          <div className="ttt-control-group">
            <label className="ttt-control-label">Difficulty</label>
            <div className="ttt-btn-group">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={difficulty === d ? 'ttt-toggle ttt-toggle--active' : 'ttt-toggle'}
                  onClick={() => handleDifficultyChange(d)}
                >
                  {difficultyLabel(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Side selector */}
          <div className="ttt-control-group">
            <label className="ttt-control-label">Play as</label>
            <div className="ttt-btn-group">
              {PLAYER_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={humanPlayer === p ? 'ttt-toggle ttt-toggle--active' : 'ttt-toggle'}
                  onClick={() => handlePlayerChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <StatusBanner game={game} />

          <TTTBoardDisplay game={game} onCellClick={handleCellClick} />

          <button
            type="button"
            className="ttt-reset-btn"
            onClick={handleReset}
          >
            New Game
          </button>
        </div>

        {/* Right column: AI decision breakdown */}
        <div className="ttt-panel-col">
          <AIBreakdownPanel game={game} />

          {/* Move history */}
          {game.moveHistory.length > 0 && (
            <div className="ttt-history-card">
              <h4>Move History</h4>
              <div className="ttt-history-list">
                {game.moveHistory.map((moveIndex, turn) => {
                  const player = turn % 2 === 0 ? 'X' : 'O'
                  const isHuman = player === game.humanPlayer
                  const row = Math.floor(moveIndex / 3) + 1
                  const col = (moveIndex % 3) + 1
                  return (
                    <div
                      key={turn}
                      className={`ttt-history-item ${isHuman ? 'ttt-history-item--human' : 'ttt-history-item--ai'}`}
                    >
                      <span className="ttt-history-item__turn">{turn + 1}</span>
                      <span className="ttt-history-item__player">{player}</span>
                      <span className="ttt-history-item__cell">({row},{col})</span>
                      <span className="ttt-history-item__tag">{isHuman ? 'You' : 'AI'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
