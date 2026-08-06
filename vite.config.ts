import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import { HttpsProxyAgent } from 'https-proxy-agent'

/**
 * Where to send the dev proxy's own outbound requests, if anywhere.
 *
 * On a network that cannot reach the exchange directly this is not optional,
 * and the symptom is confusing enough to be worth writing down: the page's own
 * fetches keep working while the one path that goes through this server fails.
 * The browser honours the system proxy and Node does not — `http-proxy-3`
 * opens an ordinary socket to `www.okx.com` and never looks at `HTTPS_PROXY`
 * — so candles fetched straight from the page arrive and every `rubik/`
 * statistic behind the rewrite comes back 502. Nothing in the app is wrong,
 * and no amount of reading it says so.
 *
 * `loadEnv` with an empty prefix covers the shell's own variables as well as
 * `.env`, so exporting `HTTPS_PROXY` works and so does writing `DEV_PROXY`
 * down once for a machine where the proxy is not the shell's default — a
 * VPN for another project, say, holding the tunnel that would otherwise carry
 * this. `DEV_PROXY` wins where both are set. None of this reaches the client
 * bundle: that is `envPrefix`'s business and it still only lets `VITE_`
 * through.
 *
 * Unset on a machine that needs no proxy, and then this is exactly what it was
 * before.
 */
const proxyUrlOf = (env: Record<string, string>) =>
  env.DEV_PROXY ||
  env.dev_proxy ||
  env.HTTPS_PROXY ||
  env.https_proxy ||
  env.ALL_PROXY ||
  env.all_proxy ||
  env.HTTP_PROXY ||
  env.http_proxy ||
  ''

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const proxyUrl = proxyUrlOf(loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), svgr()],
    server: {
      // The dev-side half of the `/okx` rewrite that `vercel.json` sets up for
      // production. Only rubik/ needs it; the rest of the API is fetched direct.
      proxy: {
        '/okx': {
          target: 'https://www.okx.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/okx/, '/api/v5'),
          agent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
        },
      },
    },
  }
})
