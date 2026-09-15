'use client';

import { Button } from '@/components/ui/button';

import { useDocumentUpload } from '../hooks/use-document-upload';

type UploadButtonProps = {
  businessId: string;
};

export function UploadButton({ businessId }: UploadButtonProps) {
  // noDrag: this instance only opens the picker — the pane owns the drop target.
  const { getInputProps, open, isUploadDisabled, isUploading } =
    useDocumentUpload(businessId, { noDrag: true });

  return (
    <>
      <input {...getInputProps()} />
      <Button
        size="sm"
        variant="primary"
        disabled={isUploadDisabled}
        loading={isUploading}
        onClick={open}
      >
        Upload
      </Button>
    </>
  );
}
