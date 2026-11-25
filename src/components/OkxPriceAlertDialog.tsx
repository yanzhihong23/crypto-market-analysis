import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import useOkxTicker from '../hooks/useOkxTicker'
import { type PriceAlertDirection, useAlertStore } from '../store/useAlertStore'
import { formatNumber } from '../utils'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'

import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'
import SymbolAvatar from './SymbolAvatar'

const QUICK_OFFSETS = [-5, -2, 2, 5] as const

/** Keeps percentage-offset presets at the live price's own decimal precision. */
function roundToPrecision(value: number, reference: string) {
  const decimals = reference.includes('.') ? reference.split('.')[1].length : 0
  return value.toFixed(Math.min(decimals, 8))
}

export default function OkxPriceAlertDialog({
  instId,
  open,
  onClose,
}: {
  instId: string
  open: boolean
  onClose: () => void
}) {
  const t = useMessages()
  const ticker = useOkxTicker(instId)
  const allRules = useAlertStore((state) => state.priceRules)
  const addPriceRule = useAlertStore((state) => state.addPriceRule)
  const removePriceRule = useAlertStore((state) => state.removePriceRule)

  const rules = useMemo(
    () => allRules.filter((rule) => rule.instId === instId),
    [allRules, instId],
  )

  const [priceInput, setPriceInput] = useState('')
  const [direction, setDirection] = useState<PriceAlertDirection>('above')
  const [directionManual, setDirectionManual] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setPriceInput('')
      setDirection('above')
      setDirectionManual(false)
      setNote('')
    }
  }, [open, instId])

  const livePrice = Number(ticker.last)
  const hasLivePrice =
    ticker.last !== '' && Number.isFinite(livePrice) && livePrice > 0
  const parsedPrice = Number(priceInput)
  const validPrice =
    priceInput.trim() !== '' && Number.isFinite(parsedPrice) && parsedPrice > 0

  const symbol = instId.split('-')[0]

  const directionOptions: SegmentedOption<PriceAlertDirection>[] = [
    { value: 'above', label: t.priceAlert.above },
    { value: 'below', label: t.priceAlert.below },
  ]

  const handlePriceChange = (raw: string) => {
    setPriceInput(raw)
    if (directionManual || !hasLivePrice) return
    const num = Number(raw)
    if (Number.isFinite(num) && num > 0) {
      setDirection(num >= livePrice ? 'above' : 'below')
    }
  }

  const handlePreset = (offsetPercent: number) => {
    if (!hasLivePrice) return
    const next = livePrice * (1 + offsetPercent / 100)
    setPriceInput(roundToPrecision(next, ticker.last))
    setDirection(offsetPercent > 0 ? 'above' : 'below')
    setDirectionManual(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validPrice) return
    addPriceRule({
      instId,
      price: parsedPrice,
      direction,
      note,
    })
    setPriceInput('')
    setNote('')
    setDirectionManual(false)
  }

  const distanceText = (target: number) => {
    if (!hasLivePrice) return null
    const pct = ((target - livePrice) / livePrice) * 100
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.vars.palette.surface.border}`,
            backgroundImage: 'none',
          }),
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            px: 3,
            pt: 2.5,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
            <SymbolAvatar instId={instId} size={24} />
            <Stack>
              <Typography
                sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}
              >
                {t.priceAlert.title(symbol)}
              </Typography>
              {hasLivePrice && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary',
                    ...numericFont,
                  }}
                >
                  {t.priceAlert.currentPrice(ticker.last)}
                </Typography>
              )}
            </Stack>
          </Stack>
          <IconButton
            size="small"
            aria-label={t.common.close}
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 0, pt: 0.5 }}>
          <Stack sx={{ gap: 1.75 }}>
            <SegmentedToggle
              label={t.priceAlert.direction}
              value={direction}
              options={directionOptions}
              onChange={(next) => {
                setDirection(next)
                setDirectionManual(true)
              }}
            />

            <Stack sx={{ gap: 1 }}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                value={priceInput}
                onChange={(event) => handlePriceChange(event.target.value)}
                placeholder={
                  hasLivePrice ? ticker.last : t.priceAlert.targetPlaceholder
                }
                slotProps={{
                  htmlInput: {
                    inputMode: 'decimal',
                    'aria-label': t.priceAlert.targetLabel,
                  },
                }}
                sx={(theme) => ({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    ...numericFont,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.vars.palette.divider,
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '1px',
                    borderColor: theme.vars.palette.text.primary,
                  },
                })}
              />

              {hasLivePrice && (
                <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
                  {QUICK_OFFSETS.map((offset) => (
                    <ButtonBase
                      key={offset}
                      onClick={() => handlePreset(offset)}
                      sx={(theme) => ({
                        px: 1.25,
                        py: 0.375,
                        borderRadius: '8px',
                        fontSize: 12,
                        fontWeight: 500,
                        ...numericFont,
                        color: offset > 0 ? 'market.up' : 'market.down',
                        backgroundColor: theme.vars.palette.surface.subtle,
                        '&:hover': {
                          backgroundColor: theme.vars.palette.action.hover,
                        },
                      })}
                    >
                      {offset > 0 ? `+${offset}%` : `${offset}%`}
                    </ButtonBase>
                  ))}
                </Stack>
              )}
            </Stack>

            <TextField
              fullWidth
              size="small"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.priceAlert.notePlaceholder}
              slotProps={{
                htmlInput: { maxLength: 40 },
              }}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.vars.palette.divider,
                },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '1px',
                  borderColor: theme.vars.palette.text.primary,
                },
              })}
            />

            {rules.length > 0 && (
              <>
                <Divider />
                <Stack sx={{ gap: 0.75 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'text.secondary',
                    }}
                  >
                    {t.priceAlert.activeCount(rules.length)}
                  </Typography>
                  {rules.map((rule) => {
                    const dist = distanceText(rule.price)
                    return (
                      <Stack
                        key={rule.id}
                        direction="row"
                        sx={(theme) => ({
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          px: 1.25,
                          py: 0.75,
                          borderRadius: '10px',
                          backgroundColor: theme.vars.palette.surface.subtle,
                        })}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            sx={{ alignItems: 'baseline', gap: 1 }}
                          >
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'signal.main',
                                ...numericFont,
                              }}
                            >
                              {t.priceAlert.ruleShort(
                                rule.direction === 'above',
                                formatNumber(rule.price, 8),
                              )}
                            </Typography>
                            {dist && (
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: 'text.secondary',
                                  ...numericFont,
                                }}
                              >
                                {dist}
                              </Typography>
                            )}
                          </Stack>
                          {rule.note && (
                            <Typography
                              noWrap
                              sx={{ fontSize: 11, color: 'text.secondary' }}
                            >
                              {rule.note}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          aria-label={t.priceAlert.delete}
                          onClick={() => removePriceRule(rule.id)}
                          sx={{ color: 'text.secondary', p: 0.5 }}
                        >
                          <CloseIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Stack>
                    )
                  })}
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2.5, gap: 1 }}>
          <Button
            size="small"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            {t.common.close}
          </Button>
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={!validPrice}
            sx={(theme) => ({
              px: 2.5,
              '&:disabled': {
                color: theme.vars.palette.text.secondary,
                background: theme.vars.palette.surface.subtle,
              },
            })}
          >
            {t.common.add}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
