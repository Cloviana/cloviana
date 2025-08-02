export const ICON_NAMES = ['check', 'close', 'key'] as const;

const sortedIconNames = [...ICON_NAMES].sort();

export const MATERIAL_SYMBOLS_STYLESHEET = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1&icon_names=${sortedIconNames.join(
  ',',
)}&display=block`;
