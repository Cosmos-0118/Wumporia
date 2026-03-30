import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { prefetchRoute } from '@/app/routeModules'
import { gameCards, gameCategories } from '@/shared/constants/games'

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState<(typeof gameCategories)[number]>('All')

  const visibleGames = useMemo(() => {
    if (activeCategory === 'All') {
      return gameCards
    }

    return gameCards.filter((game) => game.category === activeCategory)
  }, [activeCategory])

  return (
    <main>
      <section className="hero-block">
        <p className="eyebrow">Interactive AI Lab</p>
        <h1>AI Playground with Visual Solvers and Game Intelligence</h1>
        <p>
          Explore classic AI problems through game-like simulations, readable decision traces, and
          step-by-step algorithm animations.
        </p>
        <div className="hero-block__actions">
          <Link
            className="button button--primary"
            to="/games"
            onMouseEnter={() => prefetchRoute('/games')}
            onFocus={() => prefetchRoute('/games')}
          >
            Open All Games
          </Link>
        </div>
      </section>

      <section className="filter-row" id="game-grid" aria-label="Filter games by category">
        {gameCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              category === activeCategory ? 'filter-chip filter-chip--active' : 'filter-chip'
            }
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="game-grid" aria-live="polite">
        {visibleGames.map((game, index) => (
          <motion.article
            key={game.id}
            className="game-card"
            style={{ borderColor: game.accent }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: index * 0.04, duration: 0.32 }}
          >
            <p className="game-card__category" style={{ color: game.accent }}>
              {game.category}
            </p>
            <h2>{game.title}</h2>
            <p>{game.tagline}</p>

            <ul className="game-card__tags" aria-label={`${game.title} algorithms`}>
              {game.algorithms.map((algorithm) => (
                <li key={algorithm}>{algorithm}</li>
              ))}
            </ul>

            <Link
              to={game.route}
              className="game-card__cta"
              onMouseEnter={() => prefetchRoute(game.route)}
              onFocus={() => prefetchRoute(game.route)}
            >
              Open Simulation
            </Link>
          </motion.article>
        ))}
      </section>
    </main>
  )
}
