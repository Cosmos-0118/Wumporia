import { RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { GameLayout } from '@/components/layout/GameLayout'
import { Button } from '@/components/ui/button'
import { Badge, Field, Stat } from '@/components/ui/misc'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { applyHumanMove, createGame } from '@/features/tictactoe/engine/game'
import { applyAutoMove } from '@/features/tictactoe/engine/game'
import type {
  TTTCell,
  TTTDifficulty,
  TTTGameState,
  TTTPlayer,
} from '@/features/tictactoe/types/tictactoe'
import { cn } from '@/lib/cn'

type Mode = 'human' | 'ai'

interface Tally {
  first: number
  second: number
  draws: number
}

const EMPTY_TALLY: Tally = { first: 0, second: 0, draws: 0 }

function Mark({ value }: { value: Exclude<TTTCell, null> }) {
  return (
    <svg viewBox="0 0 40 40" className="size-3/5" fill="none" strokeWidth="4" strokeLinecap="round">
      {value === 'X' ? (
        <>
          <motion.path
            d="M8 8 32 32"
            className="stroke-game"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.path
            d="M32 8 8 32"
            className="stroke-game"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          />
        </>
      ) : (
        <motion.circle
          cx="20"
          cy="20"
          r="13"
          className="stroke-fg"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35 }}
        />
      )}
    </svg>
  )
}

export default function TicTacToeGame() {
  const [mode, setMode] = useState<Mode>('human')
  const [difficulty, setDifficulty] = useState<TTTDifficulty>('hard')
  const [side, setSide] = useState<TTTPlayer>('X')
  const [showScores, setShowScores] = useState(false)
  const [running, setRunning] = useState(false)
  const [game, setGame] = useState<TTTGameState>(() => createGame('X', 'hard'))
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY)

  const gameRef = useRef(game)
  useEffect(() => {
    gameRef.current = game
  })

  useEffect(() => {
    if (mode !== 'ai' || !running) return
    const id = setInterval(() => {
      const current = gameRef.current
      if (current.status === 'playing') {
        setGame(applyAutoMove(current))
        return
      }
      setTally((t) =>
        current.status === 'won'
          ? { ...t, first: t.first + 1 }
          : current.status === 'lost'
            ? { ...t, second: t.second + 1 }
            : { ...t, draws: t.draws + 1 },
      )
      setGame(createGame('X', difficulty))
    }, 650)
    return () => {
      clearInterval(id)
    }
  }, [mode, running, difficulty])

  const restart = (nextSide: TTTPlayer = side, nextDifficulty: TTTDifficulty = difficulty) => {
    setGame(createGame(mode === 'ai' ? 'X' : nextSide, nextDifficulty))
  }

  const play = (index: number) => {
    if (mode !== 'human' || game.status !== 'playing') return
    const next = applyHumanMove(game, index)
    if (next === game) return
    setGame(next)
    if (next.status !== 'playing') {
      setTally((t) =>
        next.status === 'won'
          ? { ...t, first: t.first + 1 }
          : next.status === 'lost'
            ? { ...t, second: t.second + 1 }
            : { ...t, draws: t.draws + 1 },
      )
    }
  }

  const scoreByIndex = new Map(game.lastAnalysis?.candidates.map((c) => [c.index, c.score]))
  const winLine = new Set(game.winInfo?.line)
  const humanMode = mode === 'human'

  const statusLabel =
    game.status === 'playing'
      ? humanMode
        ? game.currentPlayer === game.humanPlayer
          ? 'Your move'
          : 'AI is thinking…'
        : `${game.currentPlayer} to move`
      : game.status === 'draw'
        ? 'Draw'
        : humanMode
          ? game.status === 'won'
            ? 'You win'
            : 'AI wins'
          : `${game.winInfo?.winner ?? ''} wins`

  return (
    <GameLayout
      stage={
        <div className="flex w-full flex-col items-center gap-6">
          <div className="@container grid aspect-square w-[min(100%,max(240px,calc(100vh-23rem)))] grid-cols-3 grid-rows-3 gap-[3cqw]">
            {game.board.map((cell, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Cell ${String(index + 1)}${cell === null ? '' : `, ${cell}`}`}
                disabled={!humanMode || cell !== null || game.status !== 'playing'}
                onClick={() => {
                  play(index)
                }}
                className={cn(
                  'relative flex items-center justify-center rounded-xl border bg-surface-2/60 transition-colors enabled:hover:border-game/60 enabled:hover:bg-game/10',
                  winLine.has(index) && 'border-good bg-good/10',
                )}
              >
                {cell !== null && <Mark value={cell} />}
                {showScores && cell === null && scoreByIndex.has(index) && (
                  <span className="font-mono text-sm text-subtle">{scoreByIndex.get(index)}</span>
                )}
              </button>
            ))}
          </div>
          <Badge
            tone={
              game.status === 'playing'
                ? 'neutral'
                : game.status === 'draw'
                  ? 'warn'
                  : humanMode && game.status === 'lost'
                    ? 'bad'
                    : 'good'
            }
          >
            {statusLabel}
          </Badge>
        </div>
      }
      controls={
        <>
          <Field label="Mode">
            <Segmented
              label="Mode"
              value={mode}
              options={[
                { value: 'human', label: 'You vs AI' },
                { value: 'ai', label: 'AI vs AI' },
              ]}
              onChange={(next) => {
                setMode(next)
                setRunning(false)
                setTally(EMPTY_TALLY)
                setGame(createGame(next === 'ai' ? 'X' : side, difficulty))
              }}
            />
          </Field>
          <Field label="Difficulty">
            <Segmented
              label="Difficulty"
              value={difficulty}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
              onChange={(next) => {
                setDifficulty(next)
                setTally(EMPTY_TALLY)
                restart(side, next)
              }}
            />
          </Field>
          {humanMode ? (
            <Field label="You play">
              <Segmented
                label="Side"
                value={side}
                options={[
                  { value: 'X', label: 'X (first)' },
                  { value: 'O', label: 'O (second)' },
                ]}
                onChange={(next) => {
                  setSide(next)
                  setTally(EMPTY_TALLY)
                  restart(next)
                }}
              />
            </Field>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                setRunning((value) => !value)
              }}
              className="w-full"
            >
              {running ? 'Pause' : 'Start match'}
            </Button>
          )}
          <Switch checked={showScores} onChange={setShowScores} label="Show AI move scores" />
          <Button
            className="w-full"
            onClick={() => {
              restart()
            }}
          >
            <RotateCcw /> New game
          </Button>
        </>
      }
      insightsLabel="AI"
      insights={
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label={humanMode ? 'You' : 'X'} value={tally.first} />
            <Stat label={humanMode ? 'AI' : 'O'} value={tally.second} />
            <Stat label="Draws" value={tally.draws} />
          </div>
          {game.lastAnalysis === null ? (
            <p className="text-sm text-muted">Make a move to see how the AI chose its reply.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Nodes searched" value={game.lastAnalysis.nodesEvaluated} />
                <Stat
                  label="Pruning"
                  value={game.lastAnalysis.alphaBetaUsed ? 'Alpha-beta' : 'Off'}
                />
              </div>
              <div className="text-xs font-medium text-muted">Candidate moves</div>
              <ul className="divide-y overflow-hidden rounded-lg border text-sm">
                {[...game.lastAnalysis.candidates]
                  .sort((a, b) => b.score - a.score)
                  .map((candidate) => (
                    <li
                      key={candidate.index}
                      className={cn(
                        'flex items-center justify-between px-3 py-1.5',
                        candidate.index === game.lastAnalysis?.chosen && 'bg-game/10',
                      )}
                    >
                      <span>Cell {candidate.index + 1}</span>
                      <span className="font-mono tabular-nums">{candidate.score}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      }
    />
  )
}
