export const MAX_PRODUCT_VARIANTS = 100;

type ProductOption = { name: string; values: string[]; valueKeys?: string[] };

export type DraftVariant = {
  key: string;
  name: string;
};

export function getDraftVariants(
  options: ProductOption[] = [],
): DraftVariant[] {
  if (options.length === 0) return [{ key: 'default', name: 'Default' }];

  const axes = options.map((option) => ({
    name: option.name.trim(),
    values: option.values
      .map((value, index) => ({
        value: value.trim(),
        key: option.valueKeys?.[index],
      }))
      .filter((entry) => entry.value),
  }));
  if (axes.some((axis) => !axis.name || axis.values.length === 0)) return [];
  if (
    axes.reduce((count, axis) => count * axis.values.length, 1) >
    MAX_PRODUCT_VARIANTS
  )
    return [];

  let combinations: { name: string; value: string; key?: string }[][] = [[]];
  for (const axis of axes) {
    combinations = combinations.flatMap((combination) =>
      axis.values.map((value) => [
        ...combination,
        { name: axis.name, value: value.value, key: value.key },
      ]),
    );
  }

  return combinations.map((combination) => ({
    // Option/value order can change without reassigning an offer to another variant.
    key: combination.every(({ key }) => key)
      ? JSON.stringify(combination.map(({ key }) => key!).sort())
      : JSON.stringify(
          combination
            .map(({ name, value }) => [name.toLowerCase(), value.toLowerCase()])
            .sort(([first], [second]) => first.localeCompare(second)),
        ),
    name: combination.map(({ value }) => value).join(' / '),
  }));
}
