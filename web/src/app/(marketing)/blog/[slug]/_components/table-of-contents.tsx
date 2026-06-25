export type TableOfContentsItem = {
  id: string;
  text: string;
  level: number;
};

const headingPattern = /^(#{2,4})\s+(.+)$/gm;

export function getHeadingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function getTableOfContents(content: string): TableOfContentsItem[] {
  const headings = Array.from(content.matchAll(headingPattern));
  const seen = new Map<string, number>();

  return headings.map((heading) => {
    const text = heading[2].trim();
    const baseId = getHeadingId(text);
    const count = seen.get(baseId) ?? 0;

    seen.set(baseId, count + 1);

    return {
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      text,
      level: heading[1].length,
    };
  });
}

type TableOfContentsProps = {
  items: TableOfContentsItem[];
};

export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block">
      <nav
        aria-label="Article contents"
        className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-8"
      >
        <h2 className="font-gambarino mb-3 text-lg font-medium">Contents</h2>
        <ol className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={
                item.level >= 4 ? 'pl-12' : item.level >= 3 ? 'pl-8' : undefined
              }
            >
              <a
                href={`#${item.id}`}
                className="text-foreground-light hover:text-foreground block text-sm leading-snug transition-colors hover:underline hover:underline-offset-4"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
