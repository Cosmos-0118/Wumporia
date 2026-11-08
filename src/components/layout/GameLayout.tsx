import type { ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'

interface GameLayoutProps {
  stage: ReactNode
  controls: ReactNode
  insights: ReactNode
  insightsLabel?: string
}

/** Stage on the left, tabbed side panel on the right (stacks on small screens). */
export function GameLayout({
  stage,
  controls,
  insights,
  insightsLabel = 'Insights',
}: GameLayoutProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_clamp(320px,24vw,460px)]">
      <section className="flex min-h-[420px] lg:min-h-[calc(100vh-17rem)] items-center justify-center rounded-xl border bg-surface p-4 sm:p-8">
        {stage}
      </section>
      <Tabs.Root defaultValue="controls" className="rounded-xl border bg-surface lg:self-start">
        <Tabs.List className="flex gap-1 border-b px-2 pt-2" aria-label="Panel">
          {[
            { value: 'controls', label: 'Controls' },
            { value: 'insights', label: insightsLabel },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="relative -mb-px h-9 px-3 text-sm font-medium text-muted transition-colors hover:text-fg data-[state=active]:text-fg data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:bottom-0 data-[state=active]:after:h-px data-[state=active]:after:bg-fg"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="controls" className="space-y-5 p-4">
          {controls}
        </Tabs.Content>
        <Tabs.Content value="insights" className="space-y-5 p-4">
          {insights}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
