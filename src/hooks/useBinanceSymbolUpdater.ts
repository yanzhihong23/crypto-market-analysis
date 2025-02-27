import { useEffect } from 'react'

import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { fetchBinanceExchangeInfo } from '../apis'

export default function useBinanceSymbolUpdater() {
  const setSymbols = useBinanceTickerStore((state) => state.setSymbols)

  useEffect(() => {
    fetchBinanceExchangeInfo().then((res) => {
      setSymbols(
        res.symbols
          .map((symbol) => symbol.symbol)
          .filter((symbol) => symbol.endsWith('USDT')),
      )
    })
  }, [setSymbols])
}
