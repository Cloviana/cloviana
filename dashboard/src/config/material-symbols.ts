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
  'chevron_right',
  'question_mark',
  'inbox',
  'deployed_code',
  'nest_true_radiant',
  'package_2',
  'crossword',
  'person_search',
  'reviews',
  'overview_key',
  'note_stack',
  'web_traffic',
  'thumbnail_bar',
  'add_link',
  'add',
] as const;

const sortedIconNames = [...ICON_NAMES].sort();

export const MATERIAL_SYMBOLS_STYLESHEET = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:FILL@0..1&icon_names=${sortedIconNames.join(
  ',',
)}&display=block`;
