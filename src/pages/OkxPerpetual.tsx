import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import { memo, useCallback, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { SortBy } from '../types/okx'
import {
  DEFAULT_GROUP_ID,
  TickerGroup,
  groupIdOf,
  orderedGroupIds,
  useTickerStore,
} from '../store/useTickerStore'
import { closeOkxDetail, useOkxDetailStore } from '../store/useOkxDetailStore'
import OkxTickerCard from '../components/OkxTickerCard'
import OkxTickerDetail from '../components/OkxTickerDetail'
import AddTickerButton, { AddTickerDialog } from '../components/AddTickerButton'
import OkxDataSync from '../components/OkxDataSync'
import OkxMarketToolbar from '../components/OkxMarketToolbar'
import OkxGroupSection from '../components/OkxGroupSection'
import OkxGroupDialog from '../components/OkxGroupDialog'
import SymbolAvatar from '../components/SymbolAvatar'
import EmptyWatchlist from '../components/EmptyWatchlist'
import useOkxSignals from '../hooks/useOkxSignals'
import useOkxTickerPercents from '../hooks/useOkxTickerPercents'
import { useMessages } from '../i18n'

/**
 * A stable empty list for the sorts that do not read the live percent, so the
 * subscription is not torn down and rebuilt on every render.
 */
const NO_INST_IDS: string[] = []

const OkxTickerGridItem = memo(function OkxTickerGridItem({
  instId,
  sortIndex,
  draggable,
}: {
  instId: string
  sortIndex: number
  draggable: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: instId,
    disabled: !draggable,
  })

  return (
    <Box
      ref={setNodeRef}
      {...(draggable ? attributes : undefined)}
      {...(draggable ? listeners : undefined)}
      sx={{
        // Grid auto-placement follows order-modified document order, so the
        // cards can be re-sorted visually while their DOM order stays fixed
        // and the subscribed cards are never torn down and remounted.
        order: sortIndex,
        minWidth: 0,
        height: '100%',
        contain: 'layout',
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 150ms ease',
        cursor: isDragging ? 'grabbing' : undefined,
      }}
    >
      <OkxTickerCard instId={instId} />
    </Box>
  )
})

function DragCardPreview({ instId }: { instId: string }) {
  const symbol = instId.split('-')[0]
  return (
    <Stack
      direction="row"
      sx={(theme) => ({
        alignItems: 'center',
        gap: 1,
        px: 1.75,
        py: 1,
        borderRadius: '12px',
        backgroundColor: theme.vars.palette.background.paper,
        border: `1px solid ${theme.vars.palette.primary.main}`,
        boxShadow: theme.vars.palette.surface.shadow,
        pointerEvents: 'none',
      })}
    >
      <DragIndicatorRoundedIcon
        sx={{ fontSize: 16, color: 'text.secondary' }}
      />
      <SymbolAvatar instId={instId} size={22} />
      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{symbol}</Typography>
    </Stack>
  )
}

const OkxTickerGrid = memo(function OkxTickerGrid() {
  const sortBy = useTickerStore((state) => state.sortBy)
  const instIds = useTickerStore((state) => state.instIds)
  const pinnedInstIds = useTickerStore((state) => state.pinnedInstIds)
  const compact = useTickerStore((state) => state.compactCard)
  const groups = useTickerStore((state) => state.groups)
  const groupOrder = useTickerStore((state) => state.groupOrder)
  const defaultGroupCollapsed = useTickerStore(
    (state) => state.defaultGroupCollapsed,
  )
  const symbolGroup = useTickerStore((state) => state.symbolGroup)
  const addGroup = useTickerStore((state) => state.addGroup)
  const renameGroup = useTickerStore((state) => state.renameGroup)
  const deleteGroup = useTickerStore((state) => state.deleteGroup)
  const moveGroup = useTickerStore((state) => state.moveGroup)
  const toggleGroupCollapsed = useTickerStore(
    (state) => state.toggleGroupCollapsed,
  )
  const setSymbolGroup = useTickerStore((state) => state.setSymbolGroup)
  const t = useMessages()

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [addTargetGroupId, setAddTargetGroupId] = useState<string | null>(null)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [renamingGroup, setRenamingGroup] = useState<TickerGroup | null>(null)

  const sortValues = useTickerStore(
    useShallow((state) => {
      if (sortBy === SortBy.VOLUME) {
        return instIds.map((id) => state.volCcyQuote[id] ?? '0')
      }
      if (sortBy === SortBy.RATIO) {
        return instIds.map((id) => state.ratio[id]?.value ?? '0')
      }
      return null
    }),
  )
  const byChange = sortBy === SortBy.GAINERS || sortBy === SortBy.LOSERS
  const percentValues = useOkxTickerPercents(byChange ? instIds : NO_INST_IDS)

  // Distance threshold on mouse keeps single-clicks and double-click-to-pin
  // crisp; delay on touch keeps normal vertical scrolling unblocked on phones.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 8 },
    }),
  )

  const sortIndexByInstId = useMemo(() => {
    // Scored up front: the comparator used to call indexOf on every comparison,
    // which walked the whole watchlist to place each pair.
    const score = new Map<string, number>()
    instIds.forEach((instId, index) => {
      score.set(
        instId,
        sortValues ? +(sortValues[index] ?? 0) : (percentValues[index] ?? 0),
      )
    })

    const ordered = [...instIds]
    if (sortBy === SortBy.LOSERS) {
      ordered.sort((a, b) => (score.get(a) ?? 0) - (score.get(b) ?? 0))
    } else if (sortBy !== SortBy.DEFAULT) {
      // Default is the order the tickers were added in, so it sorts by nothing.
      ordered.sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0))
    }

    // Pinned symbols take the front within whichever section holds them,
    // keeping their relative order under the active sort.
    const pinned = new Set(pinnedInstIds)
    const finalOrder = [
      ...ordered.filter((instId) => pinned.has(instId)),
      ...ordered.filter((instId) => !pinned.has(instId)),
    ]

    const map = new Map<string, number>()
    finalOrder.forEach((id, index) => map.set(id, index))
    return map
  }, [instIds, percentValues, pinnedInstIds, sortBy, sortValues])

  const instIdsByGroup = useMemo(() => {
    const map = new Map<string, string[]>()
    map.set(DEFAULT_GROUP_ID, [])
    for (const group of groups) {
      map.set(group.id, [])
    }
    for (const instId of instIds) {
      const gid = groupIdOf(instId, groups, symbolGroup)
      const bucket = map.get(gid)
      if (bucket) bucket.push(instId)
    }
    return map
  }, [groups, instIds, symbolGroup])

  const activeDragGroupId = activeDragId
    ? groupIdOf(activeDragId, groups, symbolGroup)
    : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null)
      if (!event.over) return
      const instId = String(event.active.id)
      const targetGroupId = String(event.over.id)
      setSymbolGroup(instId, targetGroupId)
    },
    [setSymbolGroup],
  )

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

  if (!instIds.length && !groups.length) {
    return <EmptyWatchlist />
  }

  // Zero custom groups: render the flat board with no section-header chrome.
  if (!groups.length) {
    return (
      <Box
        sx={{
          display: 'grid',
          // Column count follows the available width instead of six hardcoded
          // breakpoints, which used to stretch cards past 400px on wide screens.
          //
          // The minimum in full mode is what the chip row needs to stay on one
          // line: four chips come to about 217px and the card spends 20px of
          // padding a side. Compact cards drop that row and tighten their
          // padding, so more columns fit across wide screens without squeezing
          // long prices.
          gridTemplateColumns: compact
            ? 'repeat(auto-fill, minmax(224px, 1fr))'
            : 'repeat(auto-fill, minmax(264px, 1fr))',
          gap: compact ? 1.5 : 2,
        }}
      >
        {instIds.map((instId) => (
          <OkxTickerGridItem
            key={instId}
            instId={instId}
            sortIndex={sortIndexByInstId.get(instId) ?? 0}
            draggable={false}
          />
        ))}
        {/* Ordered past every card so it holds the end of the grid. It used to be
            a floating button pinned to the corner of the viewport, which sat on
            top of the last row once the cards filled the page. */}
        <Box sx={{ order: instIds.length, minWidth: 0, height: '100%' }}>
          <AddTickerButton compact={compact} />
        </Box>
      </Box>
    )
  }

  const defaultInstIds = instIdsByGroup.get(DEFAULT_GROUP_ID) ?? []
  const showDefaultSection =
    defaultInstIds.length > 0 ||
    (activeDragId !== null && activeDragGroupId !== DEFAULT_GROUP_ID)

  const groupById = new Map(groups.map((group) => [group.id, group]))
  const visibleSectionIds = orderedGroupIds(groups, groupOrder).filter(
    (gid) => gid !== DEFAULT_GROUP_ID || showDefaultSection,
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Stack sx={{ gap: 3 }}>
          {visibleSectionIds.map((sectionId, index) => {
            const isDefault = sectionId === DEFAULT_GROUP_ID
            const group = isDefault ? undefined : groupById.get(sectionId)
            if (!isDefault && !group) return null
            const sectionInstIds = instIdsByGroup.get(sectionId) ?? []
            const sectionName = isDefault ? t.groups.defaultName : group!.name
            const collapsed = isDefault
              ? defaultGroupCollapsed
              : Boolean(group!.collapsed)

            return (
              <OkxGroupSection
                key={sectionId}
                groupId={sectionId}
                name={sectionName}
                instIds={sectionInstIds}
                collapsed={collapsed}
                compact={compact}
                canMoveUp={index > 0}
                canMoveDown={index < visibleSectionIds.length - 1}
                isDraggingFromOtherGroup={
                  activeDragId !== null && activeDragGroupId !== sectionId
                }
                onToggleCollapse={() => toggleGroupCollapsed(sectionId)}
                onAddTicker={() => setAddTargetGroupId(sectionId)}
                onRename={group ? () => setRenamingGroup(group) : undefined}
                onMove={(direction) => moveGroup(sectionId, direction)}
                onDelete={group ? () => deleteGroup(group.id) : undefined}
              >
                {sectionInstIds.map((instId) => (
                  <OkxTickerGridItem
                    key={instId}
                    instId={instId}
                    sortIndex={sortIndexByInstId.get(instId) ?? 0}
                    draggable
                  />
                ))}
              </OkxGroupSection>
            )
          })}

          <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
            <ButtonBase
              onClick={() => setAddTargetGroupId(DEFAULT_GROUP_ID)}
              sx={(theme) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: '12px',
                fontSize: 13,
                fontWeight: 600,
                color: theme.vars.palette.text.secondary,
                border: `1px dashed ${theme.vars.palette.surface.border}`,
                transition: 'color 0.2s ease-out, border-color 0.2s ease-out',
                '&:hover': {
                  color: theme.vars.palette.text.primary,
                  borderColor: theme.vars.palette.surface.marker,
                },
              })}
            >
              <AddIcon sx={{ fontSize: 18 }} />
              {t.addTicker.action}
            </ButtonBase>

            <ButtonBase
              onClick={() => setNewGroupOpen(true)}
              sx={(theme) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: '12px',
                fontSize: 13,
                fontWeight: 600,
                color: theme.vars.palette.text.secondary,
                border: `1px dashed ${theme.vars.palette.surface.border}`,
                transition: 'color 0.2s ease-out, border-color 0.2s ease-out',
                '&:hover': {
                  color: theme.vars.palette.text.primary,
                  borderColor: theme.vars.palette.surface.marker,
                },
              })}
            >
              <CreateNewFolderOutlinedIcon sx={{ fontSize: 17 }} />
              {t.groups.newGroup}
            </ButtonBase>
          </Stack>
        </Stack>

        <DragOverlay dropAnimation={null}>
          {activeDragId ? <DragCardPreview instId={activeDragId} /> : null}
        </DragOverlay>
      </DndContext>

      <AddTickerDialog
        open={addTargetGroupId !== null}
        defaultGroupId={addTargetGroupId ?? DEFAULT_GROUP_ID}
        onClose={() => setAddTargetGroupId(null)}
      />

      <OkxGroupDialog
        open={newGroupOpen}
        title={t.groups.newGroup}
        submitLabel={t.common.add}
        onClose={() => setNewGroupOpen(false)}
        onSubmit={addGroup}
      />

      <OkxGroupDialog
        open={renamingGroup !== null}
        title={t.groups.renameGroup}
        initialName={renamingGroup?.name ?? ''}
        submitLabel={t.groups.save}
        onClose={() => setRenamingGroup(null)}
        onSubmit={(name) => {
          if (renamingGroup) renameGroup(renamingGroup.id, name)
        }}
      />
    </>
  )
})

function OkxDetailDialog({
  instId,
  onClose,
}: {
  instId: string
  onClose: () => void
}) {
  const { signals } = useOkxSignals(instId)
  return (
    <OkxTickerDetail instId={instId} open onClose={onClose} signals={signals} />
  )
}

/**
 * One dialog for the whole board, mounted only while a symbol is open. Driven
 * by `useOkxDetailStore` so a card's chart button, an alert in the bell or
 * tape, and a desktop notification all land on the same dialog.
 */
function OkxDetailHost() {
  const instId = useOkxDetailStore((state) => state.instId)
  if (!instId) return null
  return (
    <OkxDetailDialog key={instId} instId={instId} onClose={closeOkxDetail} />
  )
}

export default function OkxPerpetual() {
  return (
    <Box>
      <OkxDataSync />
      <OkxMarketToolbar />
      <OkxTickerGrid />
      <OkxDetailHost />
    </Box>
  )
}
