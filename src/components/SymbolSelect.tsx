import { Autocomplete, TextField, FormControl } from '@mui/material'
import { useState } from 'react'

import { useBinanceSymbols } from '../hooks/useSymbols'
import { useMessages } from '../i18n'

export default function SymbolSelect(props: {
  value: string
  onChange: (value: string) => void
}) {
  const symbols = useBinanceSymbols()
  const t = useMessages()
  const [symbol, setSymbol] = useState<string>(props.value)
  const handleChange = (_: unknown, value: string | null) => {
    if (!value) return
    setSymbol(String(value))
    props.onChange(String(value))
  }

  return (
    <FormControl fullWidth>
      <Autocomplete
        options={symbols}
        value={symbol}
        onChange={handleChange}
        clearText={t.common.clear}
        openText={t.common.open}
        closeText={t.common.close}
        renderInput={(params) => (
          <TextField {...params} label={t.overview.symbol} />
        )}
      />
    </FormControl>
  )
}
