export const proxyGet = async (url: string) => {
  const res = await fetch(`https://openask.me/proxy?${url}`)
  const data = await res.json()
  return data
}
