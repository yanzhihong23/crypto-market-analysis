import { useDroppable } from '@dnd-kit/core'
import {
  Box,
  ButtonBase,
  Collapse,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { type ReactNode, useState } from 'react'

import { DEFAULT_GROUP_ID } from '../store/useTickerStore'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'

import OkxBoardBreadth from './OkxBoardBreadth'

/**
 * One collapsible watchlist section that also acts as a drop zone for cards
 * dragged from other sections — including while collapsed, so a card can be
 * dropped straight onto the header bar.
 */
export default function OkxGroupSection({
  groupId,
  name,
  instIds,
  collapsed,
  compact,
  canMoveUp,
  canMoveDown,
  isDraggingFromOtherGroup,
  onToggleCollapse,
  onAddTicker,
  onRename,
  onMove,
  onDelete,
  children,
}: {
  groupId: string
  name: string
  instIds: string[]
  collapsed: boolean
  compact: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  isDraggingFromOtherGroup: boolean
  onToggleCollapse: () => void
  onAddTicker: () => void
  onRename?: () => void
  onMove?: (direction: 'up' | 'down') => void
  onDelete?: () => void
  children: ReactNode
}) {
  const t = useMessages()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const { setNodeRef, isOver } = useDroppable({ id: groupId })

  const isDefault = groupId === DEFAULT_GROUP_ID
  const dropHighlight = isOver && isDraggingFromOtherGroup

  return (
    <Box
      ref={setNodeRef}
      sx={(theme) => ({
        borderRadius: '14px',
        p: dropHighlight ? 1 : 0,
        m: dropHighlight ? -1 : 0,
        outline: dropHighlight
          ? `1.5px dashed ${theme.vars.palette.primary.main}`
          : '1.5px dashed transparent',
        backgroundColor: dropHighlight ? 'action.hover' : 'transparent',
        transition: 'background-color 150ms ease, outline-color 150ms ease',
      })}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1.25,
          mb: collapsed ? 0 : 1.5,
          minHeight: 34,
        }}
      >
        <ButtonBase
          aria-expanded={!collapsed}
          onClick={onToggleCollapse}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.5,
            ml: -1,
            borderRadius: '8px',
            minWidth: 0,
            '&:hover': {
              backgroundColor: 'surface.subtle',
            },
          }}
        >
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 18,
              color: 'text.secondary',
              flexShrink: 0,
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 180ms ease',
            }}
          />
          <Typography
            component="span"
            noWrap
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {name}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              color: 'text.secondary',
              ...numericFont,
            }}
          >
            {instIds.length}
          </Typography>
        </ButtonBase>

        <OkxBoardBreadth instIds={instIds} variant="section" />

        {dropHighlight && (
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: 'primary.main',
              whiteSpace: 'nowrap',
            }}
          >
            {t.groups.dropHint}
          </Typography>
        )}

        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: 0.25, ml: 'auto', flexShrink: 0 }}
        >
          <Tooltip title={t.groups.addToGroup(name)} arrow>
            <IconButton
              size="small"
              aria-label={t.groups.addToGroup(name)}
              onClick={onAddTicker}
              sx={{ color: 'text.secondary' }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {(!isDefault || canMoveUp || canMoveDown) && (
            <>
              <Tooltip title={t.groups.moreActions} arrow>
                <IconButton
                  size="small"
                  aria-label={t.groups.moreActions}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  sx={{ color: 'text.secondary' }}
                >
                  <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: (theme) => ({
                      minWidth: 148,
                      borderRadius: '12px',
                      border: `1px solid ${theme.vars.palette.surface.border}`,
                      backgroundImage: 'none',
                      boxShadow: theme.vars.palette.surface.shadow,
                    }),
                  },
                }}
              >
                {!isDefault && (
                  <MenuItem
                    dense
                    onClick={() => {
                      setMenuAnchor(null)
                      onRename?.()
                    }}
                  >
                    {t.groups.renameGroup}
                  </MenuItem>
                )}
                <MenuItem
                  dense
                  disabled={!canMoveUp}
                  onClick={() => {
                    setMenuAnchor(null)
                    onMove?.('up')
                  }}
                >
                  {t.groups.moveUp}
                </MenuItem>
                <MenuItem
                  dense
                  disabled={!canMoveDown}
                  onClick={() => {
                    setMenuAnchor(null)
                    onMove?.('down')
                  }}
                >
                  {t.groups.moveDown}
                </MenuItem>
                {!isDefault && [
                  <Divider key="divider" sx={{ my: 0.5 }} />,
                  <MenuItem
                    key="delete"
                    dense
                    onClick={() => {
                      setMenuAnchor(null)
                      onDelete?.()
                    }}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main' },
                    }}
                  >
                    {t.groups.delete}
                  </MenuItem>,
                ]}
              </Menu>
            </>
          )}
        </Stack>
      </Stack>

      <Collapse in={!collapsed}>
        {instIds.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: compact
                ? 'repeat(auto-fill, minmax(224px, 1fr))'
                : 'repeat(auto-fill, minmax(264px, 1fr))',
              gap: compact ? 1.5 : 2,
            }}
          >
            {children}
          </Box>
        ) : (
          <Box
            sx={(theme) => ({
              py: 2.5,
              px: 2,
              borderRadius: '12px',
              border: `1px dashed ${
                dropHighlight
                  ? theme.vars.palette.primary.main
                  : theme.vars.palette.surface.border
              }`,
              textAlign: 'center',
              fontSize: 13,
              color: dropHighlight ? 'primary.main' : 'text.secondary',
            })}
          >
            {dropHighlight ? t.groups.dropHint : t.groups.emptyHint}
          </Box>
        )}
      </Collapse>
    </Box>
  )
}
