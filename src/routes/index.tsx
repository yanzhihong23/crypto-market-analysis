import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'

import TopBar from '../components/TopBar'
const Home = lazy(() => import('../pages/Home'))
const Market = lazy(() => import('../pages/Market'))
const Watch = lazy(() => import('../pages/Watching'))

export default function Pages() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Router>
        <TopBar />
        <Box sx={{ flex: 1, padding: 3, mt: 8 }}>
          <Routes>
            <Route path="/" element={<Watch />} />
            <Route path="/market" element={<Market />} />
            <Route path="/charts" element={<Home />} />
          </Routes>
        </Box>
      </Router>
    </Suspense>
  )
}
