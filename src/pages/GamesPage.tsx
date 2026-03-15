import { MazeSolverSection } from '@/features/maze'
import { Puzzle8Section } from '@/features/puzzle8'
import { WumpusWorldSection } from '@/features/wumpus'
import { gameCards } from '@/shared/constants/games'

export function GamesPage() {
  return (
    <main>
      <section className="hero-block hero-block--compact">
        <p className="eyebrow">Game Hub</p>
        <h1>All Mini-Games</h1>
        <p>
          Core engines are being implemented next. The shell already supports animation, loading,
          and reusable AI control panels.
        </p>
      </section>

      <WumpusWorldSection />
      <MazeSolverSection />
      <Puzzle8Section />

      <section className="games-list" aria-label="Game modules">
        {gameCards.map((game) => (
          <article className="games-list__item" id={game.route.replace('/games#', '')} key={game.id}>
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
          </article>
        ))}
      </section>
    </main>
  )
}
