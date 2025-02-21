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
import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SortIcon from '@mui/icons-material/Sort'

import { compactNumberFormatter } from '../utils'
import {
  OkxFundingRate,
  OkxOpenInterest,
  OkxTicker,
  OkxTickerFormatted,
  OpenTime,
  SortBy,
} from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { useOkxInstruments } from '../hooks/useOkxInstruments'
import OkxTickerCard from '../components/OkxTickerCard'
import useOkxKlineUpdater from '../hooks/useOkxKlineUpdater'
import useOkxTickerFormat from '../hooks/useOkxTickerFormat'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'

interface TickerResponse {
  arg: {
    channel: string
    instId: string
  }
  data: OkxTicker[] | OkxOpenInterest[] | OkxFundingRate[]
}

export default function OkxPerpetual() {
  const openTime = useTickerStore((state) => state.openTime)
  const sortBy = useTickerStore((state) => state.sortBy)
  const setOpenTime = useTickerStore((state) => state.setOpenTime)
  const setSortBy = useTickerStore((state) => state.setSortBy)
  const [tickers, setTickers] = useState<OkxTickerFormatted[]>([])
  const [rawTickers, setRawTickers] = useState<
    Record<
      string,
      {
        ticker?: OkxTicker
        openInterest?: OkxOpenInterest
        fundingRate?: OkxFundingRate
      }
    >
  >({})
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [newInstId, setNewInstId] = useState<string>('')
  const [removeInstId, setRemoveInstId] = useState<string>('')
  const instIds = useTickerStore((state) => state.instIds)
  const setInstIds = useTickerStore((state) => state.setInstIds)
  const instruments = useOkxInstruments()
  const { formatTicker } = useOkxTickerFormat()
  // update kline data
  useOkxKlineUpdater()
  // update ratio data
  useOkxRatioUpdater()

  const filteredInstruments = instruments.filter(
    (i) => !instIds.includes(i.instId),
  )
  const filteredRemoveInstruments = instruments.filter((i) =>
    instIds.some((instId) => instId === i.instId),
  )
  const sortedTickers = useMemo(() => {
    return tickers.sort((a, b) => {
      if (sortBy === SortBy.VOLUME) return +b.volCcyQuote - +a.volCcyQuote
      if (sortBy === SortBy.PERCENT) return +b.percent - +a.percent
      if (sortBy === SortBy.RATIO) return +b.ratio - +a.ratio
      return tickers.indexOf(a) - tickers.indexOf(b)
    })
  }, [tickers, sortBy])

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
        logo: undefined,
        dif: '',
        percent: '',
        vol: '',
        color: '',
        priceColor: '',
        oiCcy: '',
        fundingRate: '',
        ratio: '-',
        volCcyQuote: '',
      })),
    )
  }, [instIds])

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

      setRawTickers((prev) => {
        const instId = res.arg.instId
        const newData = { ...prev[instId] }

        if (res.arg.channel === 'tickers') {
          newData.ticker = res.data[0] as OkxTicker
        } else if (res.arg.channel === 'open-interest') {
          newData.openInterest = res.data[0] as OkxOpenInterest
        } else if (res.arg.channel === 'funding-rate') {
          newData.fundingRate = res.data[0] as OkxFundingRate
        }

        return {
          ...prev,
          [instId]: newData,
        }
      })
    }

    return () => {
      ws.close()
    }
  }, [instIds])

  useEffect(() => {
    setTickers((prevTickers) => {
      return prevTickers.map((prevTicker) => {
        const rawData = rawTickers[prevTicker.instId]
        if (!rawData?.ticker) return prevTicker

        const formattedTicker = formatTicker({
          ticker: rawData.ticker,
          oldTicker: prevTicker,
          openTime,
        })
        if (rawData.openInterest) {
          formattedTicker.oiCcy = compactNumberFormatter(
            Number(rawData.openInterest.oiCcy),
          )
        }
        if (rawData.fundingRate) {
          formattedTicker.fundingRate = (
            +rawData.fundingRate.fundingRate * 10000
          ).toFixed(1)
        }

        return formattedTicker
      })
    })
  }, [rawTickers, openTime, formatTicker])

  return (
    <Box>
      <Stack direction="row" gap={2} flexWrap="wrap">
        {sortedTickers.map((t) => (
          <OkxTickerCard key={t.instId} t={t} />
        ))}
      </Stack>
      <Stack
        direction="row"
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
        <Fab
          variant="extended"
          color={sortBy === SortBy.VOLUME ? 'secondary' : 'default'}
          onClick={() => setSortBy(SortBy.VOLUME)}
        >
          <SortIcon sx={{ mr: 1 }} />
          VOL
        </Fab>
        <Fab
          variant="extended"
          color={sortBy === SortBy.PERCENT ? 'secondary' : 'default'}
          onClick={() => setSortBy(SortBy.PERCENT)}
        >
          <SortIcon sx={{ mr: 1 }} />
          PER
        </Fab>
        <Fab
          variant="extended"
          color={sortBy === SortBy.RATIO ? 'secondary' : 'default'}
          onClick={() => setSortBy(SortBy.RATIO)}
        >
          <SortIcon sx={{ mr: 1 }} />
          L/S
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
