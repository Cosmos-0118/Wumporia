import { TicTacToeSection } from '@/features/tictactoe'
import { GamePageShell } from '@/pages/GamePageShell'

export function TicTacToePage() {
  return (
    <GamePageShell
      eyebrow="Game Playing"
      title="Tic Tac Toe AI"
      description="Challenge Minimax with Alpha-Beta pruning and inspect how branch scores shape each AI move."
      module={<TicTacToeSection />}
    />
  )
}
