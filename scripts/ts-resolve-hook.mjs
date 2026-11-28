import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

// Allows Node's built-in TypeScript runner (`node --test`) to resolve the
// extensionless relative imports used across `src/` by Vite/TS bundler mode.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL?.startsWith('file:') &&
      !/\.[a-z]+$/i.test(specifier)
    ) {
      const base = resolve(dirname(fileURLToPath(context.parentURL)), specifier)
      for (const candidate of [
        `${base}.ts`,
        `${base}.tsx`,
        resolve(base, 'index.ts'),
      ]) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true }
        }
      }
    }
    return nextResolve(specifier, context)
  },
})
