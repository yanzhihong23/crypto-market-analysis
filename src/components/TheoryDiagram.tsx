import { Box, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

import type { TheoryDiagramId } from '../i18n/theories'

/**
 * Schematic charts for the theories page. Paths are hand-drawn, not live
 * series — each id is one teaching figure, paired with a section in the copy.
 */

type Palette = {
  grid: string
  price: string
  accent: string
  accent2: string
  muted: string
  up: string
  down: string
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
  }
}

function Frame({
  children,
  title,
  tall,
  height,
}: {
  children: ReactNode
  title?: string
  tall?: boolean
  /** Override viewBox height when a figure needs more vertical room. */
  height?: number
}) {
  const p = useDiagramPalette()
  const h = height ?? (tall ? 240 : 200)
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'surface.border',
        borderRadius: '16px',
        bgcolor: 'surface.subtle',
        overflow: 'hidden',
        maxWidth: height && height >= 260 ? 640 : 560,
        width: '100%',
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
          viewBox={`0 0 400 ${h}`}
          width="100%"
          height="auto"
          role="img"
          aria-hidden={title ? undefined : true}
          aria-label={title}
        >
          <rect x="0" y="0" width="400" height={h} fill="transparent" />
          {[
            40,
            80,
            120,
            160,
            ...(h >= 240 ? [200] : []),
            ...(h >= 280 ? [240] : []),
          ].map((y) => (
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
  size = 11,
}: {
  x: number | string
  y: number | string
  text: string
  fill: string
  anchor?: 'start' | 'middle' | 'end'
  size?: number
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={size}
      fontFamily="inherit"
      textAnchor={anchor}
    >
      {text}
    </text>
  )
}

function Dot({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return <circle cx={cx} cy={cy} r="3.5" fill={fill} />
}

/* ─── Dow ─── */

function DowDegrees() {
  const p = useDiagramPalette()
  return (
    <Frame title="Dow · three degrees" tall>
      {/* Primary */}
      <path
        d="M30 200 C80 190, 120 160, 160 140 S240 90, 300 70 S360 50, 380 45"
        fill="none"
        stroke={p.up}
        strokeWidth="2.5"
      />
      {/* Secondary zigzags along primary */}
      <path
        d="M40 195 L70 160 L100 175 L140 130 L170 150 L210 100 L245 120 L290 75 L325 95 L370 50"
        fill="none"
        stroke={p.price}
        strokeWidth="2"
      />
      {/* Daily noise on one segment */}
      <path
        d="M170 150 L178 142 L186 148 L194 136 L202 144 L210 100"
        fill="none"
        stroke={p.muted}
        strokeWidth="1.2"
      />
      <Label x="28" y="24" text="Primary" fill={p.up} />
      <Label x="100" y="24" text="Secondary" fill={p.price} />
      <Label x="190" y="24" text="Daily" fill={p.muted} />
      <Label x="175" y="168" text="noise" fill={p.muted} size={10} />
      <Label
        x="28"
        y="228"
        text="Trade the degree you claim — not the wiggle inside it"
        fill={p.muted}
        size={10}
      />
    </Frame>
  )
}

function DowPhases() {
  const p = useDiagramPalette()
  return (
    <Frame title="Dow · bull phases">
      <path
        d="M28 160 C60 155, 90 150, 120 145 S160 130, 190 100 S240 55, 280 45 S330 40, 372 70"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {/* Phase bands */}
      <rect
        x="28"
        y="130"
        width="100"
        height="40"
        fill={p.accent}
        opacity="0.1"
      />
      <rect x="128" y="70" width="120" height="80" fill={p.up} opacity="0.08" />
      <rect
        x="248"
        y="35"
        width="124"
        height="55"
        fill={p.down}
        opacity="0.08"
      />
      <Label x="40" y="155" text="1 Accum." fill={p.accent} size={10} />
      <Label x="155" y="95" text="2 Public" fill={p.up} size={10} />
      <Label x="270" y="58" text="3 Distrib." fill={p.down} size={10} />
      <Label x="28" y="24" text="Ex-post frame — not a clock" fill={p.muted} />
    </Frame>
  )
}

function DowConfirm() {
  const p = useDiagramPalette()
  return (
    <Frame title="Dow · confirmation">
      {/* Price new high */}
      <path
        d="M36 140 L80 110 L120 125 L170 80 L210 100 L260 55 L300 75 L350 40"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {/* Peer / volume lagging */}
      <path
        d="M36 155 L80 140 L120 148 L170 120 L210 130 L260 115 L300 125 L350 110"
        fill="none"
        stroke={p.accent}
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <Dot cx={350} cy={40} fill={p.price} />
      <Dot cx={350} cy={110} fill={p.accent} />
      <Label x="28" y="24" text="Price HH" fill={p.price} />
      <Label x="110" y="24" text="Peer / volume lag" fill={p.accent} />
      <Label
        x="240"
        y="175"
        text="confirmation fails → caution"
        fill={p.muted}
      />
    </Frame>
  )
}

/* ─── Volume-price ─── */

function VpQuadrants() {
  const p = useDiagramPalette()
  const cells: {
    x: number
    y: number
    title: string
    sub: string
    tone: 'up' | 'down' | 'warn' | 'mute'
  }[] = [
    { x: 28, y: 36, title: '↑P ↑V', sub: 'demand ok', tone: 'up' },
    { x: 210, y: 36, title: '↑P ↓V', sub: 'thin fuel', tone: 'warn' },
    { x: 28, y: 112, title: '↓P ↑V', sub: 'supply out', tone: 'down' },
    { x: 210, y: 112, title: '↓P ↓V', sub: 'quiet pullback?', tone: 'mute' },
  ]
  const fill = (t: (typeof cells)[0]['tone']) =>
    t === 'up'
      ? p.up
      : t === 'down'
        ? p.down
        : t === 'warn'
          ? p.accent2
          : p.muted
  return (
    <Frame title="Volume-price · four reads">
      {cells.map((c) => (
        <g key={c.title}>
          <rect
            x={c.x}
            y={c.y}
            width="162"
            height="60"
            rx="6"
            fill={fill(c.tone)}
            opacity="0.1"
            stroke={fill(c.tone)}
            strokeWidth="1"
          />
          <Label x={c.x + 12} y={c.y + 24} text={c.title} fill={fill(c.tone)} />
          <Label
            x={c.x + 12}
            y={c.y + 44}
            text={c.sub}
            fill={p.muted}
            size={10}
          />
        </g>
      ))}
    </Frame>
  )
}

function VpBreakout() {
  const p = useDiagramPalette()
  const vols = [16, 18, 14, 20, 22, 15, 12, 48, 14, 12, 18, 22, 20]
  return (
    <Frame title="Volume-price · valid break">
      <line
        x1="28"
        x2="380"
        y1="90"
        y2="90"
        stroke={p.accent}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <path
        d="M28 120 C70 115, 110 110, 150 105 S200 95, 230 88 S270 55, 310 48 S350 50, 372 45"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {vols.map((h, i) => (
        <rect
          key={i}
          x={36 + i * 26}
          y={180 - h}
          width="16"
          height={h}
          rx="1"
          fill={i === 7 ? p.up : i > 7 && i < 10 ? p.muted : p.accent}
          opacity={i === 7 ? 0.9 : 0.55}
        />
      ))}
      <Dot cx={250} cy={70} fill={p.up} />
      <Label x="28" y="24" text="Resistance" fill={p.accent} />
      <Label x="120" y="24" text="Expansion" fill={p.up} />
      <Label x="210" y="24" text="Quiet retest" fill={p.muted} />
      <Label x="258" y="68" text="hold" fill={p.muted} size={10} />
    </Frame>
  )
}

function VpDivergence() {
  const p = useDiagramPalette()
  return (
    <Frame title="Volume-price · divergence warn">
      <path
        d="M40 130 C90 100, 140 70, 190 55 S260 40, 320 35"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <path
        d="M40 160 C90 150, 140 145, 190 140 S260 150, 320 158"
        fill="none"
        stroke={p.accent}
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <Dot cx={190} cy={55} fill={p.price} />
      <Dot cx={320} cy={35} fill={p.price} />
      <Dot cx={190} cy={140} fill={p.accent} />
      <Dot cx={320} cy={158} fill={p.accent} />
      <line
        x1="190"
        x2="320"
        y1="55"
        y2="35"
        stroke={p.up}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.6"
      />
      <line
        x1="190"
        x2="320"
        y1="140"
        y2="158"
        stroke={p.down}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.6"
      />
      <Label x="28" y="24" text="Price HH" fill={p.price} />
      <Label x="110" y="24" text="OBV / volume LH" fill={p.accent} />
      <Label x="240" y="100" text="warn — size down" fill={p.muted} />
    </Frame>
  )
}

/* ─── Elliott ─── */

function ElliottImpulse() {
  const p = useDiagramPalette()
  const pts = [
    { x: 36, y: 165, n: '0' },
    { x: 90, y: 110, n: '1' },
    { x: 130, y: 140, n: '2' },
    { x: 230, y: 45, n: '3' },
    { x: 275, y: 85, n: '4' },
    { x: 360, y: 30, n: '5' },
  ]
  const d = pts
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x} ${pt.y}`)
    .join(' ')
  return (
    <Frame title="Elliott · impulse 1–5">
      <path d={d} fill="none" stroke={p.price} strokeWidth="2.2" />
      {pts.map((pt) => (
        <g key={pt.n}>
          <Dot cx={pt.x} cy={pt.y} fill={p.accent} />
          <Label x={pt.x + 6} y={pt.y - 8} text={pt.n} fill={p.accent} />
        </g>
      ))}
      <Label x="28" y="24" text="2 holds above 0" fill={p.muted} />
      <Label x="160" y="24" text="3 often longest" fill={p.up} />
      <Label x="280" y="24" text="4 ≠ 1 territory" fill={p.muted} />
      <line
        x1="90"
        x2="275"
        y1="110"
        y2="110"
        stroke={p.down}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.5"
      />
      <Label
        x="200"
        y="124"
        text="4 stays above 1 high"
        fill={p.muted}
        size={10}
      />
    </Frame>
  )
}

function ElliottCorrection() {
  const p = useDiagramPalette()
  return (
    <Frame title="Elliott · A–B–C corrections">
      {/* Zigzag */}
      <path
        d="M40 50 L90 120 L120 90 L180 160"
        fill="none"
        stroke={p.price}
        strokeWidth="2"
      />
      <Label x="40" y="42" text="Zigzag" fill={p.price} size={10} />
      <Label x="85" y="135" text="A" fill={p.accent} size={10} />
      <Label x="118" y="85" text="B" fill={p.accent} size={10} />
      <Label x="175" y="172" text="C" fill={p.accent} size={10} />
      {/* Flat */}
      <path
        d="M220 70 L260 130 L310 75 L360 140"
        fill="none"
        stroke={p.accent2}
        strokeWidth="2"
      />
      <Label x="220" y="62" text="Flat" fill={p.accent2} size={10} />
      <Label x="252" y="145" text="A" fill={p.accent2} size={10} />
      <Label x="305" y="70" text="B" fill={p.accent2} size={10} />
      <Label x="355" y="155" text="C" fill={p.accent2} size={10} />
      <Label
        x="28"
        y="24"
        text="Same three letters — different geometry"
        fill={p.muted}
      />
    </Frame>
  )
}

function ElliottFib() {
  const p = useDiagramPalette()
  const levels: { y: number; r: string; hot?: boolean }[] = [
    { y: 36, r: '1.618 ext' },
    { y: 70, r: '1.0' },
    { y: 100, r: '0.618', hot: true },
    { y: 125, r: '0.5', hot: true },
    { y: 148, r: '0.382' },
    { y: 175, r: '0' },
  ]
  return (
    <Frame title="Elliott · Fibonacci anchors">
      <path
        d="M50 175 L110 70 L150 125 L240 40 L280 100 L360 55"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {levels.map((lv) => (
        <g key={lv.r}>
          <line
            x1="28"
            x2="355"
            y1={lv.y}
            y2={lv.y}
            stroke={lv.hot ? p.accent : p.grid}
            strokeWidth={lv.hot ? 1.4 : 1}
            strokeDasharray={lv.hot ? undefined : '3 3'}
          />
          <Label
            x="372"
            y={lv.y + 4}
            text={lv.r}
            fill={lv.hot ? p.accent : p.muted}
            anchor="end"
            size={10}
          />
        </g>
      ))}
      <Dot cx={150} cy={125} fill={p.up} />
      <Label x="28" y="24" text="2/4 retrace · 5/C project" fill={p.muted} />
    </Frame>
  )
}

/* ─── Wyckoff ─── */

function WyckoffCycle() {
  const p = useDiagramPalette()
  // Full schematic cycle: prior markdown → accumulation → markup →
  // distribution → markdown. Phase bands sit under the path; labels name the
  // composite-operator events without crowding every textbook letter.
  return (
    <Frame title="Wyckoff · full cycle" height={280}>
      {/* Accumulation band */}
      <rect
        x="52"
        y="175"
        width="88"
        height="55"
        fill={p.accent}
        opacity="0.1"
      />
      {/* Distribution band */}
      <rect x="248" y="48" width="88" height="50" fill={p.down} opacity="0.1" />
      <line
        x1="52"
        x2="140"
        y1="175"
        y2="175"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <line
        x1="52"
        x2="140"
        y1="230"
        y2="230"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <line
        x1="248"
        x2="336"
        y1="48"
        y2="48"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <line
        x1="248"
        x2="336"
        y1="98"
        y2="98"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {/* Price path through the four phases */}
      <path
        d="M20 90
           L40 140
           L55 200
           L70 185
           L85 215
           L100 190
           L115 240
           L130 195
           L145 160
           L175 120
           L200 85
           L225 60
           L250 70
           L265 45
           L280 75
           L295 55
           L310 85
           L325 95
           L350 150
           L370 200
           L388 235"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Key event dots */}
      <Dot cx={55} cy={200} fill={p.muted} />
      <Dot cx={115} cy={240} fill={p.up} />
      <Dot cx={145} cy={160} fill={p.accent} />
      <Dot cx={265} cy={45} fill={p.down} />
      <Dot cx={325} cy={95} fill={p.accent2} />
      {/* Phase captions along the bottom */}
      <Label x="22" y="24" text="1 Accum." fill={p.accent} size={10} />
      <Label x="100" y="24" text="2 Markup" fill={p.up} size={10} />
      <Label x="185" y="24" text="3 Distrib." fill={p.down} size={10} />
      <Label x="270" y="24" text="4 Markdown" fill={p.accent2} size={10} />
      {/* Event labels near path */}
      <Label x="48" y="192" text="SC" fill={p.muted} size={9} />
      <Label x="108" y="255" text="Spring" fill={p.up} size={9} />
      <Label x="148" y="155" text="SOS" fill={p.accent} size={9} />
      <Label x="268" y="40" text="UT" fill={p.down} size={9} />
      <Label x="328" y="92" text="SOW" fill={p.accent2} size={9} />
      <Label
        x="28"
        y="268"
        text="Cause (range) → Effect (trend) → next cause — one loop"
        fill={p.muted}
        size={10}
      />
    </Frame>
  )
}

function WyckoffAccum() {
  const p = useDiagramPalette()
  return (
    <Frame title="Wyckoff · accumulation" tall>
      <rect
        x="90"
        y="80"
        width="220"
        height="90"
        fill={p.accent}
        opacity="0.08"
      />
      <line
        x1="90"
        x2="310"
        y1="80"
        y2="80"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <line
        x1="90"
        x2="310"
        y1="170"
        y2="170"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <path
        d="M28 50 L70 100 L95 145 L125 115 L155 150 L185 120 L215 185 L250 115 L280 125 L320 70 L360 45 L380 38"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <Dot cx={95} cy={145} fill={p.muted} />
      <Dot cx={215} cy={185} fill={p.up} />
      <Dot cx={320} cy={70} fill={p.accent} />
      <Label x="28" y="24" text="SC" fill={p.muted} />
      <Label x="80" y="24" text="Spring" fill={p.up} />
      <Label x="150" y="24" text="SOS / markup" fill={p.accent} />
      <Label x="100" y="98" text="cause (range)" fill={p.muted} size={10} />
      <Label x="318" y="68" text="effect" fill={p.accent} size={10} />
      <Label
        x="28"
        y="220"
        text="Hypothesis until break + retest confirm"
        fill={p.muted}
        size={10}
      />
    </Frame>
  )
}

function WyckoffDistrib() {
  const p = useDiagramPalette()
  return (
    <Frame title="Wyckoff · distribution">
      <rect
        x="100"
        y="45"
        width="200"
        height="75"
        fill={p.down}
        opacity="0.08"
      />
      <line
        x1="100"
        x2="300"
        y1="45"
        y2="45"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        x2="300"
        y1="120"
        y2="120"
        stroke={p.muted}
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <path
        d="M28 150 L70 100 L105 70 L140 90 L175 55 L210 85 L245 35 L280 90 L310 110 L350 160 L372 175"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <Dot cx={245} cy={35} fill={p.down} />
      <Dot cx={310} cy={110} fill={p.accent} />
      <Label x="28" y="24" text="PSY / UT" fill={p.down} />
      <Label x="120" y="24" text="LPSY" fill={p.muted} />
      <Label x="200" y="24" text="Markdown" fill={p.accent} />
      <Label x="252" y="32" text="upthrust" fill={p.muted} size={10} />
    </Frame>
  )
}

function WyckoffSpring() {
  const p = useDiagramPalette()
  return (
    <Frame title="Wyckoff · spring detail">
      <line
        x1="28"
        x2="380"
        y1="120"
        y2="120"
        stroke={p.accent}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <path
        d="M40 90 L80 100 L120 85 L160 105 L200 95 L240 165 L280 100 L320 80 L360 70"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {/* Volume bars under spring */}
      {[12, 14, 11, 13, 15, 40, 18, 14, 22, 28].map((h, i) => (
        <rect
          key={i}
          x={50 + i * 30}
          y={190 - h}
          width="18"
          height={h}
          rx="1"
          fill={i === 5 ? p.down : i === 6 ? p.up : p.muted}
          opacity="0.65"
        />
      ))}
      <Dot cx={240} cy={165} fill={p.up} />
      <Label x="28" y="24" text="Support" fill={p.accent} />
      <Label x="100" y="24" text="Shakeout" fill={p.down} />
      <Label x="180" y="24" text="Reclaim + demand" fill={p.up} />
      <Label x="248" y="162" text="spring" fill={p.muted} size={10} />
    </Frame>
  )
}

/* ─── Structure ─── */

function StructureTrend() {
  const p = useDiagramPalette()
  return (
    <Frame title="Structure · HH / HL">
      <path
        d="M36 160 L85 105 L120 130 L175 75 L215 105 L275 50 L315 80 L370 40"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      {[
        { x: 85, y: 105, t: 'HH' },
        { x: 120, y: 130, t: 'HL' },
        { x: 175, y: 75, t: 'HH' },
        { x: 215, y: 105, t: 'HL' },
        { x: 275, y: 50, t: 'HH' },
        { x: 315, y: 80, t: 'HL' },
      ].map((pt) => (
        <g key={`${pt.t}-${pt.x}`}>
          <Dot cx={pt.x} cy={pt.y} fill={p.up} />
          <Label
            x={pt.x + 6}
            y={pt.y + (pt.t === 'HL' ? 16 : -8)}
            text={pt.t}
            fill={p.up}
            size={10}
          />
        </g>
      ))}
      <Label
        x="28"
        y="24"
        text="Bullish structure — bias long on HL retests"
        fill={p.muted}
      />
    </Frame>
  )
}

function StructureChoch() {
  const p = useDiagramPalette()
  return (
    <Frame title="Structure · BoS / ChoCH">
      <path
        d="M36 140 L80 100 L110 120 L165 70 L200 100 L250 55 L285 115 L340 90 L372 130"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <Dot cx={165} cy={70} fill={p.up} />
      <Dot cx={250} cy={55} fill={p.up} />
      <Dot cx={285} cy={115} fill={p.down} />
      <line
        x1="200"
        x2="300"
        y1="100"
        y2="100"
        stroke={p.down}
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />
      <Label x="28" y="24" text="BoS" fill={p.up} />
      <Label x="80" y="24" text="ChoCH" fill={p.down} />
      <Label x="170" y="24" text="wait new sequence" fill={p.muted} />
      <Label x="255" y="48" text="last HH" fill={p.muted} size={10} />
      <Label x="292" y="128" text="breaks HL" fill={p.down} size={10} />
    </Frame>
  )
}

function StructureValue() {
  const p = useDiagramPalette()
  return (
    <Frame title="Structure · premium / discount">
      <path
        d="M50 160 L120 50 L200 140 L280 60 L360 130"
        fill="none"
        stroke={p.price}
        strokeWidth="2"
        opacity="0.35"
      />
      {/* Equilibrium */}
      <line
        x1="120"
        x2="280"
        y1="105"
        y2="105"
        stroke={p.muted}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <rect
        x="120"
        y="50"
        width="160"
        height="55"
        fill={p.down}
        opacity="0.1"
      />
      <rect x="120" y="105" width="160" height="55" fill={p.up} opacity="0.1" />
      <path
        d="M120 50 L200 140 L280 60"
        fill="none"
        stroke={p.price}
        strokeWidth="2.2"
      />
      <Dot cx={200} cy={140} fill={p.up} />
      <Label x="28" y="24" text="Premium" fill={p.down} />
      <Label x="110" y="24" text="EQ" fill={p.muted} />
      <Label x="160" y="24" text="Discount" fill={p.up} />
      <Label
        x="208"
        y="155"
        text="buy zone (uptrend)"
        fill={p.muted}
        size={10}
      />
    </Frame>
  )
}

/* ─── Candlesticks ─── */

type Candle = {
  x: number
  o: number
  c: number
  h: number
  l: number
  up: boolean
}

function drawCandle(c: Candle, up: string, down: string) {
  const top = Math.min(c.o, c.c)
  const body = Math.max(Math.abs(c.c - c.o), 2)
  const color = c.up ? up : down
  return (
    <g key={c.x}>
      <line
        x1={c.x + 9}
        x2={c.x + 9}
        y1={c.h}
        y2={c.l}
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x={c.x}
        y={top}
        width="18"
        height={body}
        rx="1"
        fill={color}
        opacity="0.88"
      />
    </g>
  )
}

function CandleReversal() {
  const p = useDiagramPalette()
  const candles: Candle[] = [
    { x: 40, o: 90, c: 70, h: 62, l: 98, up: true },
    { x: 75, o: 75, c: 95, h: 65, l: 105, up: false },
    // Hammer at support
    { x: 120, o: 130, c: 118, h: 110, l: 165, up: true },
    // Bullish engulfing
    { x: 175, o: 125, c: 140, h: 118, l: 148, up: false },
    { x: 210, o: 142, c: 95, h: 88, l: 150, up: true },
    // Shooting star
    { x: 280, o: 70, c: 85, h: 40, l: 95, up: false },
    { x: 320, o: 88, c: 110, h: 80, l: 118, up: false },
  ]
  return (
    <Frame title="Candles · reversal family">
      <line
        x1="28"
        x2="250"
        y1="150"
        y2="150"
        stroke={p.accent}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      {candles.map((c) => drawCandle(c, p.up, p.down))}
      <Label x="28" y="24" text="Hammer" fill={p.up} />
      <Label x="100" y="24" text="Engulfing" fill={p.accent} />
      <Label x="200" y="24" text="Shooting star" fill={p.down} />
      <Label x="118" y="178" text="at support" fill={p.muted} size={10} />
    </Frame>
  )
}

function CandleContinuation() {
  const p = useDiagramPalette()
  const candles: Candle[] = [
    { x: 50, o: 140, c: 110, h: 100, l: 148, up: true },
    { x: 95, o: 115, c: 90, h: 82, l: 122, up: true },
    // Rising three — small counter bars
    { x: 140, o: 95, c: 105, h: 88, l: 112, up: false },
    { x: 175, o: 108, c: 118, h: 100, l: 125, up: false },
    { x: 210, o: 120, c: 128, h: 112, l: 135, up: false },
    { x: 255, o: 125, c: 75, h: 68, l: 132, up: true },
    { x: 310, o: 80, c: 55, h: 48, l: 88, up: true },
  ]
  return (
    <Frame title="Candles · continuation (rising three)">
      {candles.map((c) => drawCandle(c, p.up, p.down))}
      <Label x="28" y="24" text="Impulse" fill={p.up} />
      <Label x="120" y="24" text="Quiet pause" fill={p.muted} />
      <Label x="220" y="24" text="Resume" fill={p.up} />
      <Label x="150" y="155" text="not a reversal" fill={p.muted} size={10} />
    </Frame>
  )
}

function CandleLocation() {
  const p = useDiagramPalette()
  const left: Candle[] = [
    { x: 50, o: 100, c: 85, h: 78, l: 108, up: true },
    { x: 90, o: 90, c: 110, h: 82, l: 118, up: false },
    { x: 130, o: 115, c: 70, h: 62, l: 122, up: true },
  ]
  const right: Candle[] = [
    { x: 240, o: 90, c: 75, h: 68, l: 98, up: true },
    { x: 280, o: 80, c: 100, h: 72, l: 108, up: false },
    { x: 320, o: 105, c: 60, h: 52, l: 112, up: true },
  ]
  return (
    <Frame title="Candles · same pattern, different place">
      <line
        x1="40"
        x2="180"
        y1="130"
        y2="130"
        stroke={p.up}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <line
        x1="230"
        x2="370"
        y1="55"
        y2="55"
        stroke={p.down}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      {left.map((c) => drawCandle(c, p.up, p.down))}
      {right.map((c) => drawCandle(c, p.up, p.down))}
      <Label x="28" y="24" text="At support → valid" fill={p.up} />
      <Label x="200" y="24" text="In empty air → ignore" fill={p.down} />
      <Label x="55" y="155" text="level" fill={p.muted} size={10} />
      <Label x="250" y="48" text="no level" fill={p.muted} size={10} />
    </Frame>
  )
}

const DIAGRAMS: Record<TheoryDiagramId, () => ReactNode> = {
  'dow-degrees': DowDegrees,
  'dow-phases': DowPhases,
  'dow-confirm': DowConfirm,
  'vp-quadrants': VpQuadrants,
  'vp-breakout': VpBreakout,
  'vp-divergence': VpDivergence,
  'elliott-impulse': ElliottImpulse,
  'elliott-correction': ElliottCorrection,
  'elliott-fib': ElliottFib,
  'wyckoff-cycle': WyckoffCycle,
  'wyckoff-accum': WyckoffAccum,
  'wyckoff-distrib': WyckoffDistrib,
  'wyckoff-spring': WyckoffSpring,
  'structure-trend': StructureTrend,
  'structure-choch': StructureChoch,
  'structure-value': StructureValue,
  'candle-reversal': CandleReversal,
  'candle-continuation': CandleContinuation,
  'candle-location': CandleLocation,
}

export default function TheoryDiagram({ id }: { id: TheoryDiagramId }) {
  const Diagram = DIAGRAMS[id]
  return <Diagram />
}
