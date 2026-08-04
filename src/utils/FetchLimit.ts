/**
 * One request at a time, with a gap between them.
 *
 * A limiter is per endpoint rather than shared, because that is how the exchange
 * counts: each statistics path has its own allowance keyed on the caller's IP,
 * so queueing them all together would serialise requests that were never
 * competing and make a cold start take as long as the sum of every series on it.
 *
 * A fixed gap rather than a token bucket. A bucket lets a burst through and then
 * stalls, which is the shape that gets a board of a dozen symbols rate limited
 * on the pass that fills it; a gap paces the whole walk instead, and the polls
 * behind it run on minutes, so nothing here is in a hurry.
 */

type FetchFunction<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>

type QueueItem<TArgs extends unknown[], TResult> = {
  args: TArgs
  resolve: (value: TResult) => void
  reject: (reason: unknown) => void
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

  processQueue(): void {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const { args, resolve, reject } = this.queue.shift()!

    this.fetchFunction(...args)
      .then(resolve, reject)
      .finally(() => {
        // Held busy across the gap as well as across the request. Releasing on
        // the response and letting the timer do the pacing looks equivalent and
        // is not: a request queued *during* the gap finds nothing in flight and
        // starts at once, so the interval only ever applied to callers who were
        // already waiting. Every poller here queues as it walks the watchlist,
        // which is precisely the case that was slipping through — measured, it
        // put same-path requests 316ms apart on an interval set to 500.
        setTimeout(() => {
          this.processing = false
          this.processQueue()
        }, this.interval)
      })
  }

  /**
   * Rejects when the request does. It used to answer a failure with `null`,
   * which reads as an empty series rather than as a series that could not be
   * fetched — the detail dialog tells those two apart and says so, and it can
   * only do that if the failure reaches it.
   */
  fetchWithLimit(...args: TArgs): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      this.queue.push({ args, resolve, reject })
      this.processQueue()
    })
  }
}
