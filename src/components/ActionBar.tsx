import {
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Autocomplete,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { useState } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { removeOkxTicker } from '../store/okxRealtimeTicker'
import { okxTickerActions } from '../okx/okxTickerActions'

/**
 * Only the two watchlist actions live here now. Sort and open time moved to
 * the toolbar above the grid, where their current value is always visible.
 */
export default function ActionBar() {
  const instruments = useTickerStore((state) => state.instruments)
  const instIds = useTickerStore((state) => state.instIds)
  const setInstIds = useTickerStore((state) => state.setInstIds)

  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [newInstId, setNewInstId] = useState<string>('')
  const [removeInstId, setRemoveInstId] = useState<string>('')

  const filteredInstruments = instruments.filter(
    (i) => !instIds.includes(i.instId),
  )
  const filteredRemoveInstruments = instruments.filter((i) =>
    instIds.some((instId) => instId === i.instId),
  )

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10 }}
    >
      <Tooltip title="Remove ticker" arrow>
        <Fab
          size="medium"
          aria-label="Remove ticker"
          onClick={() => setOpenRemoveDialog(true)}
        >
          <RemoveIcon />
        </Fab>
      </Tooltip>
      <Tooltip title="Add ticker" arrow>
        <Fab
          color="primary"
          aria-label="Add ticker"
          onClick={() => setOpenAddDialog(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add Ticker</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={filteredInstruments}
            getOptionLabel={(option) => option.instId}
            renderInput={(params) => <TextField {...params} label="Ticker" />}
            onChange={(_, value) => {
              if (value) {
                setNewInstId(value.instId)
              }
            }}
            sx={{ width: 300, mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenAddDialog(false)
              void okxTickerActions.add(newInstId)
              setInstIds([...instIds, newInstId])
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRemoveDialog}
        onClose={() => setOpenRemoveDialog(false)}
      >
        <DialogTitle>Remove Ticker</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={filteredRemoveInstruments}
            getOptionLabel={(option) => option.instId}
            renderInput={(params) => <TextField {...params} label="Ticker" />}
            onChange={(_, value) => {
              if (value) {
                setRemoveInstId(value.instId)
              }
            }}
            sx={{ width: 300, mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemoveDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenRemoveDialog(false)
              void okxTickerActions.remove(removeInstId)
              removeOkxTicker(removeInstId)
              setInstIds(instIds.filter((i) => i !== removeInstId))
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
