const LANGUAGES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  // Monaco has no standalone JSON grammar; its JSON support is a language server.
  json: 'javascript',
  css: 'css',
  scss: 'scss',
  html: 'html',
  md: 'markdown',
  mdx: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
};

export function languageForPath(path: string) {
  return LANGUAGES[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'plaintext';
}
