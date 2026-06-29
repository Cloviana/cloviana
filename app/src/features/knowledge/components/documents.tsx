'use client';

import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteDocument } from '@/features/knowledge/api/delete-document';
import { useGetDocuments } from '@/features/knowledge/api/get-documents';
import { useUpdateDocument } from '@/features/knowledge/api/update-document';
import { AddKnowledgeSheet } from '@/features/knowledge/components/add-knowledge-sheet';
import { DocumentsToolbar } from '@/features/knowledge/components/documents-toolbar';
import type { DocumentTag } from '@/types/api';

const EXTENSION_ICONS: Record<string, string> = {
  pdf: '/icons/PDF_file_icon.svg',
  docx: '/icons/docx_icon.svg',
};

const DEFAULT_ICON = '/icons/Google_Docs_Logo.svg';

function DocumentIcon({ extension }: { extension: string }) {
  const src = EXTENSION_ICONS[extension.toLowerCase()] ?? DEFAULT_ICON;
  return (
    <Image
      src={src}
      width={16}
      height={16}
      alt={extension}
      className="size-4 shrink-0 object-contain"
    />
  );
}

interface DocumentsProps {
  businessId: string;
}

export function Documents({ businessId }: DocumentsProps) {
  const { data: documents = [] } = useGetDocuments(businessId);
  const { mutate: deleteDocument } = useDeleteDocument();
  const { mutate: updateDocument } = useUpdateDocument();
  const [sheetOpen, setSheetOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const tag = searchParams.get('tag') ?? 'all';

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesTag = tag === 'all' || doc.tag === tag;
    return matchesSearch && matchesTag;
  });

  return (
    <>
      <AddKnowledgeSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      {documents.length === 0 ? (
        <Empty className="border-0 bg-transparent p-0 md:p-0">
          <EmptyMedia>
            <Image
              src="/images/databases.svg"
              width={96}
              height={144}
              alt=""
              aria-hidden="true"
              priority
              className="h-auto w-auto object-contain"
            />
          </EmptyMedia>
          <EmptyHeader className="gap-2">
            <EmptyTitle>No knowledge sources yet</EmptyTitle>
            <EmptyDescription className="max-w-xl">
              Add business and domain context so the agent understands your
              company, customers, and category
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="size-4" />
              Add knowledge
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="w-full space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-foreground text-base font-semibold">
                Knowledge sources
              </h2>
              <p className="text-foreground-light text-sm">
                Business and domain context used by the agent to understand your
                company and category.
              </p>
            </div>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="size-4" />
              Add knowledge
            </Button>
          </div>
          <DocumentsToolbar
            search={search}
            onSearchChange={(v) => setParam('search', v)}
            tag={tag}
            onTagChange={(v) => setParam('tag', v)}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DocumentIcon extension={doc.extension} />
                      <span className="font-medium">
                        {doc.name}.{doc.extension}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted" className="capitalize">
                      {doc.tag}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-light">
                    {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Tag</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent
                            sideOffset={8}
                            className="w-36"
                          >
                            {(['business', 'domain'] as DocumentTag[]).map(
                              (option) => (
                                <DropdownMenuItem
                                  key={option}
                                  data-active={doc.tag === option}
                                  className="capitalize"
                                  onClick={() =>
                                    updateDocument({
                                      businessId,
                                      documentId: doc.id,
                                      tag: option,
                                    })
                                  }
                                >
                                  {option}
                                </DropdownMenuItem>
                              ),
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            deleteDocument({ businessId, documentId: doc.id })
                          }
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
