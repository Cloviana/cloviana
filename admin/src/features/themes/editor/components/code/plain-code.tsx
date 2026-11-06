/** Shown until Monaco arrives, so reading code never waits on the editor's bundle. */
export function PlainCode({ content }: { content: string }) {
  return (
    <pre className="text-code text-text-default size-full overflow-auto p-3 pl-16">
      {content}
    </pre>
  );
}
