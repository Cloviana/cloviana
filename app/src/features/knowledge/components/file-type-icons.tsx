import { cn } from '@/utils/cn';

// Folders and the generic document come from Flat Color Icons (Icons8, MIT).
// PDF and Word come from Material Icon Theme (MIT) because Flat Color Icons
// has no per-format file glyphs — its only file icons are generic. Both sets
// are flat single-tone artwork, so they sit together.
//
// Pulled once from the Iconify API and inlined; five glyphs did not justify a
// dependency or a runtime CDN fetch. Regenerate with:
//   curl -s "https://api.iconify.design/flat-color-icons.json?icons=folder,opened-folder,document"
//   curl -s "https://api.iconify.design/material-icon-theme.json?icons=pdf,word"
//
// The two sets draw on different grids (48 and 24), so each component carries
// its own viewBox and they still render at a matched size.

type IconProps = { className?: string };

const ICON_CLASS = 'size-4 shrink-0';

export function FolderClosedIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn(ICON_CLASS, className)}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#FFA000"
        d="M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v8h40v-4c0-2.2-1.8-4-4-4"
      />
      <path
        fill="#FFCA28"
        d="M40 12H8c-2.2 0-4 1.8-4 4v20c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4"
      />
    </svg>
  );
}

export function FolderOpenedIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn(ICON_CLASS, className)}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#FFA000"
        d="M38 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h31c1.7 0 3-1.3 3-3V16c0-2.2-1.8-4-4-4"
      />
      <path
        fill="#FFCA28"
        d="M42.2 18H15.3c-1.9 0-3.6 1.4-3.9 3.3L8 40h31.7c1.9 0 3.6-1.4 3.9-3.3l2.5-14c.5-2.4-1.4-4.7-3.9-4.7"
      />
    </svg>
  );
}

function DocumentIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn(ICON_CLASS, className)}
      aria-hidden
      focusable="false"
    >
      <path fill="#90CAF9" d="M40 45H8V3h22l10 10z" />
      <path fill="#E1F5FE" d="M38.5 14H29V4.5z" />
      <path
        fill="#1976D2"
        d="M16 21h17v2H16zm0 4h13v2H16zm0 4h17v2H16zm0 4h13v2H16z"
      />
    </svg>
  );
}

function PdfIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(ICON_CLASS, className)}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#ef5350"
        d="M13 9h5.5L13 3.5zM6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m4.93 10.44c.41.9.93 1.64 1.53 2.15l.41.32c-.87.16-2.07.44-3.34.93l-.11.04l.5-1.04c.45-.87.78-1.66 1.01-2.4m6.48 3.81c.18-.18.27-.41.28-.66c.03-.2-.02-.39-.12-.55c-.29-.47-1.04-.69-2.28-.69l-1.29.07l-.87-.58c-.63-.52-1.2-1.43-1.6-2.56l.04-.14c.33-1.33.64-2.94-.02-3.6a.85.85 0 0 0-.61-.24h-.24c-.37 0-.7.39-.79.77c-.37 1.33-.15 2.06.22 3.27v.01c-.25.88-.57 1.9-1.08 2.93l-.96 1.8l-.89.49c-1.2.75-1.77 1.59-1.88 2.12c-.04.19-.02.36.05.54l.03.05l.48.31l.44.11c.81 0 1.73-.95 2.97-3.07l.18-.07c1.03-.33 2.31-.56 4.03-.75c1.03.51 2.24.74 3 .74c.44 0 .74-.11.91-.3m-.41-.71l.09.11c-.01.1-.04.11-.09.13h-.04l-.19.02c-.46 0-1.17-.19-1.9-.51c.09-.1.13-.1.23-.1c1.4 0 1.8.25 1.9.35M7.83 17c-.65 1.19-1.24 1.85-1.69 2c.05-.38.5-1.04 1.21-1.69zm3.02-6.91c-.23-.9-.24-1.63-.07-2.05l.07-.12l.15.05c.17.24.19.56.09 1.1l-.03.16l-.16.82z"
      />
    </svg>
  );
}

function DocxIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(ICON_CLASS, className)}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#01579b"
        d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m7 1.5V9h5.5zM7 13l1.5 7h2l1.5-3l1.5 3h2l1.5-7h1v-2h-4v2h1l-.9 4.2L13 15h-2l-1.1 2.2L9 13h1v-2H6v2z"
      />
    </svg>
  );
}

// txt and md share the generic document; pdf and docx get their own.
export function FileIcon({
  extension,
  className,
}: {
  extension: string;
  className?: string;
}) {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return <PdfIcon className={className} />;
    case 'docx':
      return <DocxIcon className={className} />;
    default:
      return <DocumentIcon className={className} />;
  }
}
