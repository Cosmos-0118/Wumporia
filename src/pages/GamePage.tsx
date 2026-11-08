import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { Suspense, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/misc'
import { getGame } from '@/lib/games'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function GamePage() {
  const { gameId } = useParams()
  const game = getGame(gameId)

  if (game === undefined) return <NotFoundPage />

  const { Component } = game

  return (
    <div style={{ '--game': game.accent } as CSSProperties}>
      <motion.div
        key={game.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-3.5" />
            All playgrounds
          </Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{game.title}</h1>
            <Badge>{game.category}</Badge>
          </div>
          <p className="max-w-2xl text-muted">{game.summary}</p>
        </div>
        <Suspense
          fallback={<div className="h-[420px] animate-pulse rounded-xl border bg-surface" />}
        >
          <Component />
        </Suspense>
      </motion.div>
    </div>
  )
}
