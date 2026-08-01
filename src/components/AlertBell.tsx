import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { useCallback, useMemo, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'

import { useAlertStore } from '../store/useAlertStore'
import {
  beep,
  notificationPermission,
  requestNotificationPermission,
} from '../utils/alarm'
import { formatDeviation } from '../utils/signals'
import { numericFont } from '../fonts'

export default function AlertBell() {
  const alerts = useAlertStore((state) => state.alerts)
  const seenAt = useAlertStore((state) => state.seenAt)
  const markSeen = useAlertStore((state) => state.markSeen)
  const clear = useAlertStore((state) => state.clear)
  const notificationsEnabled = useAlertStore(
    (state) => state.notificationsEnabled,
  )
  const setNotificationsEnabled = useAlertStore(
    (state) => state.setNotificationsEnabled,
  )
  const soundEnabled = useAlertStore((state) => state.soundEnabled)
  const setSoundEnabled = useAlertStore((state) => state.setSoundEnabled)

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [permission, setPermission] = useState(notificationPermission)

  const unseen = useMemo(
    () => alerts.filter((alert) => alert.at > seenAt).length,
    [alerts, seenAt],
  )

  const open = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
      markSeen()
    },
    [markSeen],
  )

  // The browser only accepts the permission request from inside a gesture, so
  // it has to happen here rather than the first time an alert wants to fire.
  const toggleNotifications = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        setNotificationsEnabled(false)
        return
      }
      const result = await requestNotificationPermission()
      setPermission(notificationPermission)
      setNotificationsEnabled(result === 'granted')
    },
    [setNotificationsEnabled],
  )

  // Turning it on plays it once: an alert channel you cannot hear until the
  // thing you are waiting for happens is one you have no reason to trust.
  const toggleSound = useCallback(
    (enabled: boolean) => {
      setSoundEnabled(enabled)
      if (enabled) beep()
    },
    [setSoundEnabled],
  )

  const denied = permission === 'denied'
  const unsupported = permission === 'unsupported'

  return (
    <>
      <Tooltip title="Alerts" arrow>
        <IconButton
          size="small"
          aria-label={unseen ? `Alerts, ${unseen} new` : 'Alerts'}
          onClick={open}
          sx={{ color: 'text.secondary' }}
        >
          <Badge
            variant="dot"
            invisible={!unseen}
            sx={{
              '& .MuiBadge-dot': {
                backgroundColor: 'signal.main',
                minWidth: 7,
                height: 7,
              },
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 1,
              width: 320,
              borderRadius: '12px',
              border: `1px solid ${theme.vars.palette.surface.border}`,
              backgroundImage: 'none',
              boxShadow: theme.vars.palette.surface.shadow,
            }),
          },
        }}
      >
        <Stack sx={{ px: 2, py: 1.5 }} gap={0.5}>
          <Typography fontSize={13} color="text.secondary">
            {/* Says what the list is a list of, so an empty one reads as
                nothing having happened rather than as nothing working. */}
            When a symbol's long/short ratio and funding rate both leave their
            usual range at once.
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography fontSize={14}>Desktop notifications</Typography>
            <Switch
              size="small"
              checked={notificationsEnabled}
              disabled={denied || unsupported}
              onChange={(_, checked) => void toggleNotifications(checked)}
            />
          </Stack>
          {(denied || unsupported) && (
            <Typography fontSize={12} color="text.secondary">
              {denied
                ? 'Blocked for this site in your browser settings.'
                : 'This browser does not support notifications.'}
            </Typography>
          )}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography fontSize={14}>Sound</Typography>
            <Switch
              size="small"
              checked={soundEnabled}
              onChange={(_, checked) => toggleSound(checked)}
            />
          </Stack>
          <Typography fontSize={12} color="text.secondary">
            Both stay quiet while this window is the one in front.
          </Typography>
        </Stack>

        <Divider />

        {alerts.length === 0 ? (
          <Typography
            fontSize={13}
            color="text.secondary"
            sx={{ px: 2, py: 2.5, textAlign: 'center' }}
          >
            Nothing has fired yet
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <Stack key={alert.id} sx={{ px: 2, py: 1.25 }} gap={0.25}>
                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Typography fontSize={14} fontWeight={600}>
                    {alert.instId.split('-')[0]}
                  </Typography>
                  <Typography
                    fontSize={12}
                    color="text.secondary"
                    sx={numericFont}
                  >
                    {formatDistanceToNowStrict(alert.at, { addSuffix: true })}
                  </Typography>
                </Stack>
                <Typography
                  fontSize={12}
                  color="text.secondary"
                  sx={numericFont}
                >
                  L/S {formatDeviation(alert.ratioDeviation)} · funding{' '}
                  {formatDeviation(alert.fundingDeviation)}
                </Typography>
              </Stack>
            ))}
          </Box>
        )}

        {alerts.length > 0 && (
          <>
            <Divider />
            <Stack direction="row" justifyContent="end" sx={{ px: 1, py: 0.5 }}>
              <Button
                size="small"
                onClick={clear}
                sx={{ color: 'text.secondary', fontSize: 13 }}
              >
                Clear
              </Button>
            </Stack>
          </>
        )}
      </Popover>
    </>
  )
}
