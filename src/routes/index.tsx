import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import { Box } from '@mui/material'

import TopBar from '../components/TopBar'
const Charts = lazy(() => import('../pages/Charts'))
const BinancePerpetualMarket = lazy(
  () => import('../pages/BinancePerpetualMarket'),
)
const OkxPerpetual = lazy(() => import('../pages/OkxPerpetual'))

export default function Pages() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Router>
        <TopBar />
        {/* 16px on a phone, matching the app bar, so the logo and the content
            below it start on the same line. */}
        <Box sx={{ flex: 1, padding: { xs: 2, md: 3 }, mt: 8 }}>
          <Routes>
            <Route path="/" element={<OkxPerpetual />} />
            <Route path="/binance" element={<BinancePerpetualMarket />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Router>
    </Suspense>
  )
}
