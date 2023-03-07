import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

export default function Ticker({ symbol }: { symbol: string }) {
  const [price, setPrice] = useState(0)
  const [isMaker, setIsMaker] = useState(true)
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    const socket = new WebSocket(
      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@aggTrade`,
    )
    const onMessage = (event: MessageEvent) => {
      if (event.data === 'ping') {
        socket.send('pong')
      } else {
        try {
          const data = JSON.parse(event.data)
          setPrice(+data.p)
          setIsMaker(data.m)
          setAmount(data.q)
        } catch (error) {
          // TODO
        }
      }
    }

    socket.addEventListener('message', onMessage)

    return () => {
      socket.removeEventListener('message', onMessage)
      socket.close()
    }
  }, [symbol])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <Typography
        sx={{ fontSize: '48px', lineHeight: 1 }}
        color={!isMaker ? '#82ca9d' : '#E04A59'}
      >
        {price}
      </Typography>
      <Typography sx={{ fontSize: '24px', lineHeight: 1.4 }} color="#999">
        {amount}
      </Typography>
    </Box>
  )
}
