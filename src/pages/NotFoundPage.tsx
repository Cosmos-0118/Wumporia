import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="font-mono text-sm text-muted">404</div>
      <h1 className="text-2xl font-semibold tracking-tight">Nothing here</h1>
      <Link
        to="/"
        className="inline-flex h-9 items-center rounded-md bg-fg px-4 text-sm font-medium text-bg hover:opacity-85"
      >
        Back home
      </Link>
    </div>
  )
}
