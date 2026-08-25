import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'

if (process.argv.includes('--help')) {
  console.log('Usage: node inspect-package.mjs [repository-root]')
  process.exit(0)
}

const root = resolve(process.argv[2] ?? process.cwd())
const packagePath = join(root, 'package.json')
const errors = []
const warnings = []

if (!existsSync(packagePath)) {
  console.error('Missing package.json in ' + root)
  process.exit(1)
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))

function collectStringTargets(value, label, targets) {
  if (typeof value === 'string') {
    if (value.startsWith('./')) targets.push({ label, target: value })
    return
  }

  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    collectStringTargets(nested, label + '.' + key, targets)
  }
}

const targets = []
for (const field of ['main', 'module', 'types']) {
  collectStringTargets(packageJson[field], field, targets)
}
collectStringTargets(packageJson.exports, 'exports', targets)

for (const { label, target } of targets) {
  const targetPath = resolve(root, target)
  if (!existsSync(targetPath)) errors.push(label + ' points to missing ' + target)
}

const distPath = join(root, 'dist')
const files = []

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) walk(entryPath)
    else if (entry.isFile()) files.push(entryPath)
  }
}

if (!existsSync(distPath)) {
  errors.push('dist directory is missing')
} else {
  walk(distPath)
}

const leakedDeclarations = files
  .filter((file) => /(?:\.spec|\.story)\.d\.ts$/.test(file))
  .map((file) => relative(root, file))

if (leakedDeclarations.length > 0) {
  errors.push(leakedDeclarations.length + ' story/spec declaration files leaked into dist')
}

for (const file of files.filter((candidate) => candidate.endsWith('.d.ts'))) {
  const content = readFileSync(file, 'utf8')
  if (content.includes('shared/components/ui/App')) {
    errors.push(relative(root, file) + ' references removed shared/components/ui/App paths')
  }
  if (content.includes('showcase/ShowcaseApp')) {
    errors.push(relative(root, file) + ' exposes the Showcase declaration')
  }
}

if (packageJson.private === true) warnings.push('package.json has private: true')
if (!existsSync(join(root, 'README.md'))) warnings.push('root README.md is missing')
if (!existsSync(join(root, 'LICENSE'))) warnings.push('root LICENSE is missing')
if (!Array.isArray(packageJson.files) || !packageJson.files.includes('dist')) {
  warnings.push('package.json files does not explicitly include dist')
}

console.log('Package: ' + (packageJson.name ?? basename(root)) + '@' + (packageJson.version ?? 'unknown'))
console.log('Export targets checked: ' + targets.length)
console.log('Files found in dist: ' + files.length)

for (const warning of warnings) console.warn('WARN: ' + warning)
for (const error of errors) console.error('ERROR: ' + error)

if (errors.length > 0) {
  console.error('Package inspection failed with ' + errors.length + ' error(s).')
  process.exitCode = 1
} else {
  console.log('Package inspection passed.')
}
