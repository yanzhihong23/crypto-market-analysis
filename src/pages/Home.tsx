import { Box, Fab } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SymbolOverview from '../components/SymbolOverview'
import useMobile from '../hooks/useMobile'
import { useLocalStorage } from 'usehooks-ts'

function Home() {
  const mobile = useMobile()
  const [overviews, setOverviews] = useLocalStorage<
    { symbol: string; period: string }[]
  >('overviews', [
    {
      symbol: 'BTCUSDT',
      period: '5m',
    },
  ])

  const onAdd = () => {
    setOverviews([
      ...overviews,
      {
        symbol: 'ETHUSDT',
        period: '5m',
      },
    ])
  }

  const onRemove = (index: number) => {
    const arr = [...overviews]
    arr.splice(index, 1)

    setOverviews(arr)
  }

  const onSymbolChange = (index: number, symbol: string) => {
    const arr = [...overviews]
    arr[index].symbol = symbol

    setOverviews(arr)
  }

  const onPeriodChange = (index: number, period: string) => {
    const arr = [...overviews]
    arr[index].period = period

    setOverviews(arr)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '48px',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {overviews.map((i, index) => (
        <SymbolOverview
          key={index}
          symbol={i.symbol}
          period={i.period}
          mobile={mobile}
          onRemove={() => onRemove(index)}
          onPeriodChange={(period) => onPeriodChange(index, period)}
          onSymbolChange={(symbol) => onSymbolChange(index, symbol)}
        />
      ))}

      {!mobile && overviews.length < 4 ? (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 50, right: 50 }}
          onClick={onAdd}
        >
          <AddIcon />
        </Fab>
      ) : null}
    </Box>
  )
}

export default Home
