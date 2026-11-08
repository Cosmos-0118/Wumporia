import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/misc'
import { games } from '@/lib/games'

export function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative pt-10 pb-4 text-center sm:pt-16">
        <div className="grid-bg pointer-events-none absolute inset-x-0 -top-14 h-96 opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mx-auto max-w-2xl space-y-5"
        >
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Learn AI by playing with it.
          </h1>
          <p className="mx-auto max-w-lg text-lg text-pretty text-muted">
            Six hands-on playgrounds for search, logic, games, and agents.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/play/wumpus"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-85"
            >
              Start exploring
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <section
        aria-label="Playgrounds"
        className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4"
      >
        {games.map((game, index) => (
          <div key={game.id} style={{ '--game': game.accent } as CSSProperties}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
            >
              <Link
                to={`/play/${game.id}`}
                className="group block overflow-hidden rounded-xl border bg-surface transition-colors hover:border-border-strong"
              >
                <div className="relative h-44 overflow-hidden border-b bg-bg">
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 120%, color-mix(in oklab, var(--game) 28%, transparent), transparent 70%)`,
                    }}
                  />
                  <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.04]">
                    <game.Thumb />
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium">{game.title}</h2>
                    <ArrowRight className="size-4 -translate-x-1 text-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                  <p className="text-sm text-pretty text-muted">{game.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {game.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        ))}
      </section>
    </div>
  )
}
