export const ICON_NAMES = [
  'keyboard_arrow_down',
  'arrow_forward',
  'menu',
  'close',
  'format_quote',
  'square',
  'send_time_extension',
  'hourglass_empty',
  'money_off',
  'article',
  'link_off',
  'bolt',
  'edit_note',
  'link',
  'trending_up',
  'timer_off',
  'search_off',
  'insights',
] as const;

const sortedIconNames = [...ICON_NAMES].sort();

export const MATERIAL_SYMBOLS_STYLESHEET = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:FILL@0..1&icon_names=${sortedIconNames.join(
  ',',
)}&display=block`;
