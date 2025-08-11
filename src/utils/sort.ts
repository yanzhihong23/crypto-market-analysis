import { SortBy } from '../types/okx'

// Low frequency update sorting functions
export const sortByVolume = (
  a: string,
  b: string,
  volCcyQuote: Record<string, string>,
) => +volCcyQuote[b] - +volCcyQuote[a]

export const sortByRatio = (
  a: string,
  b: string,
  ratio: Record<string, { value: string }>,
) => +ratio[b].value - +ratio[a].value

// High frequency update sorting function
export const sortByPercent = (
  a: string,
  b: string,
  percent: Map<string, number>,
) => +(percent.get(b) || 0) - +(percent.get(a) || 0)

// Low frequency update sorting
export const sortByLowFrequency = (
  instIds: string[],
  sortBy: SortBy,
  volCcyQuote: Record<string, string>,
  ratio: Record<string, { value: string }>,
): string[] => {
  const sorted = [...instIds]

  switch (sortBy) {
    case SortBy.VOLUME:
      return sorted.sort((a, b) => sortByVolume(a, b, volCcyQuote))
    case SortBy.RATIO:
      return sorted.sort((a, b) => sortByRatio(a, b, ratio))
    default:
      return sorted
  }
}

// High frequency update sorting
export const sortByHighFrequency = (
  instIds: string[],
  sortBy: SortBy,
  percent: Map<string, number>,
): string[] => {
  if (sortBy !== SortBy.PERCENT) {
    return instIds
  }
  return [...instIds].sort((a, b) => sortByPercent(a, b, percent))
}
