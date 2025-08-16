export function getSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0–11
  const season =
    month < 2
      ? "Early Winter"
      : month < 5
        ? "Spring"
        : month < 8
          ? "Summer"
          : month < 11
            ? "Autumn"
            : "Late Winter";
  return `${season} ${year}`;
}
