import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface GamePageShellProps {
  eyebrow: string
  title: string
  description: string
  module: ReactNode
}

export function GamePageShell({ eyebrow, title, description, module }: GamePageShellProps) {
  return (
    <main className="game-page">
      <section className="hero-block game-page__hero">
        <div className="game-page__hero-top">
          <p className="eyebrow">{eyebrow}</p>
          <Link className="game-page__back" to="/games">
            Back to Game Hub
          </Link>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className="game-page__module">{module}</section>
    </main>
  )
}
