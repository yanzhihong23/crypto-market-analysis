import {
  Stack,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Autocomplete,
  DialogActions,
  Button,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

import { compactNumberFormatter } from '../utils'
import {
  OkxFundingRate,
  OkxOpenInterest,
  OkxTicker,
  OpenTime,
} from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { useOkxInstruments } from '../hooks/useOkxInstruments'
import { fetchOkxRatio } from '../apis'
import OkxTickerCard from '../components/OkxTickerCard'

interface Ticker extends OkxTicker {
  coin: string
  logo: string
  dif: string
  percent: string
  vol: string
  color: string
  oiCcy: string
  fundingRate: string
  ratio: string
  // openInterest: string
}

interface TickerResponse {
  arg: {
    channel: string
    instId: string
  }
  data: OkxTicker[] | OkxOpenInterest[] | OkxFundingRate[]
}

const tickerFormatter = (
  ticker: OkxTicker,
  oldTicker: Ticker,
  openTime: OpenTime,
) => {
  const open = Number(ticker[openTime])
  const coin = ticker.instId.split('-')[0]
  const change = +ticker.last - open
  const percent = ((change / open) * 100).toFixed(2)
  const vol = compactNumberFormatter(+ticker.volCcy24h * +ticker.last)
  const logo = `https://static.okx.com/cdn/oksupport/asset/currency/icon/${coin.toLowerCase()}.png?x-oss-process=image/format,webp`
  let dif = new Intl.NumberFormat().format(change)
  if (change > 0) dif = '+' + dif

  const color = +ticker.last > +open ? 'success' : 'error'

  return {
    coin,
    logo,
    dif,
    percent,
    vol,
    color,
    oiCcy: oldTicker?.oiCcy,
    fundingRate: oldTicker?.fundingRate,
    ratio: oldTicker?.ratio,
    ...ticker,
  }
}

export default function Watching() {
  const [openTime, setOpenTime] = useState<OpenTime>(OpenTime.UTC0)
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [newInstId, setNewInstId] = useState<string>('')
  const [removeInstId, setRemoveInstId] = useState<string>('')
  const instIds = useTickerStore((state) => state.instIds)
  const setInstIds = useTickerStore((state) => state.setInstIds)
  const instruments = useOkxInstruments()
  const filteredInstruments = instruments.filter(
    (i) => !instIds.includes(i.instId),
  )
  const filteredRemoveInstruments = instruments.filter((i) =>
    instIds.some((instId) => instId === i.instId),
  )

  const updateRatios = useCallback(async () => {
    const ratioMap = new Map<string, string>()

    for (const instId of instIds) {
      const res = await fetchOkxRatio({
        coin: instId.split('-')[0],
        period: '5m',
      })

      ratioMap.set(instId, res[0][1])
    }

    setTickers((prevTickers) => {
      return prevTickers.map((t) => ({
        ...t,
        ratio: ratioMap.get(t.instId) || '',
      }))
    })
  }, [instIds])

  useEffect(() => {
    setTickers(
      instIds.map((i) => ({
        instType: 'SWAP',
        instId: i,
        last: '',
        lastSz: '',
        askPx: '',
        askSz: '',
        bidPx: '',
        bidSz: '',
        open24h: '',
        high24h: '',
        low24h: '',
        volCcy24h: '',
        vol24h: '',
        sodUtc0: '',
        sodUtc8: '',
        ts: '',
        coin: i.split('-')[0],
        logo: '',
        dif: '',
        percent: '',
        vol: '',
        color: '',
        oiCcy: '',
        fundingRate: '',
        ratio: '-',
      })),
    )
  }, [instIds])

  useEffect(() => {
    updateRatios()

    const timer = setInterval(
      () => {
        updateRatios()
      },
      1000 * 60 * 5,
    )

    return () => {
      clearInterval(timer)
    }
  }, [instIds, updateRatios])

  useEffect(() => {
    if (!instIds.length) return

    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public')
    let timer: ReturnType<typeof setTimeout>

    ws.onopen = () => {
      console.log('open')
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          args: [
            ...instIds.map((i) => ({ channel: 'tickers', instId: i })),
            ...instIds.map((i) => ({ channel: 'open-interest', instId: i })),
            ...instIds.map((i) => ({ channel: 'funding-rate', instId: i })),
          ],
        }),
      )
    }

    ws.onmessage = ({ data }: { data: string }) => {
      if (timer) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        ws.send('ping')
      }, 20000)

      const res = JSON.parse(data) as TickerResponse

      if (!res.data) return

      if (res.arg.channel === 'tickers') {
        const nt = res.data[0] as OkxTicker

        // use prevTickers to fix flash
        setTickers((prevTickers) => {
          const index = prevTickers.findIndex((i) => i.instId === nt.instId)
          if (index === -1) return prevTickers

          const ticker = tickerFormatter(nt, prevTickers[index], openTime)
          const arr = Array.from(prevTickers)
          arr[index] = ticker

          return arr
        })
      } else if (res.arg.channel === 'open-interest') {
        setTickers((prevTickers) => {
          const data = res.data[0] as OkxOpenInterest
          const index = prevTickers.findIndex((i) => i.instId === data.instId)
          if (index === -1) return prevTickers

          const arr = prevTickers.slice()
          arr[index].oiCcy = compactNumberFormatter(Number(data.oiCcy))

          return arr
        })
      } else if (res.arg.channel === 'funding-rate') {
        setTickers((prevTickers) => {
          const data = res.data[0] as OkxFundingRate
          const index = prevTickers.findIndex((i) => i.instId === data.instId)
          if (index === -1) return prevTickers

          const arr = prevTickers.slice()
          arr[index].fundingRate = (+data.fundingRate * 10000).toFixed(1)

          return arr
        })
      }
    }

    return () => {
      ws.close()
    }
  }, [openTime, instIds])

  return (
    <Box>
      <Stack direction="row" gap={2} flexWrap="wrap">
        {tickers.map((t) => (
          <OkxTickerCard key={t.instId} t={t} />
        ))}
      </Stack>
      <Stack
        direction="column"
        alignItems="end"
        spacing={2}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setOpenAddDialog(true)}
        >
          <AddIcon />
        </Fab>
        <Fab
          color="secondary"
          aria-label="remove"
          onClick={() => setOpenRemoveDialog(true)}
        >
          <RemoveIcon />
        </Fab>
        <Fab
          variant="extended"
          color={openTime === OpenTime.OPEN24H ? 'secondary' : 'default'}
          onClick={() => setOpenTime(OpenTime.OPEN24H)}
        >
          <AccessTimeIcon sx={{ mr: 1 }} />
          24H
        </Fab>
        <Fab
          variant="extended"
          color={openTime === OpenTime.UTC0 ? 'secondary' : 'default'}
          onClick={() => setOpenTime(OpenTime.UTC0)}
        >
          <AccessTimeIcon sx={{ mr: 1 }} />
          UTC+0
        </Fab>
        <Fab
          variant="extended"
          color={openTime === OpenTime.UTC8 ? 'secondary' : 'default'}
          onClick={() => setOpenTime(OpenTime.UTC8)}
        >
          <AccessTimeIcon sx={{ mr: 1 }} />
          UTC+8
        </Fab>
      </Stack>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add Ticker</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={filteredInstruments}
            getOptionLabel={(option) => option.instId}
            renderInput={(params) => <TextField {...params} label="Ticker" />}
            onChange={(_, value) => {
              if (value) {
                setNewInstId(value.instId)
              }
            }}
            sx={{ width: 300, mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenAddDialog(false)
              setInstIds([...instIds, newInstId])
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRemoveDialog}
        onClose={() => setOpenRemoveDialog(false)}
      >
        <DialogTitle>Remove Ticker</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={filteredRemoveInstruments}
            getOptionLabel={(option) => option.instId}
            renderInput={(params) => <TextField {...params} label="Ticker" />}
            onChange={(_, value) => {
              if (value) {
                setRemoveInstId(value.instId)
              }
            }}
            sx={{ width: 300, mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemoveDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenRemoveDialog(false)
              setInstIds(instIds.filter((i) => i !== removeInstId))
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
