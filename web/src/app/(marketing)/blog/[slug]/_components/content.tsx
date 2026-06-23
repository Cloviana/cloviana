import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ContentProps = {
  content: string;
};

const components: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ children }) => (
    <h1 className="font-gambarino font-medium">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-gambarino font-medium">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-gambarino font-medium">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-gambarino font-medium">{children}</h4>
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

export function Content({ content }: ContentProps) {
  return (
    <div className="prose prose-neutral max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
