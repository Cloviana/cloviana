import path from 'node:path'

const onlySrc = files =>
  files
    .filter(f => f.includes(`${path.sep}src${path.sep}`))
    .map(f => path.relative(process.cwd(), f))
    .join(' ')

const buildEslint = files => {
  const list = onlySrc(files)
  return list ? `eslint --fix --max-warnings=0 --no-warn-ignored ${list}` : 'echo "no src files"'
}

const buildPrettier = files => {
  const list = onlySrc(files)
  return list ? `prettier --write ${list}` : 'echo "no src files"'
}

export default {
  '*.{js,jsx,ts,tsx}': [buildEslint, buildPrettier],
  '*.{json,css,md,mdx}': files => `prettier --write ${files.join(' ')}`
}