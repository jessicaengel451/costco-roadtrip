#!/usr/bin/env node
// If src/aws-config.json doesn't exist, copy the placeholder example so the
// build doesn't fail on a fresh clone. CI overwrites it from the
// AWS_CONFIG_JSON secret before building.
import { existsSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const target = join(here, '..', 'src', 'aws-config.json')
const example = join(here, '..', 'src', 'aws-config.example.json')

if (!existsSync(target)) {
  copyFileSync(example, target)
  console.log('aws-config.json missing — copied from example (placeholder values).')
}
