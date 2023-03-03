export const proxyGet = async (url: string) => {
  const res = await fetch(`https://timely.fans:81/proxy?${url}`)
  const data = await res.json()
  return data
}
