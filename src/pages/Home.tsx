import RatioTrendChart from '../components/RatioTrendChart'
import { Box } from '@mui/material'
import { useState } from 'react'
import SymbolSelect from '../components/SymbolSelect'
import PeriodSelect from '../components/PeriodSelect'
import KlineChart from '../components/KlineChart'
import OpenInterestHistChart from '../components/OpenInterestHistChart'

function Home() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [period, setPeriod] = useState('5m')
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'flex', gap: '24px' }}>
        <SymbolSelect value={symbol} onChange={setSymbol} />
        <PeriodSelect value={period} onChange={setPeriod} />
      </Box>
      <KlineChart symbol={symbol} period={period} />
      <RatioTrendChart symbol={symbol} period={period} />
      <OpenInterestHistChart symbol={symbol} period={period} />
    </Box>
  )
}

export default Home
