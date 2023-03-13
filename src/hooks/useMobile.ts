import { useEffect, useState } from 'react'

export default function useMobile() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const onResize = () => {
      setMobile(/mobile/i.test(navigator.userAgent))
    }

    onResize()

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return mobile
}
