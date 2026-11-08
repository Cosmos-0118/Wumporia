import * as Tooltip from '@radix-ui/react-tooltip'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'

import { TopBar } from '@/components/layout/TopBar'

export function AppShell() {
  return (
    <Tooltip.Provider>
      <TopBar />
      <main className="w-full px-4 py-8 sm:px-6 lg:px-10">
        <Outlet />
      </main>
      <Toaster position="bottom-right" theme="system" />
    </Tooltip.Provider>
  )
}
