import RatioTrendChart from './RatioTrendChart'
import { Box, IconButton } from '@mui/material'
import { useState } from 'react'
import SymbolSelect from './SymbolSelect'
import PeriodSelect from './PeriodSelect'
import KlineChart from './KlineChart'
import OpenInterestHistChart from './OpenInterestHistChart'
import Ticker from './Ticker'
import RemoveIcon from '@mui/icons-material/Remove'
import { v4 as uuid } from 'uuid'

function SymbolOverview({
  mobile,
  onRemove,
}: {
  mobile?: boolean
  onRemove?: () => void
}) {
  const syncId = uuid()
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [period, setPeriod] = useState('5m')
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
        flex: 1,
        // maxWidth: 660,
      }}
    >
      <Ticker symbol={symbol} />
      <Box sx={{ display: 'flex', gap: '24px' }}>
        <SymbolSelect value={symbol} onChange={setSymbol} />
        <PeriodSelect value={period} onChange={setPeriod} />
        {!mobile && (
          <IconButton size="large" aria-label="delete" onClick={onRemove}>
            <RemoveIcon />
          </IconButton>
        )}
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

export default SymbolOverview
