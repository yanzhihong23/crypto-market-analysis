type FetchFunction<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>

type QueueItem<TArgs extends unknown[], TResult> = {
  args: TArgs
  resolve: (value: TResult) => void
}

export class FetchLimiter<TArgs extends unknown[], TResult> {
  private queue: Array<QueueItem<TArgs, TResult>>
  private processing: boolean
  private interval: number
  private fetchFunction: FetchFunction<TArgs, TResult>

  constructor(fetchFunction: FetchFunction<TArgs, TResult>, interval: number) {
    this.queue = []
    this.processing = false
    this.interval = interval
    this.fetchFunction = fetchFunction
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const { args, resolve } = this.queue.shift()!

    try {
      const result = await this.fetchFunction(...args)
      resolve(result)
    } catch (error) {
      console.error(error)
      resolve(null as unknown as TResult)
    } finally {
      this.processing = false
      setTimeout(() => this.processQueue(), this.interval)
    }
  }

  async fetchWithLimit(...args: TArgs): Promise<TResult> {
    return new Promise((resolve) => {
      this.queue.push({ args, resolve })
      this.processQueue()
    })
  }
}
