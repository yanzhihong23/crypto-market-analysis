import {
  Box,
  ButtonBase,
  Collapse,
  FormControlLabel,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { Fragment, useId, useState } from 'react'

import { OpenTime, SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { useMessages } from '../i18n'
import type { Messages } from '../i18n/en'

import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'
import OkxBoardBreadth from './OkxBoardBreadth'

// Built per language rather than held as a constant, so the segments are named
// in whichever one is on. Gainers and losers are separate segments rather than
// one Change segment with a direction: the sort ran descending only, so the
// worst movers of the day were the one thing the board could not be asked for.
const sortOptions = (t: Messages): SegmentedOption<SortBy>[] => [
  { value: SortBy.DEFAULT, label: t.toolbar.sortDefault },
  { value: SortBy.GAINERS, label: t.toolbar.sortGainers },
  { value: SortBy.LOSERS, label: t.toolbar.sortLosers },
  { value: SortBy.VOLUME, label: t.toolbar.sortVolume },
  { value: SortBy.RATIO, label: t.toolbar.sortRatio },
]

const openTimeOptions = (t: Messages): SegmentedOption<OpenTime>[] => [
  { value: OpenTime.OPEN24H, label: t.toolbar.open24h },
  { value: OpenTime.UTC0, label: t.toolbar.openUtc0 },
  { value: OpenTime.UTC8, label: t.toolbar.openUtc8 },
]

export default function OkxMarketToolbar() {
  const openTime = useTickerStore((state) => state.openTime)
  const sortBy = useTickerStore((state) => state.sortBy)
  const klineVolume = useTickerStore((state) => state.klineVolume)
  const compactCard = useTickerStore((state) => state.compactCard)
  const setOpenTime = useTickerStore((state) => state.setOpenTime)
  const setSortBy = useTickerStore((state) => state.setSortBy)
  const setKlineVolume = useTickerStore((state) => state.setKlineVolume)
  const setCompactCard = useTickerStore((state) => state.setCompactCard)
  const t = useMessages()
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()

  const sorts = sortOptions(t)
  const openTimes = openTimeOptions(t)

  if (compact) {
    // On a phone the three controls stack to ~200px, pushing the second card
    // below the fold. Collapse them into a single bar that still prints the
    // active sort, open-time baseline and card mode so nothing about how the
    // board is being read is hidden while folded.
    const activeSort = sorts.find((o) => o.value === sortBy)?.label
    const activeOpenTime = openTimes.find((o) => o.value === openTime)?.label
    const summaryItems = [
      activeSort,
      activeOpenTime,
      ...(compactCard
        ? [t.toolbar.compact]
        : klineVolume
          ? [t.toolbar.klineVolume]
          : []),
    ].filter((item): item is string => Boolean(item))

    return (
      <Box
        sx={(th) => ({
          mb: 2,
          borderRadius: '12px',
          border: `1px solid ${th.vars.palette.surface.border}`,
          backgroundColor: 'background.paper',
          overflow: 'hidden',
        })}
      >
        <ButtonBase
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${t.toolbar.controls}${t.common.colon}${summaryItems.join(' · ')}`}
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            width: '100%',
            minHeight: 40,
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            textAlign: 'left',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}
          >
            <TuneRoundedIcon
              sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }}
            />
            <Typography
              component="span"
              noWrap
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: 'text.primary',
              }}
            >
              {summaryItems.map((item, index) => (
                <Fragment key={item}>
                  {index > 0 && (
                    <Box
                      component="span"
                      aria-hidden
                      sx={{ mx: 0.75, color: 'text.secondary', opacity: 0.5 }}
                    >
                      ·
                    </Box>
                  )}
                  {item}
                </Fragment>
              ))}
            </Typography>
          </Stack>
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 18,
              color: 'text.secondary',
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </ButtonBase>

        <Collapse in={expanded} id={panelId}>
          <Stack
            sx={(th) => ({
              gap: 1.5,
              px: 1.25,
              py: 1.5,
              borderTop: `1px solid ${th.vars.palette.surface.border}`,
            })}
          >
            <SegmentedToggle
              label={t.toolbar.sortBy}
              value={sortBy}
              options={sorts}
              onChange={setSortBy}
            />
            <SegmentedToggle
              label={t.toolbar.openTime}
              value={openTime}
              options={openTimes}
              onChange={setOpenTime}
            />
            <FormControlLabel
              labelPlacement="start"
              control={
                <Switch
                  size="small"
                  checked={compactCard}
                  onChange={(event) => setCompactCard(event.target.checked)}
                />
              }
              label={t.toolbar.compact}
              sx={{
                ml: 0,
                mr: 0,
                justifyContent: 'space-between',
                '& .MuiFormControlLabel-label': {
                  fontSize: 13,
                  color: 'text.secondary',
                },
              }}
            />
            <FormControlLabel
              labelPlacement="start"
              disabled={compactCard}
              control={
                <Switch
                  size="small"
                  checked={klineVolume}
                  onChange={(event) => setKlineVolume(event.target.checked)}
                />
              }
              label={t.toolbar.klineVolume}
              sx={{
                ml: 0,
                mr: 0,
                justifyContent: 'space-between',
                '& .MuiFormControlLabel-label': {
                  fontSize: 13,
                  color: 'text.secondary',
                },
              }}
            />
          </Stack>
        </Collapse>
      </Box>
    )
  }

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 3,
        flexWrap: 'wrap',
        mb: 2.5,
      }}
    >
      <SegmentedToggle
        label={t.toolbar.sortBy}
        value={sortBy}
        options={sorts}
        onChange={setSortBy}
      />
      <SegmentedToggle
        label={t.toolbar.openTime}
        value={openTime}
        options={openTimes}
        onChange={setOpenTime}
      />
      {/* Switches rather than segmented tracks: the controls to the left each
          pick one of several readings of the board, and these only toggle a
          display layer. Labels go after the control so they line up with the
          labels to their left, which sit before their tracks. */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
        <Tooltip title={t.toolbar.compactHint} arrow>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={compactCard}
                onChange={(event) => setCompactCard(event.target.checked)}
              />
            }
            label={t.toolbar.compact}
            sx={{
              ml: 0,
              mr: 0,
              '& .MuiFormControlLabel-label': {
                ml: 0.5,
                fontSize: 13,
                color: 'text.secondary',
              },
            }}
          />
        </Tooltip>
        <Tooltip title={t.toolbar.klineVolumeHint} arrow>
          <FormControlLabel
            disabled={compactCard}
            control={
              <Switch
                size="small"
                checked={klineVolume}
                onChange={(event) => setKlineVolume(event.target.checked)}
              />
            }
            label={t.toolbar.klineVolume}
            sx={{
              ml: 0,
              mr: 0,
              '& .MuiFormControlLabel-label': {
                // The switch's own padding is all that separates it from its
                // label otherwise, and the two read as one glyph.
                ml: 0.5,
                fontSize: 13,
                color: 'text.secondary',
              },
            }}
          />
        </Tooltip>
      </Stack>
      <OkxBoardBreadth />
    </Stack>
  )
}
