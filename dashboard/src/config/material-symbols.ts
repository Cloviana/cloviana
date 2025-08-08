export const ICON_NAMES = [
  'check',
  'close',
  'key',
  'format_bold',
  'format_italic',
  'format_underlined',
  'format_paragraph',
  'paragraph',
  'undo',
  'redo',
  'keyboard_arrow_down',
  'format_h2',
  'format_h3',
  'format_list_bulleted',
  'format_list_numbered',
] as const;

const sortedIconNames = [...ICON_NAMES].sort();

export const MATERIAL_SYMBOLS_STYLESHEET = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1&icon_names=${sortedIconNames.join(
  ',',
)}&display=block`;
