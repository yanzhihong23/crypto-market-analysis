import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

export default function useGridColumns() {
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))
  const upMd = useMediaQuery(theme.breakpoints.up('md'))
  const upLg = useMediaQuery(theme.breakpoints.up('lg'))
  const upXl = useMediaQuery(theme.breakpoints.up('xl'))
  const upXxl = useMediaQuery(theme.breakpoints.up('xxl'))

  if (upXxl) return 8
  if (upXl) return 6
  if (upLg) return 4
  if (upMd) return 3
  if (upSm) return 2
  return 1
}
