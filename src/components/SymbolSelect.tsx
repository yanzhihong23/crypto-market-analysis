import { Autocomplete, TextField, FormControl } from '@mui/material'
import { useState } from 'react'
import { useBinanceSymbols } from '../hooks/useSymbols'

export default function SymbolSelect(props: {
  value: string
  onChange: (value: string) => void
}) {
  const symbols = useBinanceSymbols()
  const [symbol, setSymbol] = useState<string>(props.value)
  const handleChange = (event: unknown, value: string | null) => {
    setSymbol(String(value))
    props.onChange(String(value))
  }

  return (
    <FormControl fullWidth>
      {/* <InputLabel id="symbol-label">Symbol</InputLabel> */}
      <Autocomplete
        options={symbols}
        value={symbol}
        onChange={handleChange}
        renderInput={(params) => <TextField {...params} label="Symbol" />}
      />
    </FormControl>
  )
}
