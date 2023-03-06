import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { useState } from 'react'

const periods = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d']

export default function PeriodSelect(props: {
  value: string
  onChange: (value: string) => void
}) {
  const [period, setPeriod] = useState(props.value)
  const handleChange = (event: SelectChangeEvent<string>) => {
    setPeriod(event.target.value)
    props.onChange(event.target.value)
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="period-label">Period</InputLabel>
      <Select
        labelId="period-label"
        id="period-select"
        value={period}
        label="Period"
        onChange={handleChange}
      >
        {periods.map((p) => (
          <MenuItem value={p} key={p}>
            {p}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
