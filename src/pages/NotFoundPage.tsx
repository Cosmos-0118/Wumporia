import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main>
      <section className="hero-block hero-block--compact">
        <p className="eyebrow">404</p>
        <h1>Page Not Found</h1>
        <p>The page you requested does not exist. Return to the AI Playground home.</p>
        <div className="hero-block__actions">
          <Link className="button button--primary" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
