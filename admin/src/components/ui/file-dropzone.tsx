'use client';

import {
  useRef,
  useState,
  type DragEvent,
  type FocusEvent,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

export function useFileDrop(
  onFiles: (files: FileList) => void,
  disabled = false,
) {
  const [isOver, setIsOver] = useState(false);
  const dropProps = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (
        disabled ||
        !event.currentTarget.contains(event.target as Node) ||
        !Array.from(event.dataTransfer.types).includes('Files')
      )
        return;
      event.preventDefault();
      setIsOver(true);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.target as Node)) return;
      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        setIsOver(false);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      if (
        disabled ||
        !event.currentTarget.contains(event.target as Node) ||
        !Array.from(event.dataTransfer.types).includes('Files')
      )
        return;
      event.preventDefault();
      setIsOver(false);
      if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files);
    },
  };
  return { isOver, dropProps };
}

export type FileDropProps = ReturnType<typeof useFileDrop>['dropProps'];

type FileDropzoneProps = {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  invalid?: boolean;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFilesSelected: (files: FileList) => void;
  className?: string;
  children: (state: {
    openFileDialog: () => void;
    isOver: boolean;
  }) => ReactNode;
};

export function FileDropzone({
  accept,
  multiple,
  disabled,
  id,
  name,
  invalid,
  onBlur,
  onFilesSelected,
  className,
  children,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOver, dropProps } = useFileDrop(onFilesSelected, disabled);
  const openFileDialog = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      {...dropProps}
      className={cn(
        'bg-surface border-border-input border-line flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-dashed px-4 py-6 transition-colors',
        !disabled &&
          'hover:bg-surface-hovered hover:border-border-input-hovered cursor-pointer',
        isOver &&
          'border-border-selected bg-background-selected text-text-selected border-solid',
        className,
      )}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (
          event.currentTarget.contains(target) &&
          !target.closest('button, a, input, select, textarea')
        )
          openFileDialog();
      }}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        hidden
        onChange={(event) => {
          if (event.currentTarget.files?.length)
            onFilesSelected(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
      {children({ openFileDialog, isOver })}
    </div>
  );
}
