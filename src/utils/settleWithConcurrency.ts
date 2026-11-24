/**
 * Like `Promise.allSettled`, but at most `concurrency` tasks run at once.
 *
 * Tasks are factories so work starts only when a slot opens — passing bare
 * promises would start every fetch immediately and the limit would be a no-op.
 */
export async function settleWithConcurrency(
  tasks: Array<() => Promise<unknown>>,
  concurrency: number,
): Promise<PromiseSettledResult<unknown>[]> {
  const limit = Math.max(1, Math.floor(concurrency))
  const results: PromiseSettledResult<unknown>[] = new Array(tasks.length)
  let next = 0

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    async () => {
      while (next < tasks.length) {
        const index = next
        next += 1
        try {
          const value = await tasks[index]()
          results[index] = { status: 'fulfilled', value }
        } catch (reason) {
          results[index] = { status: 'rejected', reason }
        }
      }
    },
  )

  await Promise.all(workers)
  return results
}
