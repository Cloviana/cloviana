import path from 'path';

const buildEslintCommand = (filenames) => {
  const files = filenames
    .filter((f) => f.includes('/src/'))
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ');

  return files ? `next lint --fix --file ${files}` : 'echo "no src files"';
};

const config = {
  '*.{ts,tsx}': [buildEslintCommand, "bash -c 'pnpm check-types'"],
};

export default config;
