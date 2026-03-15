export type StreamCommand = 'play' | 'pause' | 'next' | 'reset' | 'set-speed'

export interface StreamCommandPayload {
  command: StreamCommand
  speed?: number
}
