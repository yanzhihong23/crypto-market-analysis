import { FormControl, Autocomplete, TextField } from '@mui/material'
import { useState } from 'react'

import { useMessages } from '../i18n'

// Candle intervals, which are the exchange's own codes rather than words.
const periods = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d']

export default function PeriodSelect(props: {
  value: string
  onChange: (value: string) => void
}) {
  const [period, setPeriod] = useState(props.value)
  const t = useMessages()
  const handleChange = (_: unknown, value: string | null) => {
    if (!value) return
    setPeriod(String(value))
    props.onChange(String(value))
  }

  return (
    <FormControl fullWidth>
      <Autocomplete
        options={periods}
        value={period}
        onChange={handleChange}
        clearText={t.common.clear}
        openText={t.common.open}
        closeText={t.common.close}
        renderInput={(params) => (
          <TextField {...params} label={t.overview.period} />
        )}
      />
    </FormControl>
  )
}
