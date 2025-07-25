/**
 * Identifiers for each supported block type.
 */
export type BlockType = 'paragraph' | 'h2' | 'h3' | 'bullet' | 'number';

/**
 * Static config for each dropdown option:
 * - `type`: internal identifier
 * - `label`: text to show
 * - `icon`: GIcon name
 */
export const BLOCK_TYPE_CONFIG: Array<{
  type: BlockType;
  label: string;
  icon: string;
}> = [
  { type: 'paragraph', label: 'Paragraph', icon: 'format_paragraph' },
  { type: 'h2', label: 'Heading 2', icon: 'format_h2' },
  { type: 'h3', label: 'Heading 3', icon: 'format_h3' },
  { type: 'bullet', label: 'Bulleted List', icon: 'format_list_bulleted' },
  { type: 'number', label: 'Numbered List', icon: 'format_list_numbered' },
];
