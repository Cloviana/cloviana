import { InvalidInputError } from "@/shared/errors/application-error";

import type { ProductOptionInput, ProductVariantEdit } from "./product";

export function assertValidVariantAssignments(
  variants: Array<{ key: string }>,
  edits: ProductVariantEdit[] = [],
  offers: Array<{ sellerId: string; variantKey: string }> = [],
): void {
  const keys = new Set(variants.map((variant) => variant.key));
  const editKeys = new Set(edits.map((edit) => edit.key));
  if (
    editKeys.size !== edits.length ||
    [...editKeys].some((key) => !keys.has(key))
  ) {
    throw new InvalidInputError("Choose each current variant once.");
  }
  const combinations = new Set<string>();
  for (const offer of offers) {
    if (!keys.has(offer.variantKey)) {
      throw new InvalidInputError("Choose a current variant for every offer.");
    }
    const combination = JSON.stringify([offer.sellerId, offer.variantKey]);
    if (combinations.has(combination)) {
      throw new InvalidInputError(
        "This seller already has an offer for this variant.",
      );
    }
    combinations.add(combination);
  }
}

export function getProductVariants(options: ProductOptionInput[] = []) {
  const names = new Set<string>();
  for (const option of options) {
    const name = option.name.toLowerCase();
    if (
      option.valueKeys &&
      (option.valueKeys.length !== option.values.length ||
        new Set(option.valueKeys).size !== option.valueKeys.length)
    ) {
      throw new InvalidInputError(
        "Option identities must match the option values.",
      );
    }
    if (names.has(name)) {
      throw new InvalidInputError("Option names must be unique.");
    }
    names.add(name);
    if (
      new Set(option.values.map((value) => value.toLowerCase())).size !==
      option.values.length
    ) {
      throw new InvalidInputError("Option values must be unique.");
    }
  }
  if (
    options.reduce((count, option) => count * option.values.length, 1) > 100
  ) {
    throw new InvalidInputError(
      "Use options that create 100 variants or fewer.",
    );
  }

  const allKeys = options.flatMap((option) => option.valueKeys ?? []);
  if (new Set(allKeys).size !== allKeys.length) {
    throw new InvalidInputError("Option identities must be unique.");
  }

  let combinations: {
    optionIndex: number;
    valueIndex: number;
    name: string;
    value: string;
  }[][] = [[]];
  options.forEach((option, optionIndex) => {
    combinations = combinations.flatMap((combination) =>
      option.values.map((value, valueIndex) => [
        ...combination,
        { optionIndex, valueIndex, name: option.name, value },
      ]),
    );
  });

  return combinations.map((combination) => ({
    key:
      combination.length === 0
        ? "default"
        : combination.every(
              ({ optionIndex, valueIndex }) =>
                options[optionIndex].valueKeys?.[valueIndex],
            )
          ? JSON.stringify(
              combination
                .map(
                  ({ optionIndex, valueIndex }) =>
                    options[optionIndex].valueKeys?.[valueIndex],
                )
                .sort(),
            )
          : JSON.stringify(
              combination
                .map(({ name, value }) => [
                  name.toLowerCase(),
                  value.toLowerCase(),
                ])
                .sort(([first], [second]) => first.localeCompare(second)),
            ),
    title: combination.map(({ value }) => value).join(" / ") || "Default",
    values: combination,
  }));
}

export function priceInMinorUnits(price: string, currencyCode: string): bigint {
  if (price.length > 16 || !/^\d+(?:\.\d*)?$/.test(price)) {
    throw new InvalidInputError("Enter a valid price.");
  }
  let decimals: number;
  try {
    decimals =
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: currencyCode,
      }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    throw new InvalidInputError("The seller has an invalid currency.");
  }
  const [whole, fraction = ""] = price.split(".");
  if (fraction.length > decimals) {
    throw new InvalidInputError(
      `${currencyCode} prices allow ${decimals} decimal places.`,
    );
  }
  const amount =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0") || "0");
  if (amount > 9_223_372_036_854_775_807n) {
    throw new InvalidInputError("Enter a smaller price.");
  }
  return amount;
}
