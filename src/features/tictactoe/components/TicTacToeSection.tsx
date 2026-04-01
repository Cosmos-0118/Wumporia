import { useCallback, useEffect, useState } from 'react'

import { applyAutoMove, applyHumanMove, createGame } from '@/features/tictactoe/engine/game'
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
type TTTMatchMode = 'human-vs-ai' | 'ai-vs-ai'
type TTTAutoPlaySpeed = 'slow' | 'normal' | 'fast'

const AUTO_PLAY_SPEEDS: TTTAutoPlaySpeed[] = ['slow', 'normal', 'fast']
const AUTO_PLAY_DELAY_MS: Record<TTTAutoPlaySpeed, number> = {
  slow: 850,
  normal: 420,
  fast: 160,
}

function difficultyLabel(d: TTTDifficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function speedLabel(speed: TTTAutoPlaySpeed): string {
  return speed.charAt(0).toUpperCase() + speed.slice(1)
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
  humanMovesEnabled: boolean
  onCellClick: (index: number) => void
}

function TTTBoardDisplay({ game, humanMovesEnabled, onCellClick }: TTTBoardDisplayProps) {
  const { board, winInfo, status, currentPlayer, humanPlayer } = game
  const isPlayerTurn = humanMovesEnabled && status === 'playing' && currentPlayer === humanPlayer
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

function StatusBanner({ game, mode }: { game: TTTGameState; mode: TTTMatchMode }) {
  const { status, currentPlayer, humanPlayer, winInfo } = game

  let message: string
  let cls = 'ttt-status'

  if (mode === 'ai-vs-ai') {
    if (status === 'draw') {
      message = "🤝 It's a draw!"
      cls += ' ttt-status--draw'
    } else if (status !== 'playing' && winInfo !== null) {
      message = `🤖 AI (${winInfo.winner}) wins!`
      cls += ' ttt-status--win'
    } else {
      message = `AI (${currentPlayer}) is thinking…`
      cls += ' ttt-status--thinking'
    }
  } else if (status === 'won') {
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

function AIBreakdownPanel({ game, mode }: { game: TTTGameState; mode: TTTMatchMode }) {
  const { lastAnalysis } = game
  if (lastAnalysis === null) {
    return (
      <div className="ttt-breakdown ttt-breakdown--empty">
        <p>
          {mode === 'ai-vs-ai'
            ? 'AI Vs AI is ready. Start or reset the match to watch each AI decision.'
            : "Play a move to see the AI's decision breakdown."}
        </p>
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
        {mode === 'ai-vs-ai'
          ? 'Positive score = current AI wins · Negative = opposing AI wins · 0 = draw'
          : 'Positive score = AI wins · Negative = human wins · 0 = draw'}
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
  const [matchMode, setMatchMode] = useState<TTTMatchMode>('human-vs-ai')
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<TTTAutoPlaySpeed>('normal')
  const [game, setGame] = useState<TTTGameState>(() => createGame('X', 'hard'))

  const buildGameState = useCallback(
    (nextDifficulty: TTTDifficulty, nextHumanPlayer: TTTPlayer, nextMode: TTTMatchMode) => {
      const openingHumanPlayer = nextMode === 'ai-vs-ai' ? 'X' : nextHumanPlayer
      return createGame(openingHumanPlayer, nextDifficulty)
    },
    [],
  )

  const handleCellClick = useCallback(
    (index: number) => {
      if (matchMode !== 'human-vs-ai') return
      setGame((prev) => applyHumanMove(prev, index))
    },
    [matchMode],
  )

  const handleReset = useCallback(() => {
    setGame(buildGameState(difficulty, humanPlayer, matchMode))
  }, [buildGameState, difficulty, humanPlayer, matchMode])

  const handleDifficultyChange = (next: TTTDifficulty) => {
    setDifficulty(next)
    setGame(buildGameState(next, humanPlayer, matchMode))
  }

  const handlePlayerChange = (next: TTTPlayer) => {
    setHumanPlayer(next)
    if (matchMode === 'human-vs-ai') {
      setGame(buildGameState(difficulty, next, matchMode))
    }
  }

  const handleModeChange = (nextMode: TTTMatchMode) => {
    setMatchMode(nextMode)
    setGame(buildGameState(difficulty, humanPlayer, nextMode))
  }

  useEffect(() => {
    if (matchMode !== 'ai-vs-ai') return
    if (game.status !== 'playing') return

    const delay = AUTO_PLAY_DELAY_MS[autoPlaySpeed]
    const timer = window.setTimeout(() => {
      setGame((prev) => applyAutoMove(prev))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [autoPlaySpeed, game.currentPlayer, game.status, matchMode])

  const moveCount = game.moveHistory.length
  const isHumanVsAi = matchMode === 'human-vs-ai'

  return (
    <section className="ttt-lab" id="tictactoe" aria-label="Tic Tac Toe AI lab">
      {/* Header */}
      <div className="ttt-lab__header">
        <div>
          <p className="eyebrow">Game Tree Search</p>
          <h2>Tic Tac Toe AI</h2>
          <p>
            Challenge a Minimax AI with optional Alpha-Beta pruning. Choose your difficulty, pick
            your side, watch AI Vs AI, and inspect every branch score the AI evaluates before it
            moves.
          </p>
        </div>
        <div className="ttt-summary-chips">
          <span className="ttt-chip">Move {moveCount}</span>
          <span className={`ttt-chip ttt-chip--diff-${difficulty}`}>
            {difficultyLabel(difficulty)}
          </span>
          <span className="ttt-chip">{isHumanVsAi ? `Playing as ${humanPlayer}` : 'AI Vs AI'}</span>
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

          {/* Mode selector */}
          <div className="ttt-control-group">
            <label className="ttt-control-label">Mode</label>
            <div className="ttt-btn-group">
              <button
                type="button"
                className={matchMode === 'human-vs-ai' ? 'ttt-toggle ttt-toggle--active' : 'ttt-toggle'}
                onClick={() => handleModeChange('human-vs-ai')}
              >
                Human Vs AI
              </button>
              <button
                type="button"
                className={matchMode === 'ai-vs-ai' ? 'ttt-toggle ttt-toggle--active' : 'ttt-toggle'}
                onClick={() => handleModeChange('ai-vs-ai')}
              >
                AI Vs AI
              </button>
            </div>
          </div>

          <div className="ttt-control-group">
            <label className="ttt-control-label">Speed</label>
            <div className="ttt-btn-group">
              {AUTO_PLAY_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  className={autoPlaySpeed === speed ? 'ttt-toggle ttt-toggle--active' : 'ttt-toggle'}
                  onClick={() => setAutoPlaySpeed(speed)}
                  disabled={isHumanVsAi}
                >
                  {speedLabel(speed)}
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
                  disabled={!isHumanVsAi}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <StatusBanner game={game} mode={matchMode} />

          <TTTBoardDisplay
            game={game}
            humanMovesEnabled={isHumanVsAi}
            onCellClick={handleCellClick}
          />

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
          <AIBreakdownPanel game={game} mode={matchMode} />

          {/* Move history */}
          {game.moveHistory.length > 0 && (
            <div className="ttt-history-card">
              <h4>Move History</h4>
              <div className="ttt-history-list">
                {game.moveHistory.map((moveIndex, turn) => {
                  const player = turn % 2 === 0 ? 'X' : 'O'
                  const isHumanMove = isHumanVsAi && player === game.humanPlayer
                  const usesHumanStyle = isHumanVsAi ? isHumanMove : player === 'X'
                  const row = Math.floor(moveIndex / 3) + 1
                  const col = (moveIndex % 3) + 1
                  return (
                    <div
                      key={turn}
                      className={`ttt-history-item ${usesHumanStyle ? 'ttt-history-item--human' : 'ttt-history-item--ai'}`}
                    >
                      <span className="ttt-history-item__turn">{turn + 1}</span>
                      <span className="ttt-history-item__player">{player}</span>
                      <span className="ttt-history-item__cell">({row},{col})</span>
                      <span className="ttt-history-item__tag">
                        {isHumanVsAi ? (isHumanMove ? 'You' : 'AI') : `AI ${player}`}
                      </span>
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
