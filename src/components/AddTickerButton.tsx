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
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useState } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { okxTickerActions } from '../okx/okxTickerActions'
import { OkxInstrument } from '../types/okx'
import { numericFont } from '../fonts'

import SymbolAvatar from './SymbolAvatar'

// Every perpetual OKX lists is an option, and Autocomplete renders the whole
// filtered set into the DOM. Capping it keeps an empty query from mounting
// several hundred rows and firing that many icon requests.
const filterOptions = createFilterOptions<OkxInstrument>({
  limit: 30,
  stringify: (option) => option.instId,
})

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
}: {
  variant?: 'cell' | 'standalone'
}) {
  const instruments = useTickerStore((state) => state.instruments)
  const instIds = useTickerStore((state) => state.instIds)
  const setInstIds = useTickerStore((state) => state.setInstIds)

  const [open, setOpen] = useState(false)
  const [newInstId, setNewInstId] = useState<string>('')

  const filteredInstruments = instruments.filter(
    (i) => !instIds.includes(i.instId),
  )

  const close = () => {
    setOpen(false)
    setNewInstId('')
  }

  const add = () => {
    void okxTickerActions.add(newInstId)
    setInstIds([...instIds, newInstId])
    close()
  }

  return (
    <>
      <ButtonBase
        aria-label="Add ticker"
        onClick={() => setOpen(true)}
        sx={(theme) => ({
          flexDirection: 'column',
          gap: 1,
          width: '100%',
          // Matches a card in the cell, and stays a button in the empty state,
          // where there is no row of cards to take its height from.
          height: variant === 'cell' ? '100%' : 'auto',
          minHeight: variant === 'cell' ? 160 : 0,
          px: 2.5,
          py: variant === 'cell' ? 2.5 : 1.5,
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
        Add ticker
      </ButtonBase>

      <Dialog
        open={open}
        onClose={close}
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
          Add ticker
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 0 }}>
          <Autocomplete
            autoHighlight
            size="small"
            options={filteredInstruments}
            filterOptions={filterOptions}
            getOptionLabel={(option) => option.instId}
            noOptionsText="No matching perpetual"
            onChange={(_, value) => {
              setNewInstId(value?.instId ?? '')
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                placeholder="Search a symbol, e.g. SOL"
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2.5, gap: 1 }}>
          <Button size="small" onClick={close} sx={{ color: 'text.secondary' }}>
            Cancel
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
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
