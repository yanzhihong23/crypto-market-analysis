import { Typography, Box, Avatar } from '@mui/material'
import { useEffect, useState } from 'react'
import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'
import useIcons from '../hooks/useIcons'

export default function Market() {
  const [tickers, setTickers] = useState<FullTicker[]>([])
  const icons = useIcons()

  const getImgUrl = (symbol: string) => {
    const name = symbol.replace('1000', '').replace('DOM', '')
    return icons.get(name)
  }

  useEffect(() => {
    const socket = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr')

    socket.onopen = () => {
      console.log('socket open')
    }

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.ping) {
          socket.send(JSON.stringify({ pong: Date.now() }))
        } else if (data.length) {
          setTickers((prevTickers) => {
            const updatedTickers: FullTicker[] = []
            const existingTickers = prevTickers.reduce((acc, cur) => {
              acc[cur.s] = cur
              return acc
            }, {} as Record<string, FullTicker>)
            data
              .filter((d: FullTicker) => /USDT$/.test(d.s))
              .forEach((d: FullTicker) => {
                if (existingTickers[d.s]) {
                  Object.assign(existingTickers[d.s], d)
                  updatedTickers.push(existingTickers[d.s])
                  delete existingTickers[d.s]
                } else {
                  updatedTickers.push(d)
                }
              })
            return [...updatedTickers, ...Object.values(existingTickers)].sort(
              (a, b) => +b.P - +a.P,
            )
          })
        }
      } catch (error) {
        // TODO
      }
    }

    return () => {
      socket.close()
    }
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
      }}
    >
      {tickers.map((t) => (
        <Box
          key={t.s}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: 220,
            border: 'dashed 1px #ccc',
            padding: '8px 0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              src={getImgUrl(t.s)}
              sx={{ width: 32, height: 32 }}
              alt={t.s.charAt(0)}
            >
              {t.s.charAt(0)}
            </Avatar>
            <Typography>{t.s.replace('USDT', '')}</Typography>
          </Box>
          <Typography fontSize={24}>{+t.c}</Typography>
          <Typography
            fontSize={18}
            fontWeight="bold"
            color={+t.p > 0 ? '#82ca9d' : '#E04A59'}
          >
            {+t.p}({+t.P}%)
          </Typography>
          <Typography>
            {+t.l} - {+t.w} - {+t.h}
          </Typography>
          <Typography color="gray">{compactNumberFormatter(+t.q)}</Typography>
        </Box>
      ))}
    </Box>
  )
}
