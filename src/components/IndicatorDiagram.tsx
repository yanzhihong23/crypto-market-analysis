import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

import type { DiagramId } from '../i18n/indicators'

/**
 * Schematic charts for the indicators page. Paths are hand-drawn, not live
 * series — the point is to show the geometry each tool is known for, in both
 * colour schemes, without fetching a candle.
 */

type Palette = {
  grid: string
  price: string
  accent: string
  accent2: string
  muted: string
  up: string
  down: string
  fill: string
  label: string
}

function useDiagramPalette(): Palette {
  const theme = useTheme()
  return {
    grid: theme.vars.palette.surface.border,
    price: theme.vars.palette.text.primary,
    accent: theme.vars.palette.primary.main,
    accent2: theme.vars.palette.secondary.main,
    muted: theme.vars.palette.text.secondary,
    up: theme.vars.palette.market.up,
    down: theme.vars.palette.market.down,
    fill: theme.vars.palette.surface.subtle,
    label: theme.vars.palette.text.secondary,
  }
}

function Frame({ children, title }: { children: ReactNode; title?: string }) {
  const p = useDiagramPalette()
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'surface.border',
        // theme.shape is 16; 2 would be 32px on a small schematic and looks
        // ballooned. Keep a light rounding that still matches the cards.
        borderRadius: '16px',
        bgcolor: 'surface.subtle',
        overflow: 'hidden',
        // Cap width so the schematic does not stretch into a thin strip on
        // wide desktops; still fill the card on a phone.
        maxWidth: 520,
      }}
    >
      {title ? (
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            borderBottom: '1px solid',
            borderColor: 'surface.border',
            typography: 'caption',
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          {title}
        </Box>
      ) : null}
      <Box sx={{ px: 1, py: 1.25 }}>
        <svg
          viewBox="0 0 400 200"
          width="100%"
          height="auto"
          role="img"
          aria-hidden={title ? undefined : true}
          aria-label={title}
        >
          <rect x="0" y="0" width="400" height="200" fill="transparent" />
          {/* Light grid */}
          {[40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1="24"
              x2="384"
              y1={y}
              y2={y}
              stroke={p.grid}
              strokeWidth="1"
            />
          ))}
          {children}
        </svg>
      </Box>
    </Box>
  )
}

function Label({
  x,
  y,
  text,
  fill,
  anchor = 'start',
}: {
  x: number | string
  y: number | string
  text: string
  fill: string
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize="11"
      fontFamily="inherit"
      textAnchor={anchor}
    >
      {text}
    </text>
  )
}

function MaDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="MA / EMA">
      {/* Price */}
      <path
        d="M28 150 C60 148, 80 120, 110 110 S160 70, 190 78 S240 100, 270 55 S320 40, 372 48"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {/* Slow MA */}
      <path
        d="M28 155 C90 150, 140 130, 190 115 S280 90, 372 78"
        fill="none"
        stroke={p.accent}
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      {/* Fast MA */}
      <path
        d="M28 152 C70 145, 120 115, 170 95 S250 70, 310 58 S350 55, 372 60"
        fill="none"
        stroke={p.accent2}
        strokeWidth="2"
      />
      <Label x="28" y="24" text="Price" fill={p.price} />
      <Label x="100" y="24" text="EMA (fast)" fill={p.accent2} />
      <Label x="190" y="24" text="MA (slow)" fill={p.accent} />
      {/* Pullback annotation */}
      <circle cx="240" cy="98" r="4" fill={p.up} />
      <Label x="248" y="102" text="pullback hold" fill={p.muted} />
    </Frame>
  )
}

function MacdDiagram() {
  const p = useDiagramPalette()
  const bars = [
    { x: 40, h: -28 },
    { x: 60, h: -18 },
    { x: 80, h: -8 },
    { x: 100, h: 6 },
    { x: 120, h: 18 },
    { x: 140, h: 30 },
    { x: 160, h: 22 },
    { x: 180, h: 10 },
    { x: 200, h: -4 },
    { x: 220, h: -16 },
    { x: 240, h: -26 },
    { x: 260, h: -12 },
    { x: 280, h: 8 },
    { x: 300, h: 24 },
    { x: 320, h: 36 },
    { x: 340, h: 28 },
    { x: 360, h: 14 },
  ]
  const zero = 130
  return (
    <Frame title="MACD">
      <line
        x1="28"
        x2="380"
        y1={zero}
        y2={zero}
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {bars.map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={b.h >= 0 ? zero - b.h : zero}
          width="12"
          height={Math.abs(b.h)}
          rx="1"
          fill={b.h >= 0 ? p.up : p.down}
          opacity="0.75"
        />
      ))}
      <path
        d="M34 160 C80 155, 110 140, 150 100 S220 90, 250 150 S310 90, 372 70"
        fill="none"
        stroke={p.accent}
        strokeWidth="2"
      />
      <path
        d="M34 158 C90 152, 130 135, 170 115 S240 110, 270 140 S330 100, 372 88"
        fill="none"
        stroke={p.accent2}
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <Label x="28" y="24" text="DIF" fill={p.accent} />
      <Label x="70" y="24" text="DEA" fill={p.accent2} />
      <Label x="120" y="24" text="Histogram" fill={p.muted} />
      <Label x="372" y={zero - 6} text="0" fill={p.muted} anchor="end" />
    </Frame>
  )
}

function AdxDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="ADX · +DI / −DI">
      {/* ADX */}
      <path
        d="M28 150 C80 148, 120 140, 160 110 S240 60, 300 48 S350 50, 372 55"
        fill="none"
        stroke={p.price}
        strokeWidth="2.4"
      />
      {/* +DI */}
      <path
        d="M28 120 C90 100, 140 80, 200 70 S300 75, 372 90"
        fill="none"
        stroke={p.up}
        strokeWidth="2"
      />
      {/* −DI */}
      <path
        d="M28 90 C80 100, 130 120, 190 130 S280 125, 372 110"
        fill="none"
        stroke={p.down}
        strokeWidth="2"
      />
      <line
        x1="28"
        x2="380"
        y1="100"
        y2="100"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <Label x="28" y="24" text="ADX" fill={p.price} />
      <Label x="80" y="24" text="+DI" fill={p.up} />
      <Label x="130" y="24" text="−DI" fill={p.down} />
      <Label x="372" y="96" text="25" fill={p.muted} anchor="end" />
    </Frame>
  )
}

function RsiDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="RSI">
      <rect
        x="28"
        y="36"
        width="352"
        height="36"
        fill={p.down}
        opacity="0.08"
      />
      <rect x="28" y="128" width="352" height="36" fill={p.up} opacity="0.08" />
      <line
        x1="28"
        x2="380"
        y1="72"
        y2="72"
        stroke={p.down}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      <line
        x1="28"
        x2="380"
        y1="128"
        y2="128"
        stroke={p.up}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      <line
        x1="28"
        x2="380"
        y1="100"
        y2="100"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <path
        d="M28 110 C60 105, 90 70, 120 55 S170 50, 200 90 S250 140, 290 150 S340 120, 372 85"
        fill="none"
        stroke={p.accent}
        strokeWidth="2.2"
      />
      <Label x="28" y="24" text="70" fill={p.down} />
      <Label x="60" y="24" text="50" fill={p.muted} />
      <Label x="90" y="24" text="30" fill={p.up} />
      <Label x="250" y="158" text="divergence zone" fill={p.muted} />
    </Frame>
  )
}

function StochasticDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="Stochastic %K / %D">
      <rect
        x="28"
        y="36"
        width="352"
        height="28"
        fill={p.down}
        opacity="0.08"
      />
      <rect x="28" y="136" width="352" height="28" fill={p.up} opacity="0.08" />
      <line
        x1="28"
        x2="380"
        y1="64"
        y2="64"
        stroke={p.down}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.55"
      />
      <line
        x1="28"
        x2="380"
        y1="136"
        y2="136"
        stroke={p.up}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.55"
      />
      <path
        d="M28 120 C55 130, 80 150, 110 155 S160 140, 190 90 S240 40, 280 50 S330 90, 372 70"
        fill="none"
        stroke={p.accent}
        strokeWidth="2.2"
      />
      <path
        d="M28 115 C60 125, 95 145, 130 148 S180 120, 210 95 S270 55, 310 60 S350 80, 372 78"
        fill="none"
        stroke={p.accent2}
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <circle cx="155" cy="148" r="4" fill={p.up} />
      <Label x="28" y="24" text="%K" fill={p.accent} />
      <Label x="70" y="24" text="%D" fill={p.accent2} />
      <Label x="165" y="152" text="oversold cross" fill={p.muted} />
    </Frame>
  )
}

function BollingerDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="Bollinger Bands">
      {/* Band fill */}
      <path
        d="M28 70 C90 75, 130 90, 170 105 S240 90, 280 55 S340 40, 372 45
           L372 130 C340 140, 300 155, 260 150 S180 130, 140 115 S70 100, 28 110 Z"
        fill={p.accent}
        opacity="0.12"
      />
      {/* Upper */}
      <path
        d="M28 70 C90 75, 130 90, 170 105 S240 90, 280 55 S340 40, 372 45"
        fill="none"
        stroke={p.accent}
        strokeWidth="1.6"
      />
      {/* Mid */}
      <path
        d="M28 90 C90 95, 140 105, 190 110 S280 95, 330 80 S360 78, 372 82"
        fill="none"
        stroke={p.price}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* Lower */}
      <path
        d="M28 110 C70 100, 120 105, 160 120 S230 145, 280 150 S340 140, 372 130"
        fill="none"
        stroke={p.accent}
        strokeWidth="1.6"
      />
      {/* Price walking upper */}
      <path
        d="M28 95 C70 88, 110 100, 150 108 S210 85, 250 60 S320 42, 372 50"
        fill="none"
        stroke={p.accent2}
        strokeWidth="2.2"
      />
      <Label x="28" y="24" text="Upper / Lower" fill={p.accent} />
      <Label x="140" y="24" text="Mid" fill={p.price} />
      <Label x="190" y="24" text="Price" fill={p.accent2} />
      <Label x="150" y="168" text="squeeze → expansion" fill={p.muted} />
    </Frame>
  )
}

function AtrDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="ATR">
      {/* Price panel suggestion */}
      <path
        d="M28 70 C60 60, 90 80, 120 55 S170 40, 200 70 S250 30, 290 50 S340 35, 372 45"
        fill="none"
        stroke={p.price}
        strokeWidth="2"
      />
      <Label x="28" y="28" text="Price" fill={p.price} />
      {/* ATR panel */}
      <line
        x1="28"
        x2="380"
        y1="110"
        y2="110"
        stroke={p.grid}
        strokeWidth="1"
      />
      <path
        d="M28 160 C70 155, 110 150, 150 145 S220 120, 260 100 S320 95, 372 88"
        fill="none"
        stroke={p.accent}
        strokeWidth="2.2"
      />
      <Label x="28" y="128" text="ATR rising with volatility" fill={p.accent} />
      {/* Stop width brace */}
      <line
        x1="300"
        x2="300"
        y1="42"
        y2="78"
        stroke={p.accent2}
        strokeWidth="1.5"
      />
      <Label x="308" y="64" text="≈ k·ATR" fill={p.accent2} />
    </Frame>
  )
}

function VolumeDiagram() {
  const p = useDiagramPalette()
  const bars = [22, 28, 18, 35, 42, 30, 20, 16, 14, 48, 55, 40, 28, 22, 60, 45]
  return (
    <Frame title="Volume · OBV">
      <path
        d="M28 70 C70 65, 110 80, 150 55 S210 40, 250 60 S310 35, 372 42"
        fill="none"
        stroke={p.price}
        strokeWidth="2"
      />
      {bars.map((h, i) => {
        const x = 32 + i * 22
        const up = i % 3 !== 1
        return (
          <rect
            key={x}
            x={x}
            y={180 - h}
            width="14"
            height={h}
            rx="1"
            fill={up ? p.up : p.down}
            opacity="0.7"
          />
        )
      })}
      <path
        d="M32 150 C80 145, 130 140, 180 130 S260 110, 320 100 S360 95, 380 90"
        fill="none"
        stroke={p.accent}
        strokeWidth="1.8"
        strokeDasharray="4 3"
      />
      <Label x="28" y="24" text="Price" fill={p.price} />
      <Label x="80" y="24" text="OBV" fill={p.accent} />
      <Label x="130" y="24" text="Volume" fill={p.muted} />
    </Frame>
  )
}

function VwapDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="VWAP">
      <path
        d="M28 120 C70 100, 110 70, 150 55 S210 50, 250 80 S300 110, 340 90 S360 85, 372 70"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <path
        d="M28 115 C100 110, 180 100, 260 95 S330 92, 372 90"
        fill="none"
        stroke={p.accent}
        strokeWidth="2"
      />
      <path
        d="M28 100 C100 95, 180 85, 260 80 S330 78, 372 76"
        fill="none"
        stroke={p.accent}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      <path
        d="M28 130 C100 125, 180 115, 260 110 S330 106, 372 104"
        fill="none"
        stroke={p.accent}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      <circle cx="250" cy="80" r="4" fill={p.up} />
      <Label x="28" y="24" text="Price" fill={p.price} />
      <Label x="80" y="24" text="VWAP ± band" fill={p.accent} />
      <Label x="258" y="78" text="reclaim" fill={p.muted} />
    </Frame>
  )
}

function FibonacciDiagram() {
  const p = useDiagramPalette()
  const levels: { y: number; r: string }[] = [
    { y: 40, r: '0%' },
    { y: 62, r: '23.6%' },
    { y: 88, r: '38.2%' },
    { y: 108, r: '50%' },
    { y: 128, r: '61.8%' },
    { y: 168, r: '100%' },
  ]
  return (
    <Frame title="Fibonacci retracement">
      <path
        d="M40 168 C80 160, 120 100, 160 50 S200 40, 220 42
           C250 70, 280 110, 310 125 S350 120, 372 95"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {levels.map((lv) => (
        <g key={lv.r}>
          <line
            x1="28"
            x2="360"
            y1={lv.y}
            y2={lv.y}
            stroke={lv.r === '61.8%' || lv.r === '50%' ? p.accent : p.grid}
            strokeWidth={lv.r === '61.8%' || lv.r === '50%' ? 1.5 : 1}
            strokeDasharray={
              lv.r === '0%' || lv.r === '100%' ? undefined : '3 3'
            }
          />
          <Label x="372" y={lv.y + 4} text={lv.r} fill={p.muted} anchor="end" />
        </g>
      ))}
      <circle cx="310" cy="125" r="4" fill={p.up} />
      <Label x="28" y="24" text="Swing high → low grid" fill={p.muted} />
    </Frame>
  )
}

function DivergenceDiagram() {
  const p = useDiagramPalette()
  return (
    <Frame title="Divergence">
      {/* Price making higher highs */}
      <path
        d="M40 120 C80 100, 120 70, 160 55 S220 40, 260 35"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <circle cx="160" cy="55" r="3.5" fill={p.price} />
      <circle cx="260" cy="35" r="3.5" fill={p.price} />
      <Label x="28" y="28" text="Price HH" fill={p.price} />
      {/* Oscillator lower highs */}
      <line
        x1="28"
        x2="380"
        y1="130"
        y2="130"
        stroke={p.grid}
        strokeWidth="1"
      />
      <path
        d="M40 170 C90 155, 130 140, 160 135 S220 145, 260 155"
        fill="none"
        stroke={p.accent}
        strokeWidth="2.2"
      />
      <circle cx="160" cy="135" r="3.5" fill={p.accent} />
      <circle cx="260" cy="155" r="3.5" fill={p.accent} />
      <Label x="28" y="118" text="Oscillator LH" fill={p.accent} />
      <Label x="280" y="100" text="warn — wait structure" fill={p.muted} />
    </Frame>
  )
}

function PairFrame({
  title,
  okLabel,
  badLabel,
  ok,
  bad,
}: {
  title: string
  okLabel: string
  badLabel: string
  ok: ReactNode
  bad: ReactNode
}) {
  const p = useDiagramPalette()
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'surface.border',
        borderRadius: '8px',
        bgcolor: 'surface.subtle',
        overflow: 'hidden',
        maxWidth: 520,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: 'surface.border',
          typography: 'caption',
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        {title}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        <Box sx={{ borderRight: '1px solid', borderColor: 'surface.border' }}>
          <Box
            sx={{
              px: 1.25,
              pt: 1,
              typography: 'caption',
              fontWeight: 600,
              color: 'market.up',
            }}
          >
            {okLabel}
          </Box>
          <Box sx={{ px: 0.5, pb: 1 }}>
            <svg viewBox="0 0 200 140" width="100%" height="auto" aria-hidden>
              <rect width="200" height="140" fill="transparent" />
              {[40, 70, 100].map((y) => (
                <line
                  key={y}
                  x1="12"
                  x2="188"
                  y1={y}
                  y2={y}
                  stroke={p.grid}
                  strokeWidth="1"
                />
              ))}
              {ok}
            </svg>
          </Box>
        </Box>
        <Box>
          <Box
            sx={{
              px: 1.25,
              pt: 1,
              typography: 'caption',
              fontWeight: 600,
              color: 'market.down',
            }}
          >
            {badLabel}
          </Box>
          <Box sx={{ px: 0.5, pb: 1 }}>
            <svg viewBox="0 0 200 140" width="100%" height="auto" aria-hidden>
              <rect width="200" height="140" fill="transparent" />
              {[40, 70, 100].map((y) => (
                <line
                  key={y}
                  x1="12"
                  x2="188"
                  y1={y}
                  y2={y}
                  stroke={p.grid}
                  strokeWidth="1"
                />
              ))}
              {bad}
            </svg>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function MaPairDiagram({
  okLabel,
  badLabel,
}: {
  okLabel: string
  badLabel: string
}) {
  const p = useDiagramPalette()
  return (
    <PairFrame
      title="MA read"
      okLabel={okLabel}
      badLabel={badLabel}
      ok={
        <>
          <path
            d="M16 100 C40 95, 60 70, 90 55 S130 50, 160 40 S180 38, 188 42"
            fill="none"
            stroke={p.price}
            strokeWidth="2"
          />
          <path
            d="M16 105 C50 100, 90 85, 130 70 S170 58, 188 55"
            fill="none"
            stroke={p.accent}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          <circle cx="118" cy="68" r="3.5" fill={p.up} />
        </>
      }
      bad={
        <>
          <path
            d="M16 70 C40 50, 55 90, 80 55 S110 95, 130 50 S160 100, 188 60"
            fill="none"
            stroke={p.price}
            strokeWidth="2"
          />
          <path
            d="M16 75 C45 60, 70 80, 95 65 S140 85, 188 70"
            fill="none"
            stroke={p.accent}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          <circle cx="55" cy="88" r="3" fill={p.down} />
          <circle cx="110" cy="92" r="3" fill={p.down} />
          <circle cx="160" cy="98" r="3" fill={p.down} />
        </>
      }
    />
  )
}

function RsiPairDiagram({
  okLabel,
  badLabel,
}: {
  okLabel: string
  badLabel: string
}) {
  const p = useDiagramPalette()
  return (
    <PairFrame
      title="RSI read"
      okLabel={okLabel}
      badLabel={badLabel}
      ok={
        <>
          <line
            x1="12"
            x2="188"
            y1="50"
            y2="50"
            stroke={p.muted}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <path
            d="M16 45 C40 40, 70 70, 100 85 S140 70, 170 55 S180 50, 188 48"
            fill="none"
            stroke={p.accent}
            strokeWidth="2"
          />
          <circle cx="100" cy="85" r="3.5" fill={p.up} />
        </>
      }
      bad={
        <>
          <rect
            x="12"
            y="28"
            width="176"
            height="28"
            fill={p.down}
            opacity="0.12"
          />
          <path
            d="M16 90 C40 70, 60 40, 90 32 S130 30, 160 28 S180 30, 188 32"
            fill="none"
            stroke={p.accent}
            strokeWidth="2"
          />
          <circle cx="90" cy="32" r="3.5" fill={p.down} />
          <Label x="100" y="120" text="fade OB in trend" fill={p.muted} />
        </>
      }
    />
  )
}

function BollingerPairDiagram({
  okLabel,
  badLabel,
}: {
  okLabel: string
  badLabel: string
}) {
  const p = useDiagramPalette()
  return (
    <PairFrame
      title="Bollinger read"
      okLabel={okLabel}
      badLabel={badLabel}
      ok={
        <>
          <path
            d="M16 45 C50 42, 90 40, 130 38 S170 36, 188 35"
            fill="none"
            stroke={p.accent}
            strokeWidth="1.2"
          />
          <path
            d="M16 75 C50 72, 90 70, 130 68 S170 66, 188 65"
            fill="none"
            stroke={p.muted}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <path
            d="M16 55 C45 48, 80 42, 120 38 S160 34, 188 33"
            fill="none"
            stroke={p.price}
            strokeWidth="2"
          />
        </>
      }
      bad={
        <>
          <path
            d="M16 45 C50 42, 90 40, 130 38 S170 36, 188 35"
            fill="none"
            stroke={p.accent}
            strokeWidth="1.2"
          />
          <path
            d="M16 55 C40 48, 70 42, 100 38 S150 50, 188 70"
            fill="none"
            stroke={p.price}
            strokeWidth="2"
          />
          <circle cx="100" cy="38" r="3.5" fill={p.down} />
          <Label x="108" y="120" text="fade the touch" fill={p.muted} />
        </>
      }
    />
  )
}

const SINGLE_DIAGRAMS: Record<
  Exclude<DiagramId, 'divergence' | 'ma-pair' | 'rsi-pair' | 'bollinger-pair'>,
  () => ReactNode
> = {
  ma: MaDiagram,
  macd: MacdDiagram,
  adx: AdxDiagram,
  rsi: RsiDiagram,
  stochastic: StochasticDiagram,
  bollinger: BollingerDiagram,
  atr: AtrDiagram,
  volume: VolumeDiagram,
  vwap: VwapDiagram,
  fibonacci: FibonacciDiagram,
}

export default function IndicatorDiagram({
  id,
  okLabel = 'OK',
  badLabel = 'Bad',
}: {
  id: DiagramId
  okLabel?: string
  badLabel?: string
}) {
  if (id === 'divergence') return <DivergenceDiagram />
  if (id === 'ma-pair')
    return <MaPairDiagram okLabel={okLabel} badLabel={badLabel} />
  if (id === 'rsi-pair')
    return <RsiPairDiagram okLabel={okLabel} badLabel={badLabel} />
  if (id === 'bollinger-pair')
    return <BollingerPairDiagram okLabel={okLabel} badLabel={badLabel} />
  const Diagram = SINGLE_DIAGRAMS[id]
  return <Diagram />
}
