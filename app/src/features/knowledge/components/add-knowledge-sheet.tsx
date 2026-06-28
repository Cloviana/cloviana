'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ContextType,
  KnowledgeSourceDropzone,
} from '@/features/knowledge/components/knowledge-source-dropzone';

export function AddKnowledgeSheet() {
  const [files, setFiles] = useState<File[]>([]);
  const [contextTypes, setContextTypes] = useState<Record<string, ContextType>>(
    {},
  );

  const canUpload = files.length > 0;

  function handleFilesChange(
    nextFiles: File[],
    nextContextTypes: Record<string, ContextType>,
  ) {
    setFiles(nextFiles);
    setContextTypes(nextContextTypes);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Plus className="size-5" />
          Add knowledge
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-125 flex-col">
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
              <Button variant="outline" size={'sm'}>
                Cancel
              </Button>
            </SheetClose>
            <Button disabled={!canUpload} size={'sm'}>
              Upload
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
