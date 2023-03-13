import { Box, Fab } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import SymbolOverview from '../components/SymbolOverview'
import useMobile from '../hooks/useMobile'

function Home() {
  const mobile = useMobile()
  const [overviews, setOverviews] = useState([uuid()])
  const onRemove = (id: string) => {
    const arr = [...overviews]
    arr.splice(
      arr.findIndex((i) => i === id),
      1,
    )

    setOverviews(arr)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '48px',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {overviews.map((i) => (
        <SymbolOverview key={i} mobile={mobile} onRemove={() => onRemove(i)} />
      ))}

      {!mobile && overviews.length < 4 ? (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 50, right: 50 }}
          onClick={() => setOverviews([...overviews, uuid()])}
        >
          <AddIcon />
        </Fab>
      ) : null}
    </Box>
  )
}

export default Home
