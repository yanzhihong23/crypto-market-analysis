import { useEffect, useState } from 'react'
import { fetchBinanceExchangeInfo } from '../apis'

export function useBinanceSymbols() {
  const [symbols, setSymbols] = useState<string[]>([])

  const init = async () => {
    const res = await fetchBinanceExchangeInfo()
    if (res.symbols.length) {
      setSymbols(res.symbols.map((i) => i.symbol))
    }
  }

  useEffect(() => {
    init()
  }, [])

  return symbols
}

// export function useOkxSymbols() {}
