import path from 'path';

const buildEslintCommand = (filenames) => {
  const files = filenames
    .filter((f) => f.includes('/src/'))
    .map((f) => `'${path.relative(process.cwd(), f).replaceAll("'", "'\\''")}'`)
    .join(' ');

  return files ? `eslint --fix ${files}` : 'echo "no src files"';
};

const config = {
  '*.{ts,tsx}': [buildEslintCommand, "bash -c 'pnpm check-types'"],
};

export default config;
