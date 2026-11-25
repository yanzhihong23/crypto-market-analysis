import {
  ButtonBase,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Autocomplete,
  createFilterOptions,
  DialogActions,
  Button,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useEffect, useState } from 'react'

import { DEFAULT_GROUP_ID, useTickerStore } from '../store/useTickerStore'
import { okxTickerActions } from '../okx/okxTickerActions'
import { OkxInstrument } from '../types/okx'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'

import SymbolAvatar from './SymbolAvatar'

// Every perpetual OKX lists is an option, and Autocomplete renders the whole
// filtered set into the DOM. Capping it keeps an empty query from mounting
// several hundred rows and firing that many icon requests.
const filterOptions = createFilterOptions<OkxInstrument>({
  limit: 30,
  stringify: (option) => option.instId,
})

export function AddTickerDialog({
  open,
  defaultGroupId = DEFAULT_GROUP_ID,
  onClose,
}: {
  open: boolean
  defaultGroupId?: string
  onClose: () => void
}) {
  const instruments = useTickerStore((state) => state.instruments)
  const instIds = useTickerStore((state) => state.instIds)
  const groups = useTickerStore((state) => state.groups)
  const setInstIds = useTickerStore((state) => state.setInstIds)
  const setSymbolGroup = useTickerStore((state) => state.setSymbolGroup)
  const t = useMessages()

  const [newInstId, setNewInstId] = useState<string>('')
  const [groupId, setGroupId] = useState<string>(defaultGroupId)

  useEffect(() => {
    if (open) {
      setNewInstId('')
      setGroupId(defaultGroupId)
    }
  }, [open, defaultGroupId])

  const filteredInstruments = instruments.filter(
    (i) => !instIds.includes(i.instId),
  )

  const add = () => {
    if (!newInstId) return
    if (groupId !== DEFAULT_GROUP_ID) {
      setSymbolGroup(newInstId, groupId)
    }
    void okxTickerActions.add(newInstId)
    setInstIds([...instIds, newInstId])
    onClose()
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
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, px: 3, pt: 2.5 }}>
        {t.addTicker.action}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 0 }}>
        <Stack sx={{ gap: 2 }}>
          <Autocomplete
            autoHighlight
            size="small"
            options={filteredInstruments}
            filterOptions={filterOptions}
            getOptionLabel={(option) => option.instId}
            noOptionsText={t.addTicker.noOptions}
            clearText={t.common.clear}
            openText={t.common.open}
            closeText={t.common.close}
            onChange={(_, value) => {
              setNewInstId(value?.instId ?? '')
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                placeholder={t.addTicker.placeholder}
                sx={(theme) => ({
                  // Same radius and focus treatment as the selects elsewhere,
                  // instead of the default outlined field's squarer corner.
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
            )}
            renderOption={({ key, ...props }, option) => {
              const [symbol, ...rest] = option.instId.split('-')
              return (
                <Box
                  component="li"
                  key={key}
                  {...props}
                  sx={{ gap: 1.5, px: 1.5 }}
                >
                  <SymbolAvatar instId={option.instId} size={20} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {symbol}
                  </Typography>
                  <Typography
                    sx={[
                      {
                        fontSize: 12,
                        color: 'text.secondary',
                      },
                      ...(Array.isArray(numericFont)
                        ? numericFont
                        : [numericFont]),
                    ]}
                  >
                    {rest.join('-')}
                  </Typography>
                </Box>
              )
            }}
            slotProps={{
              paper: {
                sx: (theme) => ({
                  mt: 0.5,
                  borderRadius: '12px',
                  border: `1px solid ${theme.vars.palette.surface.border}`,
                  backgroundImage: 'none',
                  boxShadow: theme.vars.palette.surface.shadow,
                }),
              },
              // Thirty rows is taller than most viewports; scroll them instead
              // of letting the list run off the bottom of the screen.
              listbox: { sx: { py: 0.5, maxHeight: 264 } },
            }}
          />

          {groups.length > 0 && (
            <Stack sx={{ gap: 0.75 }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {t.addTicker.group}
              </Typography>
              <Select
                size="small"
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                sx={{ fontSize: 14, fontWeight: 500 }}
              >
                <MenuItem value={DEFAULT_GROUP_ID}>
                  {t.groups.defaultName}
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 2.5, gap: 1 }}>
        <Button size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          {t.common.cancel}
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!newInstId}
          onClick={add}
          sx={(theme) => ({
            px: 2.5,
            // The theme's disabled contained style is a fixed pale blue that
            // glares against the dark background.
            '&:disabled': {
              color: theme.vars.palette.text.secondary,
              background: theme.vars.palette.surface.subtle,
            },
          })}
        >
          {t.common.add}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * Adding is the only watchlist action that has nowhere else to live: removing
 * a ticker is done on the card itself, so the paired remove button sat here
 * duplicating it behind an extra dialog.
 *
 * `cell` is the slot that trails the board, sized like a card. `standalone` is
 * for the empty state, where there is no grid for it to trail and the button
 * carries the whole call to action.
 */
export default function AddTickerButton({
  variant = 'cell',
  compact = false,
  defaultGroupId = DEFAULT_GROUP_ID,
}: {
  variant?: 'cell' | 'standalone'
  compact?: boolean
  defaultGroupId?: string
}) {
  const t = useMessages()
  const [open, setOpen] = useState(false)

  return (
    <>
      <ButtonBase
        aria-label={t.addTicker.action}
        onClick={() => setOpen(true)}
        sx={(theme) => ({
          flexDirection: compact ? 'row' : 'column',
          gap: 1,
          width: '100%',
          // Matches a card in the cell, and stays a button in the empty state,
          // where there is no row of cards to take its height from.
          height: variant === 'cell' ? '100%' : 'auto',
          minHeight: variant === 'cell' ? (compact ? 84 : 160) : 0,
          px: compact ? 2 : 2.5,
          py: variant === 'cell' ? (compact ? 1.5 : 2.5) : 1.5,
          maxWidth: variant === 'cell' ? 'none' : 200,
          borderRadius: '16px',
          fontSize: 14,
          fontWeight: 600,
          // Dashed and unfilled: the slot reads as the space a card would take
          // rather than as another card, and the prices keep the saturation.
          color: theme.vars.palette.text.secondary,
          border: `1px dashed ${theme.vars.palette.surface.border}`,
          transition: 'color 0.2s ease-out, border-color 0.2s ease-out',
          '&:hover': {
            color: theme.vars.palette.text.primary,
            borderColor: theme.vars.palette.surface.marker,
          },
        })}
      >
        <AddIcon sx={{ fontSize: 20 }} />
        {t.addTicker.action}
      </ButtonBase>

      <AddTickerDialog
        open={open}
        defaultGroupId={defaultGroupId}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
