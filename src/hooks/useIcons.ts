import { useEffect, useState } from 'react'

export default function useIcons() {
  const [icons, setIcons] = useState<Map<string, string>>(new Map())
  const init = async () => {
    const res = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list',
    )
    const data = await res.json()
    const mapping = new Map()

    data.data.forEach((i: { symbol: string; logo: string }) => {
      mapping.set(i.symbol, i.logo)
    })

    setIcons(mapping)
  }

  useEffect(() => {
    init()
  }, [])

  return icons
}
