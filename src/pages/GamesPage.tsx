import { Link } from 'react-router-dom'

import { prefetchRoute } from '@/app/routeModules'
import { gameCards } from '@/shared/constants/games'

export function GamesPage() {
  return (
    <main className="games-hub-page">
      <section className="hero-block hero-block--compact games-hub-page__hero">
        <p className="eyebrow">Game Hub</p>
        <h1>All Mini-Games</h1>
        <p>
          Each simulation now has a dedicated page with focused layout and interaction space.
          Choose a game below to enter its full-screen lab.
        </p>
      </section>

      <section className="games-list" aria-label="Game modules">
        {gameCards.map((game) => (
          <Link
            className="games-list__item"
            key={game.id}
            to={game.route}
            onMouseEnter={() => prefetchRoute(game.route)}
            onFocus={() => prefetchRoute(game.route)}
          >
            <article>
              <div>
                <p className="game-card__category">{game.category}</p>
                <h2>{game.title}</h2>
                <p>{game.tagline}</p>
              </div>
              <ul className="game-card__tags">
                {game.algorithms.map((algorithm) => (
                  <li key={algorithm}>{algorithm}</li>
                ))}
              </ul>
              <span className="games-list__open">Open Lab →</span>
            </article>
          </Link>
        ))}
      </section>
    </main>
  )
}
