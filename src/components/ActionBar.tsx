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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SortIcon from '@mui/icons-material/Sort'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { useState } from 'react'

import { OpenTime, SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { useOkxInstruments } from '../hooks/useOkxInstruments'

export default function ActionBar({
  onAdd,
  onRemove,
}: {
  onAdd?: (instId: string) => void
  onRemove?: (instId: string) => void
}) {
  const instIds = useTickerStore((state) => state.instIds)
  const setInstIds = useTickerStore((state) => state.setInstIds)
  const openTime = useTickerStore((state) => state.openTime)
  const sortBy = useTickerStore((state) => state.sortBy)
  const setOpenTime = useTickerStore((state) => state.setOpenTime)
  const setSortBy = useTickerStore((state) => state.setSortBy)

  const [show, setShow] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [newInstId, setNewInstId] = useState<string>('')
  const [removeInstId, setRemoveInstId] = useState<string>('')

  const instruments = useOkxInstruments()

  const filteredInstruments = instruments.filter(
    (i) => !instIds.includes(i.instId),
  )
  const filteredRemoveInstruments = instruments.filter((i) =>
    instIds.some((instId) => instId === i.instId),
  )
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems="end"
      spacing={2}
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10 }}
    >
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setShow(!show)}
        sx={{
          transform: show ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}
      >
        <MenuOpenIcon />
      </Fab>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="end"
        spacing={2}
        sx={{
          display: show ? 'flex' : 'none',
          transition: 'height 3s ease',
        }}
      >
        <Stack direction="row" spacing={2}>
          <Fab
            color="success"
            aria-label="add"
            onClick={() => setOpenAddDialog(true)}
          >
            <AddIcon />
          </Fab>
          <Fab
            color="error"
            aria-label="remove"
            onClick={() => setOpenRemoveDialog(true)}
          >
            <RemoveIcon />
          </Fab>
        </Stack>
        {/* Open Time */}
        <Stack direction="row" spacing={2}>
          <Fab
            variant="extended"
            color={openTime === OpenTime.OPEN24H ? 'secondary' : 'default'}
            onClick={() => setOpenTime(OpenTime.OPEN24H)}
          >
            <AccessTimeIcon sx={{ mr: 1 }} />
            24H
          </Fab>
          <Fab
            variant="extended"
            color={openTime === OpenTime.UTC0 ? 'secondary' : 'default'}
            onClick={() => setOpenTime(OpenTime.UTC0)}
          >
            <AccessTimeIcon sx={{ mr: 1 }} />
            UTC+0
          </Fab>
          <Fab
            variant="extended"
            color={openTime === OpenTime.UTC8 ? 'secondary' : 'default'}
            onClick={() => setOpenTime(OpenTime.UTC8)}
          >
            <AccessTimeIcon sx={{ mr: 1 }} />
            UTC+8
          </Fab>
        </Stack>
        {/* Sort By */}
        <Stack direction="row" spacing={2}>
          <Fab
            variant="extended"
            color={sortBy === SortBy.VOLUME ? 'secondary' : 'default'}
            onClick={() => setSortBy(SortBy.VOLUME)}
          >
            <SortIcon sx={{ mr: 1 }} />
            VOL
          </Fab>
          <Fab
            variant="extended"
            color={sortBy === SortBy.PERCENT ? 'secondary' : 'default'}
            onClick={() => setSortBy(SortBy.PERCENT)}
          >
            <SortIcon sx={{ mr: 1 }} />
            PER
          </Fab>
          <Fab
            variant="extended"
            color={sortBy === SortBy.RATIO ? 'secondary' : 'default'}
            onClick={() => setSortBy(SortBy.RATIO)}
          >
            <SortIcon sx={{ mr: 1 }} />
            L/S
          </Fab>
        </Stack>
      </Stack>

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
              onAdd?.(newInstId)
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
              onRemove?.(removeInstId)
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
