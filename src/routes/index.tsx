import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'

import TopBar from '../components/TopBar'
const Home = lazy(() => import('../pages/Home'))
const BinancePerpetualMarket = lazy(
  () => import('../pages/BinancePerpetualMarket'),
)
const OkxPerpetual = lazy(() => import('../pages/OkxPerpetual'))

export default function Pages() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Router>
        <TopBar />
        <Box sx={{ flex: 1, padding: 3, mt: 8 }}>
          <Routes>
            <Route path="/" element={<OkxPerpetual />} />
            <Route
              path="/binance-perpetual-market"
              element={<BinancePerpetualMarket />}
            />
            <Route path="/charts" element={<Home />} />
          </Routes>
        </Box>
      </Router>
    </Suspense>
  )
}
