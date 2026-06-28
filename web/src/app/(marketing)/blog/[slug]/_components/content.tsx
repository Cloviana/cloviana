import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { getHeadingId } from './table-of-contents';

type ContentProps = {
  content: string;
};

export function Content({ content }: ContentProps) {
  const seenHeadings = new Map<string, number>();

  const getUniqueHeadingId = (children: React.ReactNode) => {
    const baseId = getHeadingId(String(children));
    const count = seenHeadings.get(baseId) ?? 0;

    seenHeadings.set(baseId, count + 1);

    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  };

  const components: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    h1: ({ children }) => (
      <h1
        id={getUniqueHeadingId(children)}
        className="font-gambarino scroll-mt-28 font-medium"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={getUniqueHeadingId(children)}
        className="font-gambarino scroll-mt-28 font-medium"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={getUniqueHeadingId(children)}
        className="font-gambarino scroll-mt-28 font-medium"
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        id={getUniqueHeadingId(children)}
        className="font-gambarino scroll-mt-28 font-medium"
      >
        {children}
      </h4>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noreferrer' : undefined}
        className="font-normal underline underline-offset-2 hover:decoration-dashed"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="prose prose-neutral max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
