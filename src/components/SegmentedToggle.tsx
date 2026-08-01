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
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1,
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
