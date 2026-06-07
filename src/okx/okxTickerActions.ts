type TickerAction = (instId: string) => Promise<void>

export const okxTickerActions: {
  add: TickerAction
  remove: TickerAction
} = {
  add: async () => {},
  remove: async () => {},
}
