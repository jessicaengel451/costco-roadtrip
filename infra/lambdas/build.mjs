import { build } from 'esbuild'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const handlers = ['get-visits', 'put-visits']

for (const name of handlers) {
  const dist = join(here, name, 'dist')
  rmSync(dist, { recursive: true, force: true })
  mkdirSync(dist, { recursive: true })

  await build({
    entryPoints: [join(here, name, 'index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: join(dist, 'index.mjs'),
    external: ['@aws-sdk/*'],
    banner: {
      // ESM Lambda needs this CJS interop shim for some bundled deps.
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
  })

  // Zip for Terraform.
  execSync(`cd "${dist}" && zip -q -r "../bundle.zip" index.mjs`)
  console.log(`built ${name}`)
}
