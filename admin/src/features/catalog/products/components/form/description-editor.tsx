'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  UnderlineIcon,
} from 'lucide-react';
import { useImperativeHandle, type Ref } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';

const blockOptions = [
  {
    value: 'paragraph',
    label: 'Paragraph',
    level: undefined,
    icon: PilcrowIcon,
  },
  { value: 'Heading 1', label: 'Heading 1', level: 1, icon: Heading1Icon },
  { value: 'Heading 2', label: 'Heading 2', level: 2, icon: Heading2Icon },
  { value: 'Heading 3', label: 'Heading 3', level: 3, icon: Heading3Icon },
] as const;

type DescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  ref?: Ref<{ focus: () => void }>;
  id?: string;
  'aria-labelledby'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

// Edits HTML. Uncontrolled after mount: `value` only seeds the editor.
export function DescriptionEditor({
  value,
  onChange,
  onBlur,
  ref,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: DescriptionEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    // Next renders on the server first; mounting the editor there would mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id && { id }),
        ...(ariaLabelledBy && { 'aria-labelledby': ariaLabelledBy }),
        ...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy }),
        class:
          'min-h-32 text-body px-3 py-2 outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-link-default [&_a:active]:text-link-pressed [&_strong]:font-bold [&_h1]:text-heading-large [&_h2]:text-heading-medium [&_h3]:text-heading-small ',
      },
    },
    // An empty editor reports <p></p>; treat it as empty so the field stays optional.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
    onBlur: () => onBlur?.(),
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editor?.commands.focus();
      },
    }),
    [editor],
  );

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      block:
        blockOptions.find(({ level }) =>
          level ? editor?.isActive('heading', { level }) : false,
        )?.value ?? 'paragraph',
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      underline: editor?.isActive('underline') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
    }),
  });

  const tools = [
    {
      label: 'Bold',
      icon: BoldIcon,
      pressed: active?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: ItalicIcon,
      pressed: active?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Underline',
      icon: UnderlineIcon,
      pressed: active?.underline,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: 'Bulleted list',
      icon: ListIcon,
      pressed: active?.bulletList,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      icon: ListOrderedIcon,
      pressed: active?.orderedList,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div
      aria-invalid={ariaInvalid}
      // Same surface, border, radius and focus/invalid states as Input.
      className="bg-background-input text-text-default border-border-input hover:not-focus-within:not-aria-invalid:border-border-input-hovered focus-within:border-border-focused focus-within:ring-border-focused/20 aria-invalid:border-border-danger border-line text-body overflow-hidden rounded-lg transition-colors focus-within:ring-[3px]"
    >
      <div className="bg-surface-sunken border-b-line flex items-center gap-0.5 p-1">
        <Select
          value={active?.block ?? 'paragraph'}
          onValueChange={(value) => {
            const level = blockOptions.find((o) => o.value === value)?.level;
            const chain = editor?.chain().focus();
            if (level) chain?.setHeading({ level }).run();
            else chain?.setParagraph().run();
          }}
        >
          <SelectTrigger
            render={<Button size="sm" variant="ghost" />}
            aria-label="Text style"
            className="border-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            side="bottom"
            align="start"
            alignItemWithTrigger={false}
            className="min-w-48"
          >
            <SelectGroup>
              {blockOptions.map(({ value, label, icon: Icon }) => (
                <SelectItem key={value} value={value}>
                  <Icon aria-hidden="true" />
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div
          className="bg-border-default mx-1 h-4 w-(--ds-border-width)"
          aria-hidden="true"
        />
        {tools.map(({ label, icon: Icon, pressed, run }) => (
          <Toggle
            key={label}
            size="sm"
            className="h-8 min-w-8 px-1"
            aria-label={label}
            pressed={pressed}
            // Keep the selection in the editor when clicking a tool.
            onMouseDown={(event) => event.preventDefault()}
            onPressedChange={run}
          >
            <Icon className="size-4" />
          </Toggle>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
