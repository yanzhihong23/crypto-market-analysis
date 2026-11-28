import {
  Badge,
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  Popover,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { formatDistanceToNowStrict } from 'date-fns'

import { useAlertStore } from '../store/useAlertStore'
import { openOkxDetail } from '../store/useOkxDetailStore'
import {
  beep,
  notificationPermission,
  requestNotificationPermission,
} from '../utils/alarm'
import { summarizeAlertOutcomes } from '../utils/alertEngine'
import { formatNumber } from '../utils'
import { numericFont } from '../fonts'
import { useDateLocale, useMessages } from '../i18n'

const formatSignedPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

/**
 * One channel and its switch. There are four of them now, and they only read as
 * a list of things that can be turned on for as long as they are one shape.
 */
function ChannelSwitch({
  label,
  checked,
  disabled,
  action,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  action?: React.ReactNode
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
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <Typography
          sx={{
            fontSize: 14,
          }}
        >
          {label}
        </Typography>
        {action}
      </Stack>
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
  const priceRules = useAlertStore((state) => state.priceRules)
  const removePriceRule = useAlertStore((state) => state.removePriceRule)
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
  const highPriorityOnly = useAlertStore((state) => state.highPriorityOnly)
  const setHighPriorityOnly = useAlertStore(
    (state) => state.setHighPriorityOnly,
  )
  const t = useMessages()
  const dateLocale = useDateLocale()
  const location = useLocation()
  const navigate = useNavigate()

  const outcomeSummary = useMemo(() => summarizeAlertOutcomes(alerts), [alerts])

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [permission, setPermission] = useState(notificationPermission)

  const openAlertDetail = useCallback(
    (instId: string) => {
      setAnchorEl(null)
      openOkxDetail(instId)
      if (location.pathname !== '/') void navigate('/')
    },
    [location.pathname, navigate],
  )

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
                action={
                  soundEnabled ? (
                    <Stack
                      direction="row"
                      sx={{ alignItems: 'center', gap: 0.5, ml: 0.5 }}
                    >
                      <ButtonBase
                        onClick={() => beep('signal')}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.25,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: '6px',
                          fontSize: 11,
                          color: 'text.secondary',
                          backgroundColor: 'surface.subtle',
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        <VolumeUpRoundedIcon sx={{ fontSize: 13 }} />
                        {t.alerts.testSignalSound}
                      </ButtonBase>
                      <ButtonBase
                        onClick={() => beep('price')}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.25,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: '6px',
                          fontSize: 11,
                          color: 'signal.main',
                          backgroundColor: 'signal.surface',
                          '&:hover': { opacity: 0.85 },
                        }}
                      >
                        <VolumeUpRoundedIcon sx={{ fontSize: 13 }} />
                        {t.alerts.testPriceSound}
                      </ButtonBase>
                    </Stack>
                  ) : undefined
                }
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

              <ChannelSwitch
                label={t.alerts.highPriorityOnly}
                checked={highPriorityOnly}
                onChange={setHighPriorityOnly}
              />
              {highPriorityOnly && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary',
                  }}
                >
                  {t.alerts.highPriorityOnlyHint}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        {priceRules.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'text.secondary',
                  mb: 0.75,
                }}
              >
                {t.priceAlert.activeCount(priceRules.length)}
              </Typography>
              <Stack sx={{ gap: 0.5, maxHeight: 144, overflowY: 'auto' }}>
                {priceRules.map((rule) => {
                  const symbol = rule.instId.split('-')[0]
                  return (
                    <Stack
                      key={rule.id}
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: 'surface.subtle' },
                      }}
                    >
                      <ButtonBase
                        aria-label={t.alerts.openDetail(symbol)}
                        onClick={() => openAlertDetail(rule.instId)}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'flex-start',
                          gap: 0.75,
                          px: 1,
                          py: 0.5,
                          borderRadius: '8px',
                          textAlign: 'left',
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                        >
                          {symbol}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'signal.main',
                            flexShrink: 0,
                            ...numericFont,
                          }}
                        >
                          {t.priceAlert.ruleShort(
                            rule.direction === 'above',
                            formatNumber(rule.price, 8),
                          )}
                        </Typography>
                        {rule.note && (
                          <Typography
                            component="span"
                            noWrap
                            sx={{ fontSize: 11, color: 'text.secondary' }}
                          >
                            {rule.note}
                          </Typography>
                        )}
                      </ButtonBase>
                      <IconButton
                        size="small"
                        aria-label={t.priceAlert.delete}
                        onClick={() => removePriceRule(rule.id)}
                        sx={{ color: 'text.secondary', p: 0.5 }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  )
                })}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

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
            {outcomeSummary && (
              <Box
                sx={{
                  px: 2,
                  py: 0.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'surface.subtle',
                }}
              >
                <Typography
                  sx={[
                    {
                      fontSize: 11,
                      color: 'text.secondary',
                    },
                    ...(Array.isArray(numericFont)
                      ? numericFont
                      : [numericFont]),
                  ]}
                >
                  {t.alerts.outcomeSummary(
                    outcomeSummary.count,
                    outcomeSummary.hitRate,
                    formatSignedPercent(outcomeSummary.avgDirectionalMove),
                  )}
                </Typography>
              </Box>
            )}
            {alerts.map((alert) => {
              const symbol = alert.instId.split('-')[0]
              const outcomeParts = [
                alert.outcomes?.m5 !== undefined
                  ? `5m ${formatSignedPercent(alert.outcomes.m5)}`
                  : null,
                alert.outcomes?.m15 !== undefined
                  ? `15m ${formatSignedPercent(alert.outcomes.m15)}`
                  : null,
                alert.outcomes?.h1 !== undefined
                  ? `1h ${formatSignedPercent(alert.outcomes.h1)}`
                  : null,
              ].filter((part): part is string => part !== null)
              return (
                <ButtonBase
                  key={alert.id}
                  aria-label={t.alerts.openDetail(symbol)}
                  onClick={() => openAlertDetail(alert.instId)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    width: '100%',
                    textAlign: 'left',
                    gap: 0.25,
                    px: 2,
                    py: 1.25,
                    transition: 'background-color 150ms ease',
                    '&:hover': {
                      backgroundColor: 'surface.subtle',
                    },
                    '&:hover .alert-chevron': {
                      opacity: 1,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ alignItems: 'center', gap: 0.75, minWidth: 0 }}
                    >
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {symbol}
                      </Typography>
                      {alert.tier === 'high' && (
                        <Box
                          component="span"
                          sx={{
                            px: 0.625,
                            py: 0.125,
                            borderRadius: '4px',
                            fontSize: 10,
                            fontWeight: 600,
                            lineHeight: 1.3,
                            color: 'signal.main',
                            backgroundColor: 'signal.surface',
                          }}
                        >
                          {t.alerts.highPriorityTag}
                        </Box>
                      )}
                    </Stack>
                    <Stack
                      direction="row"
                      sx={{ alignItems: 'center', gap: 0.25, flexShrink: 0 }}
                    >
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
                      <ChevronRightRoundedIcon
                        className="alert-chevron"
                        sx={{
                          fontSize: 15,
                          color: 'text.secondary',
                          opacity: 0.45,
                          transition: 'opacity 150ms ease',
                        }}
                      />
                    </Stack>
                  </Stack>
                  {/* The headline says what kind of event it was and the
                      readings say what it was made of, which is the difference
                      between an entry you can act on and a row of sigmas. */}
                  <Typography sx={{ fontSize: 13 }}>
                    {alert.headline}
                  </Typography>
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
                  {/* The backdrop, under the readings and set in from them:
                      what happened is above, and what it happened to is here.
                      All of it, unlike the tape — this is the list you open
                      when you have decided to ask, and it has the room. */}
                  {(alert.context ?? []).map((reading) => (
                    <Typography
                      key={reading.kind}
                      sx={[
                        {
                          fontSize: 12,
                          color: 'text.secondary',
                          opacity: 0.75,
                          pl: 1,
                          borderLeft: '2px solid',
                          borderColor: 'surface.marker',
                        },
                        ...(Array.isArray(numericFont)
                          ? numericFont
                          : [numericFont]),
                      ]}
                    >
                      {reading.detail}
                    </Typography>
                  ))}
                  {outcomeParts.length > 0 && (
                    <Typography
                      sx={[
                        {
                          fontSize: 11,
                          color: 'text.secondary',
                          opacity: 0.85,
                          mt: 0.25,
                        },
                        ...(Array.isArray(numericFont)
                          ? numericFont
                          : [numericFont]),
                      ]}
                    >
                      {t.alerts.outcomeLine(outcomeParts)}
                    </Typography>
                  )}
                </ButtonBase>
              )
            })}
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
