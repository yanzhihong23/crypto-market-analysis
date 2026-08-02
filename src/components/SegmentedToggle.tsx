import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

/**
 * A persistent single-choice control. These settings used to live inside a
 * collapsed floating menu, which meant the current sort and open time were
 * invisible until you opened it.
 */
export default function SegmentedToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <Stack
      // The label moves above the track on a phone. Beside a five-segment
      // group there was nothing left for it, so it shrank until "Sort by"
      // broke across two lines and the last segment still ran off-screen.
      direction={{ xs: 'column', sm: 'row' }}
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1,
        // Its own row on a phone, so the track's width is the row's rather
        // than the group's natural size.
        width: { xs: '100%', sm: 'auto' },
        minWidth: 0,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: 13,
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        aria-label={label}
        onChange={(_, next: T | null) => {
          // Null means the active button was clicked again; keep the selection.
          if (next !== null) onChange(next)
        }}
        sx={{
          '& .MuiToggleButton-root': {
            // Full width and split evenly on a phone, so the track ends where
            // the cards below it do rather than past the edge of the screen.
            // Segments stay content-width from `sm` up, where they fit.
            flex: { xs: 1, sm: 'none' },
            // Five even segments across a 360px phone leave about 62px each,
            // and "Gainers" at the selected weight wants 63 of them. The
            // narrower padding and type buy back the difference.
            px: { xs: 0.75, sm: 1.5 },
            fontSize: { xs: 12, sm: 13 },
            whiteSpace: 'nowrap',
          },
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
