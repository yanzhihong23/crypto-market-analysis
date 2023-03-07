import RatioTrendChart from '../components/RatioTrendChart'
import { Box } from '@mui/material'
import { useState } from 'react'
import SymbolSelect from '../components/SymbolSelect'
import PeriodSelect from '../components/PeriodSelect'
import KlineChart from '../components/KlineChart'
import OpenInterestHistChart from '../components/OpenInterestHistChart'
import Ticker from '../components/Ticker'
import { v4 as uuid } from 'uuid'

function Home() {
  const syncId = uuid()
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [period, setPeriod] = useState('5m')
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <Ticker symbol={symbol} />
      <Box sx={{ display: 'flex', gap: '24px' }}>
        <SymbolSelect value={symbol} onChange={setSymbol} />
        <PeriodSelect value={period} onChange={setPeriod} />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <KlineChart symbol={symbol} period={period} syncId={syncId} />
        <RatioTrendChart symbol={symbol} period={period} syncId={syncId} />
        <OpenInterestHistChart
          symbol={symbol}
          period={period}
          syncId={syncId}
        />
      </Box>
    </Box>
  )
}

export default Home
