import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  memo,
  useMemo,
  useCallback,
  useState,
  type MouseEvent,
  type TouchEvent,
} from 'react'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemoveOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'

import useOkxTicker from '../hooks/useOkxTicker'
import useOkxSignals from '../hooks/useOkxSignals'
import useOkxBackdrop from '../hooks/useOkxBackdrop'
import {
  DEFAULT_GROUP_ID,
  groupIdOf,
  useTickerStore,
} from '../store/useTickerStore'
import { openOkxDetail } from '../store/useOkxDetailStore'
import { removeOkxTicker } from '../store/okxRealtimeTicker'
import { okxTickerActions } from '../okx/okxTickerActions'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'

import OkxKlineChart from './OkxKlineChart'
import TickerContainer from './TickerContainer'
import LastPrice from './LastPrice'
import PriceRange from './PriceRange'
import OkxMarketMetrics from './OkxMarketMetrics'
import OkxLogoSymbol from './OkxLogoSymbol'
import OkxTickerCardSkeleton from './OkxTickerCardSkeleton'
import SignalPulse from './SignalPulse'
import {
  cardActionBarSx,
  compactCardActionBarSx,
  removeButtonSx,
} from './cardActionBarSx'

/**
 * Its own component so that it renders when the pin changes and not otherwise.
 * Inline on the card it was rebuilt on every ticker message — three tooltips,
 * three buttons and a popper each, for chrome that is hidden until a cursor
 * arrives and says nothing about the price. It was the single largest share of
 * the board's render work.
 */
const CardActions = memo(function CardActions({
  instId,
  pinned,
  compact = false,
  onOpenDetail,
  onTogglePin,
  onRemove,
}: {
  instId: string
  pinned: boolean
  compact?: boolean
  onOpenDetail: () => void
  onTogglePin: () => void
  onRemove: () => void
}) {
  const t = useMessages()
  const groups = useTickerStore((state) => state.groups)
  const assignedGroup = useTickerStore((state) => state.symbolGroup[instId])
  const setSymbolGroup = useTickerStore((state) => state.setSymbolGroup)
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<HTMLElement | null>(
    null,
  )

  const currentGroupId = groupIdOf(
    instId,
    groups,
    assignedGroup ? { [instId]: assignedGroup } : {},
  )

  // The action bar sits on top of the card, so clicks and pointer-downs here
  // must not trigger the card's double-click pin or start a drag gesture.
  const stopPropagation = useCallback((event: MouseEvent | TouchEvent) => {
    event.stopPropagation()
  }, [])

  return (
    <Stack
      direction="row"
      className="actionBar"
      sx={compact ? compactCardActionBarSx : cardActionBarSx}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <Tooltip title={t.card.openCharts} arrow>
        <IconButton
          size="small"
          aria-label={t.card.openCharts}
          onClick={onOpenDetail}
          sx={{ color: 'text.secondary' }}
        >
          <QueryStatsIcon />
        </IconButton>
      </Tooltip>
      {/* The pin is reachable by double-clicking the card, which nothing on the
          card announces; this is where that gesture is discoverable. */}
      <Tooltip title={pinned ? t.card.unpin : t.card.pin} arrow>
        <IconButton
          size="small"
          aria-label={pinned ? t.card.unpinAria : t.card.pinAria}
          onClick={onTogglePin}
          sx={{ color: pinned ? 'primary.main' : 'text.secondary' }}
        >
          {pinned ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
      {groups.length > 0 && (
        <>
          <Tooltip title={t.card.moveToGroup} arrow>
            <IconButton
              size="small"
              aria-label={t.card.moveToGroup}
              onClick={(event) => {
                event.stopPropagation()
                setGroupMenuAnchor(event.currentTarget)
              }}
              sx={{ color: 'text.secondary' }}
            >
              <DriveFileMoveOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={groupMenuAnchor}
            open={Boolean(groupMenuAnchor)}
            onClose={() => setGroupMenuAnchor(null)}
            onClick={stopPropagation}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: (theme) => ({
                  minWidth: 156,
                  borderRadius: '12px',
                  border: `1px solid ${theme.vars.palette.surface.border}`,
                  backgroundImage: 'none',
                  boxShadow: theme.vars.palette.surface.shadow,
                }),
              },
            }}
          >
            {[
              { id: DEFAULT_GROUP_ID, name: t.groups.defaultName },
              ...groups,
            ].map((group) => {
              const selected = group.id === currentGroupId
              return (
                <MenuItem
                  key={group.id}
                  dense
                  selected={selected}
                  onClick={() => {
                    setSymbolGroup(instId, group.id)
                    setGroupMenuAnchor(null)
                  }}
                  sx={{
                    justifyContent: 'space-between',
                    gap: 1.5,
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {group.name}
                  {selected && (
                    <CheckRoundedIcon
                      sx={{ fontSize: 16, color: 'primary.main' }}
                    />
                  )}
                </MenuItem>
              )
            })}
          </Menu>
        </>
      )}
      <Tooltip title={t.card.remove} arrow>
        <IconButton
          size="small"
          aria-label={t.card.removeAria}
          onClick={onRemove}
          sx={removeButtonSx}
        >
          <BookmarkRemoveIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  )
})

const COMPACT_CARD_SX = { px: 2, py: 1.5, gap: 1 } as const

function OkxTickerCard({ instId }: { instId: string }) {
  const t = useOkxTicker(instId)
  const { signals, flag } = useOkxSignals(instId)
  // The month behind the day. Nothing here can ring the card — it is read
  // separately from the signals for exactly that reason — so it reaches the
  // screen as the second track under the range and as that track's tooltip.
  const backdrop = useOkxBackdrop(instId)
  const pinned = useTickerStore((state) => state.pinnedInstIds.includes(instId))
  const compact = useTickerStore((state) => state.compactCard)

  // A chip or the badge carries any single reading on its own; the card only
  // claims the ring once two of the three kinds of reading agree, which is the
  // case worth crossing the grid for.
  const flagged = flag !== null

  // The placeholder ticker carries empty strings until the first message for
  // this instrument arrives, which may never happen for a delisted symbol.
  const ready = t.last !== ''
  const up = useMemo(() => +t.percent > 0, [t.percent])
  const changePercent = useMemo(() => +(+t.percent).toFixed(2), [t.percent])

  const handleRemove = useCallback(() => {
    void okxTickerActions.remove(instId)
    removeOkxTicker(instId)
    useTickerStore.getState().removeInstId(instId)
  }, [instId])

  const handleTogglePin = useCallback(() => {
    useTickerStore.getState().togglePinned(instId)
  }, [instId])

  // Opening the detail is deliberately a button rather than a click on the
  // card: the card already answers a double-click by pinning, and a single
  // click that opened a dialog would fire on the way to every one of those.
  const handleOpenDetail = useCallback(() => openOkxDetail(instId), [instId])

  if (!ready) {
    return (
      <OkxTickerCardSkeleton
        symbol={instId.split('-')[0]}
        compact={compact}
        onRemove={handleRemove}
      />
    )
  }

  return (
    <TickerContainer
      up={up}
      changePercent={changePercent}
      minWidth={compact ? 200 : 236}
      flagged={flagged}
      tapActions
      onDoubleClick={handleTogglePin}
      sx={compact ? COMPACT_CARD_SX : undefined}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          zIndex: 2,
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: 0.75, minWidth: 0 }}
        >
          <OkxLogoSymbol instId={instId} />
          {pinned && <StarIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
        </Stack>

        {/* Both readings of the same 24h change, so they sit together. */}
        <Stack sx={{ alignItems: 'end', flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: compact ? 18 : 20,
              fontWeight: 600,
              lineHeight: compact ? 1.2 : undefined,
              color: t.color,
              ...numericFont,
            }}
          >
            {+t.percent > 0 ? '+' : ''}
            {t.percent}%
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: t.color,
              lineHeight: 1.2,
              ...numericFont,
            }}
          >
            {t.dif}
          </Typography>
        </Stack>
      </Stack>

      <LastPrice
        last={t.last}
        lastSz={t.lastSz}
        up={t.isUp}
        compact={compact}
      />

      {compact ? (
        <CardActions
          instId={instId}
          compact
          pinned={pinned}
          onOpenDetail={handleOpenDetail}
          onTogglePin={handleTogglePin}
          onRemove={handleRemove}
        />
      ) : (
        <>
          <PriceRange
            low={t.low24h}
            high={t.high24h}
            last={t.last}
            open={t.open}
            up={up}
            monthPosition={backdrop.rangePosition}
            monthLabel={backdrop.readings
              .map((reading) => reading.detail)
              .join(' · ')}
          />

          {/* The action bar is positioned against the chart, so the chart owns
              the containing block rather than the card. */}
          <Box sx={{ position: 'relative' }}>
            <OkxKlineChart instId={instId} />

            <SignalPulse signals={signals} />

            <CardActions
              instId={instId}
              pinned={pinned}
              onOpenDetail={handleOpenDetail}
              onTogglePin={handleTogglePin}
              onRemove={handleRemove}
            />
          </Box>

          <OkxMarketMetrics instId={instId} signals={signals} />
        </>
      )}
    </TickerContainer>
  )
}

export default memo(OkxTickerCard)
