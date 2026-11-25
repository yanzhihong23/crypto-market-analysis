import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { type FormEvent, useEffect, useState } from 'react'

import { useMessages } from '../i18n'

/**
 * Shared dialog for creating or renaming a watchlist group. Submitting an empty
 * or whitespace-only name is blocked so a section header never renders blank.
 */
export default function OkxGroupDialog({
  open,
  title,
  initialName = '',
  submitLabel,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  initialName?: string
  submitLabel: string
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const t = useMessages()
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  const trimmed = name.trim()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmed) return
    onSubmit(trimmed)
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
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600, px: 3, pt: 2.5 }}>
          {title}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 0 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.groups.namePlaceholder}
            slotProps={{
              htmlInput: {
                maxLength: 24,
                'aria-label': t.groups.nameLabel,
              },
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2.5, gap: 1 }}>
          <Button
            size="small"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={!trimmed}
            sx={(theme) => ({
              px: 2.5,
              '&:disabled': {
                color: theme.vars.palette.text.secondary,
                background: theme.vars.palette.surface.subtle,
              },
            })}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
