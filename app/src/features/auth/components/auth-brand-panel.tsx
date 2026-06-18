const proofItems = [
  'Buyer prompts',
  'Competitor mentions',
  'Trusted sources',
  'AI share of voice',
] as const;

export function AuthBrandPanel() {
  return (
    <aside className="bg-surface border-border hidden min-h-screen border-l px-12 py-16 lg:flex lg:flex-col lg:justify-between">
      <div>
        <p className="text-foreground-lighter text-xs font-semibold tracking-[0.24em] uppercase">
          Cloviana
        </p>

        <div className="mt-14 max-w-xl">
          <p className="font-gambarino text-[34px] leading-[1.12]">
            Be the answer every B2B buyer gets.
          </p>
          <p className="text-foreground-light mt-4 max-w-md text-sm leading-6">
            Cloviana continuously optimizes your AI search presence across
            ChatGPT, Perplexity, Gemini, and beyond.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        <blockquote className="font-gambarino max-w-lg text-[22px] leading-8 text-slate-950">
          &quot;When buyers ask AI what to buy, every skipped mention is a lost
          deal before sales ever sees it.&quot;
        </blockquote>

        <div>
          <p className="text-foreground-lighter mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
            Workspace prepared around
          </p>
          <div className="border-border grid grid-cols-2 border text-xs text-slate-600">
            {proofItems.map((item) => (
              <div key={item} className="border-border border bg-white/40 p-4">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
