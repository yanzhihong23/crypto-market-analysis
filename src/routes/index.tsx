import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))

export default function Pages() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Router basename="/crypto-market-analysis/">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </Suspense>
  )
}
