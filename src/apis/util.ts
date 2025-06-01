export const proxyGet = async (url: string) => {
  const res = await fetch(`https://verio-api.vercel.app/api/proxy?${url}`)
  const data = await res.json()
  if (data.code === '0') {
    return data.data
  }
  return data
}
