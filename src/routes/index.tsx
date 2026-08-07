import { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import { Box } from '@mui/material'

import TopBar from '../components/TopBar'
import AlertTape from '../components/AlertTape'
import RouteErrorBoundary from '../components/RouteErrorBoundary'
import { useMessages } from '../i18n'
import { lazyPage } from '../utils/lazyPage'

const Charts = lazyPage(() => import('../pages/Charts'))
const BinancePerpetualMarket = lazyPage(
  () => import('../pages/BinancePerpetualMarket'),
)
const OkxPerpetual = lazyPage(() => import('../pages/OkxPerpetual'))
const TradingDiscipline = lazyPage(() => import('../pages/TradingDiscipline'))

export default function Pages() {
  const t = useMessages()

  return (
    <RouteErrorBoundary fallback={<div>{t.common.loading}</div>}>
      <Suspense fallback={<div>{t.common.loading}</div>}>
        <Router>
          <TopBar />
          {/* 16px on a phone, matching the app bar, so the logo and the content
              below it start on the same line. */}
          <Box
            sx={{
              flex: 1,
              padding: { xs: 2, md: 3 },
              mt: 8,
              // The alert tape is fixed over the bottom of the viewport, so the
              // last row of cards has to stop above it. The strip publishes its
              // own height and takes the property back down to zero when it is
              // not there, which is what keeps this from being dead space on a
              // board where nothing has fired.
              pb: {
                xs: 'calc(var(--vigil-tape-height, 0px) + 16px)',
                md: 'calc(var(--vigil-tape-height, 0px) + 24px)',
              },
            }}
          >
            <Routes>
              <Route path="/" element={<OkxPerpetual />} />
              <Route path="/binance" element={<BinancePerpetualMarket />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/discipline" element={<TradingDiscipline />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
          <AlertTape />
        </Router>
      </Suspense>
    </RouteErrorBoundary>
  )
}
