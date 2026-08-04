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
import { numericFont } from '../fonts'
import { useDateLocale, useMessages } from '../i18n'

/**
 * One channel and its switch. There are four of them now, and they only read as
 * a list of things that can be turned on for as long as they are one shape.
 */
function ChannelSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        sx={{
          fontSize: 14,
        }}
      >
        {label}
      </Typography>
      <Switch
        size="small"
        checked={checked}
        disabled={disabled}
        onChange={(_, next) => onChange(next)}
      />
    </Stack>
  )
}

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
  const tapeEnabled = useAlertStore((state) => state.tapeEnabled)
  const setTapeEnabled = useAlertStore((state) => state.setTapeEnabled)
  const soundEnabled = useAlertStore((state) => state.soundEnabled)
  const setSoundEnabled = useAlertStore((state) => state.setSoundEnabled)
  const quietWhenPresent = useAlertStore((state) => state.quietWhenPresent)
  const setQuietWhenPresent = useAlertStore(
    (state) => state.setQuietWhenPresent,
  )
  const t = useMessages()
  const dateLocale = useDateLocale()

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
      <Tooltip title={t.alerts.title} arrow>
        <IconButton
          size="small"
          aria-label={unseen ? t.alerts.titleUnseen(unseen) : t.alerts.title}
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
        <Stack
          sx={{
            gap: 1.5,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.secondary',
            }}
          >
            {/* Says what the list is a list of, so an empty one reads as
                nothing having happened rather than as nothing working. */}
            {t.alerts.what}
          </Typography>

          {/* The switches are their own group, spaced tighter than they are from
              the paragraph, so the block reads as prose followed by controls.
              Two groups within that: the strip on the page, and then the two
              channels that reach off it under the one condition they share. A
              single run of four would have put "only when I am away" directly
              beneath a channel it has nothing to do with. */}
          <Stack sx={{ gap: 1.5 }}>
            <ChannelSwitch
              label={t.alerts.tape}
              checked={tapeEnabled}
              onChange={setTapeEnabled}
            />

            <Stack sx={{ gap: 0.5 }}>
              <ChannelSwitch
                label={t.alerts.desktopNotifications}
                checked={notificationsEnabled}
                disabled={denied || unsupported}
                onChange={(checked) => void toggleNotifications(checked)}
              />
              {(denied || unsupported) && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary',
                  }}
                >
                  {denied ? t.alerts.blocked : t.alerts.unsupported}
                </Typography>
              )}

              <ChannelSwitch
                label={t.alerts.sound}
                checked={soundEnabled}
                onChange={toggleSound}
              />

              {/* A condition on the two above rather than a channel of its own,
                  so it sits under them and carries the note that used to state
                  the rule. */}
              <ChannelSwitch
                label={t.alerts.onlyWhenAway}
                checked={quietWhenPresent}
                onChange={setQuietWhenPresent}
              />
              {quietWhenPresent && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary',
                  }}
                >
                  {t.alerts.awayMeans}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        {alerts.length === 0 ? (
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              px: 2,
              py: 2.5,
              textAlign: 'center',
            }}
          >
            {t.alerts.empty}
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <Stack
                key={alert.id}
                sx={{
                  gap: 0.25,
                  px: 2,
                  py: 1.25,
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {alert.instId.split('-')[0]}
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
                    {formatDistanceToNowStrict(alert.at, {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </Typography>
                </Stack>
                {/* The headline says what kind of event it was and the readings
                    say what it was made of, which is the difference between an
                    entry you can act on and a row of sigmas. */}
                <Typography sx={{ fontSize: 13 }}>{alert.headline}</Typography>
                {alert.reasons.map((reason) => (
                  <Typography
                    key={reason.kind}
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
                    {reason.detail}
                  </Typography>
                ))}
              </Stack>
            ))}
          </Box>
        )}

        {alerts.length > 0 && (
          <>
            <Divider />
            <Stack
              direction="row"
              sx={{
                justifyContent: 'end',
                px: 1,
                py: 0.5,
              }}
            >
              <Button
                size="small"
                onClick={clear}
                sx={{ color: 'text.secondary', fontSize: 13 }}
              >
                {t.common.clear}
              </Button>
            </Stack>
          </>
        )}
      </Popover>
    </>
  )
}
