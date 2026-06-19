'use client';

import {
  Search,
  Link2,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { Page, PageContent, PageHeader } from '@/components/ui/page';
import { useMonitoringUrls } from '@/features/monitoring/api/get-monitoring-urls';

export default function UrlsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: urls, isPending, isError } = useMonitoringUrls(businessId);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (isPending) return <LoadingFallback />;
  if (isError || !urls) {
    return (
      <Page>
        <PageHeader title="URLs" description="URLs data could not be loaded." />
      </Page>
    );
  }

  const filteredUrls = urls.filter(
    (item) =>
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title &&
        item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.domain.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <Page className="bg-white py-6">
      <PageHeader
        title="Cited URLs"
        description="The specific web pages and links referenced by AI engines to source mentions and citations."
      />
      <PageContent className="space-y-6">
        {/* Filters/Search */}
        <div className="border-y border-slate-200 py-4">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, domain, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-10 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* URLs Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filteredUrls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Source Page</th>
                    <th className="px-6 py-4 font-semibold">Domain</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Citation Count
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUrls.map((item) => (
                    <tr
                      key={item.url}
                      className="group transition-colors hover:bg-slate-50"
                    >
                      <td className="max-w-xl px-6 py-4">
                        <div className="flex items-start gap-3">
                          <Link2 className="mt-1 size-4 shrink-0 text-slate-400" />
                          <div className="min-w-0">
                            <span className="line-clamp-1 font-semibold text-slate-800">
                              {item.title || 'Untitled Page'}
                            </span>
                            <span className="mt-0.5 line-clamp-1 text-xs break-all text-slate-400">
                              {item.url}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                            className="size-4 shrink-0 rounded-sm bg-slate-50"
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {item.domain}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap text-slate-900">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 text-right text-xs whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopy(item.url)}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Copy link"
                          >
                            {copiedUrl === item.url ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Open link"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <AlertCircle className="mb-3 size-8 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800">
                No links found
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Try adjusting your search queries or domains filters.
              </p>
            </div>
          )}
        </div>
      </PageContent>
    </Page>
  );
}
