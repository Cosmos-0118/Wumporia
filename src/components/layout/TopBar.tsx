import { ChevronDown, Moon, Sun } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { getGame, games } from '@/lib/games'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
        <path d="M16 4 29 27H3z" fill="currentColor" />
        <circle cx="12" cy="20" r="2" className="fill-bg" />
        <circle cx="20" cy="20" r="2" className="fill-bg" />
      </svg>
      Wumporia
    </Link>
  )
}

function ThemeToggle() {
  const [light, setLight] = useState(() => document.documentElement.classList.contains('light'))
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        const next = !light
        setLight(next)
        document.documentElement.classList.toggle('light', next)
        try {
          localStorage.setItem('wumporia-theme', next ? 'light' : 'dark')
        } catch {
          /* storage unavailable */
        }
      }}
    >
      {light ? <Moon /> : <Sun />}
    </Button>
  )
}

function GameSwitcher({ currentId }: { currentId: string }) {
  const navigate = useNavigate()
  const current = getGame(currentId)
  if (current === undefined) return null

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium hover:bg-surface-2"
        >
          {current.title}
          <ChevronDown className="size-3.5 text-muted" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 min-w-56 rounded-lg border bg-surface p-1 shadow-xl"
        >
          {games.map((game) => (
            <DropdownMenu.Item
              key={game.id}
              onSelect={() => {
                void navigate(`/play/${game.id}`)
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-2"
            >
              <span className="size-2 rounded-full" style={{ background: game.accent }} />
              {game.title}
              <span className="ml-auto text-xs text-subtle">{game.category}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function TopBar() {
  const { gameId } = useParams()

  return (
    <header className="sticky top-0 z-40 border-b bg-bg/80 backdrop-blur-md">
      <div className="flex h-14 w-full items-center gap-2 px-4 sm:px-6 lg:px-10">
        <Logo />
        {gameId !== undefined && (
          <>
            <span className="text-border-strong select-none" aria-hidden>
              /
            </span>
            <GameSwitcher currentId={gameId} />
          </>
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
