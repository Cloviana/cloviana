'use client';

import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react';
import { FileText, ImageIcon, PlusIcon, XIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { type PropsWithChildren, useEffect, useState, type FC } from 'react';
import { useShallow } from 'zustand/shallow';

import { useGetCmsConnections } from '@/features/cms/api/get-connections';

import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import {
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Dialog,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

const useFileSrc = (file: File | undefined) => {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      setSrc(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return src;
};

const useAttachmentSrc = () => {
  const { file, src } = useAuiState(
    useShallow((s): { file?: File; src?: string } => {
      if (s.attachment.type !== 'image') return {};
      if (s.attachment.file) return { file: s.attachment.file };
      const src = s.attachment.content?.filter((c) => c.type === 'image')[0]
        ?.image;
      if (!src) return {};
      return { src };
    }),
  );

  return useFileSrc(file) ?? src;
};

const useAttachmentMeta = () => {
  return useAuiState(
    useShallow((s) => {
      const file = s.attachment.file;
      const type = s.attachment.type;

      return {
        contentType: file?.type || s.attachment.contentType,
        fileSize: file?.size,
        name: s.attachment.name,
        type,
      };
    }),
  );
};

const formatFileSize = (size: number | undefined) => {
  if (size === undefined) return undefined;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const getAttachmentTypeLabel = (
  type: string,
  contentType: string | undefined,
) => {
  if (contentType === 'application/pdf') return 'PDF';
  if (
    contentType === 'application/msword' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'DOC';
  if (contentType?.startsWith('image/')) return contentType.split('/')[1];

  switch (type) {
    case 'image':
      return 'Image';
    case 'document':
      return 'Document';
    case 'file':
      return 'File';
    default:
      return type;
  }
};

type AttachmentPreviewProps = {
  src: string;
};

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <img
      src={src}
      alt="Attachment preview"
      className={cn(
        'block h-auto max-h-[80vh] w-auto max-w-full object-contain',
        isLoaded
          ? 'aui-attachment-preview-image-loaded'
          : 'aui-attachment-preview-image-loading invisible',
      )}
      onLoad={() => setIsLoaded(true)}
    />
  );
};

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc();

  if (!src) return children;

  return (
    <Dialog>
      <DialogTrigger
        className="aui-attachment-preview-trigger hover:bg-accent/50 cursor-pointer transition-colors"
        asChild
      >
        {children}
      </DialogTrigger>
      <DialogContent className="aui-attachment-preview-dialog-content [&>button]:bg-foreground/60 [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0!">
        <DialogTitle className="aui-sr-only sr-only">
          Image Attachment Preview
        </DialogTitle>
        <div className="aui-attachment-preview bg-background relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden">
          <AttachmentPreview src={src} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentThumb: FC<{ isImage: boolean; typeLabel: string }> = ({
  isImage,
  typeLabel,
}) => {
  const src = useAttachmentSrc();

  if (src) {
    return (
      <span className="aui-attachment-chip-icon bg-background flex size-8 shrink-0 items-center justify-center rounded-md border">
        <img
          src={src}
          alt=""
          className="aui-attachment-chip-thumbnail size-full rounded-[3px] object-contain"
        />
      </span>
    );
  }

  if (isImage) {
    return (
      <span className="aui-attachment-chip-icon bg-background text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md border">
        <ImageIcon className="size-3.5" />
      </span>
    );
  }

  return (
    <span className="aui-attachment-chip-icon bg-background text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold tracking-wide uppercase">
      {typeLabel.length <= 4 ? typeLabel : <FileText className="size-3.5" />}
    </span>
  );
};

const AttachmentUI: FC = () => {
  const aui = useAui();
  const isComposer = aui.attachment.source !== 'message';

  const isImage = useAuiState((s) => s.attachment.type === 'image');
  const { contentType, fileSize, name, type } = useAttachmentMeta();
  const fileSizeLabel = formatFileSize(fileSize);
  const typeLabel = getAttachmentTypeLabel(type, contentType);
  const detailLabel = fileSizeLabel;

  return (
    <Tooltip>
      <AttachmentPrimitive.Root
        className={cn(
          'aui-attachment-root group/attachment flex min-w-0',
          !isComposer && 'max-w-full justify-end',
        )}
      >
        <div
          className={cn(
            'aui-attachment-chip bg-muted/60 flex h-11 max-w-60 min-w-0 items-center gap-2 rounded-xl border px-2 py-1.5',
            !isComposer && 'bg-muted max-w-64',
          )}
        >
          <AttachmentPreviewDialog>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="aui-attachment-chip-trigger flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left"
                aria-label={`${typeLabel} attachment`}
              >
                <AttachmentThumb isImage={isImage} typeLabel={typeLabel} />
                <span className="aui-attachment-chip-text min-w-0 flex-1">
                  <span className="aui-attachment-chip-name block truncate text-xs leading-tight font-medium">
                    <AttachmentPrimitive.Name />
                  </span>
                  <span className="aui-attachment-chip-detail text-muted-foreground block truncate text-xs leading-tight capitalize">
                    {detailLabel || name}
                  </span>
                </span>
              </button>
            </TooltipTrigger>
          </AttachmentPreviewDialog>
          {isComposer && <AttachmentRemove />}
        </div>
      </AttachmentPrimitive.Root>
      <TooltipContent side="top">
        <AttachmentPrimitive.Name />
      </TooltipContent>
    </Tooltip>
  );
};

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip="Remove file"
        className="aui-attachment-chip-remove text-muted-foreground hover:text-destructive size-5 shrink-0 rounded-full p-0"
        side="top"
      >
        <XIcon className="aui-attachment-remove-icon size-3" />
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
  );
};

export const UserMessageAttachments: FC = () => {
  return (
    <div className="aui-user-message-attachments-end col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-2">
      <MessagePrimitive.Attachments>
        {() => <AttachmentUI />}
      </MessagePrimitive.Attachments>
    </div>
  );
};

export const ComposerAttachments: FC = () => {
  return (
    <div className="aui-composer-attachments flex w-full flex-row items-center gap-2 overflow-x-auto px-0.5 pt-0.5 pb-1 empty:hidden">
      <ComposerPrimitive.Attachments>
        {() => <AttachmentUI />}
      </ComposerPrimitive.Attachments>
    </div>
  );
};

export const ComposerAddAttachment: FC<{ businessId?: string }> = ({
  businessId: propBusinessId,
}) => {
  const params = useParams();
  const businessId = propBusinessId || (params?.businessId as string);
  const { data: connections } = useGetCmsConnections(businessId || '');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TooltipIconButton
          tooltip="Add Attachment"
          side="bottom"
          variant="ghost"
          size="icon"
          className="aui-composer-add-attachment hover:bg-muted-foreground/15 dark:border-muted-foreground/15 dark:hover:bg-muted-foreground/30 size-7 rounded-full p-1 text-xs font-semibold"
          aria-label="Add Attachment"
        >
          <PlusIcon className="aui-attachment-add-icon size-4.5 stroke-[1.5px]" />
        </TooltipIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <ComposerPrimitive.AddAttachment asChild>
          <DropdownMenuItem>
            <ImageIcon className="mr-2 size-4" />
            Images
          </DropdownMenuItem>
        </ComposerPrimitive.AddAttachment>
        <ComposerPrimitive.AddAttachment asChild>
          <DropdownMenuItem>
            <FileText className="mr-2 size-4" />
            Files
          </DropdownMenuItem>
        </ComposerPrimitive.AddAttachment>
        {businessId && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              MCP Connections
            </div>
            {connections && connections.length > 0 ? (
              connections.map((conn) => {
                const name =
                  conn.platform === 'WORDPRESS'
                    ? 'WordPress'
                    : conn.platform === 'WEBFLOW'
                      ? 'Webflow'
                      : 'Framer';
                return (
                  <DropdownMenuItem key={conn.id} className="text-xs">
                    <span className="mr-2 flex size-2 items-center justify-center">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </span>
                    {name}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="px-2 py-1 text-[11px] text-muted-foreground italic">
                No active connections
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
