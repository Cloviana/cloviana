'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUploadDocuments } from '@/features/knowledge/api/upload-documents';
import {
  ContextType,
  KnowledgeSourceDropzone,
} from '@/features/knowledge/components/knowledge-source-dropzone';

interface AddKnowledgeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddKnowledgeSheet({
  open,
  onOpenChange,
}: AddKnowledgeSheetProps) {
  const { businessId } = useParams<{ businessId: string }>();
  const [files, setFiles] = useState<File[]>([]);
  const [contextTypes, setContextTypes] = useState<Record<string, ContextType>>(
    {},
  );

  const { mutate: uploadDocuments, isPending } = useUploadDocuments();

  const canUpload = files.length > 0 && !isPending;

  function handleFilesChange(
    nextFiles: File[],
    nextContextTypes: Record<string, ContextType>,
  ) {
    setFiles(nextFiles);
    setContextTypes(nextContextTypes);
  }

  function handleUpload() {
    uploadDocuments(
      {
        businessId,
        files: files.map((file) => ({
          file,
          tag: contextTypes[file.name] ?? 'business',
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFiles([]);
          setContextTypes({});
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-125 flex-col"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle className="text-base font-normal">
            Add knowledge source
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <KnowledgeSourceDropzone
            files={files}
            contextTypes={contextTypes}
            onFilesChange={handleFilesChange}
          />
        </div>

        <SheetFooter className="border-t px-4 py-3">
          <div className="flex w-full items-center justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </SheetClose>
            <Button
              size="sm"
              disabled={!canUpload}
              loading={isPending}
              onClick={handleUpload}
            >
              Upload
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
