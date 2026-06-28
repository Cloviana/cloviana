'use client';

import { UploadCloud, X } from 'lucide-react';
import { type InputHTMLAttributes } from 'react';
import { useDropzone } from 'react-dropzone';

import { cn } from '@/utils/cn';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'text/markdown': ['.md', '.markdown'],
  'text/plain': ['.txt'],
};

export type ContextType = 'business' | 'domain';

interface KnowledgeSourceDropzoneProps {
  files: File[];
  contextTypes: Record<string, ContextType>;
  onFilesChange: (
    files: File[],
    contextTypes: Record<string, ContextType>,
  ) => void;
}

export function KnowledgeSourceDropzone({
  files,
  contextTypes,
  onFilesChange,
}: KnowledgeSourceDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: ACCEPTED_FILE_TYPES,
      maxFiles: 5,
      maxSize: 5 * 1024 * 1024,
      multiple: true,
      onDragEnter: () => undefined,
      onDragLeave: () => undefined,
      onDragOver: () => undefined,
      onDrop: (acceptedFiles) => {
        const merged = [
          ...files,
          ...acceptedFiles.filter((f) => !files.some((e) => e.name === f.name)),
        ].slice(0, 5);
        const mergedCtx = Object.fromEntries(
          merged.map((f) => [f.name, contextTypes[f.name] ?? 'business']),
        ) as Record<string, ContextType>;
        onFilesChange(merged, mergedCtx);
      },
    });
  const inputProps = getInputProps({}) as InputHTMLAttributes<HTMLInputElement>;

  function removeFile(name: string) {
    const next = files.filter((f) => f.name !== name);
    const nextCtx = { ...contextTypes };
    delete nextCtx[name];
    onFilesChange(next, nextCtx);
  }

  function setContextType(name: string, type: ContextType) {
    onFilesChange(files, { ...contextTypes, [name]: type });
  }

  return (
    <div className="space-y-6">
      <p className="text-foreground-light text-sm">
        Tag each file as business or domain context. Business context covers
        your company, ICP, and positioning. Domain context covers your category,
        competitors, and industry.
      </p>

      <div
        {...getRootProps({
          className: cn(
            'border-border flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border bg-muted/30 p-6 text-center transition-colors outline-none hover:bg-muted/80',
            isDragActive && 'border-secondary bg-secondary/10',
            isDragReject && 'border-destructive bg-destructive/5',
          ),
        })}
      >
        <input aria-label="Knowledge file" {...inputProps} />
        <UploadCloud className="text-foreground-light mb-3 size-5" />
        <span className="text-foreground text-sm font-medium">
          Drop files here or click to upload
        </span>
        <span className="text-foreground-light text-sm font-normal">
          PDF, DOCX, Markdown, or TXT. Up to 5 files, 5 MB each.
        </span>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center justify-between gap-3 py-1"
            >
              <div className="flex min-w-0 items-center">
                <span className="text-foreground min-w-0 truncate text-sm">
                  {f.name}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="bg-accent flex rounded-md p-0.5 text-xs">
                  {(['business', 'domain'] as ContextType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContextType(f.name, type)}
                      className={cn(
                        'rounded px-2 py-0.5 capitalize transition-colors',
                        contextTypes[f.name] === type
                          ? 'text-foreground bg-white shadow-sm'
                          : 'text-foreground-light hover:text-foreground',
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => removeFile(f.name)}
                  className="text-foreground-light hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
