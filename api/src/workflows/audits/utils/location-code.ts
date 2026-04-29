const LOCATION_CODES: Record<string, number> = {
  US: 2840,
  GB: 2826,
  CA: 2124,
  AU: 2036,
  DE: 2276,
  FR: 2250,
  ES: 2724,
  IT: 2380,
  NL: 2528,
  SE: 2752,
  NO: 2578,
  DK: 2208,
  FI: 2246,
  BE: 2056,
  CH: 2756,
  AT: 2040,
  PT: 2620,
  PL: 2616,
  BR: 2076,
  MX: 2484,
  IN: 2356,
  SG: 2702,
  ZA: 2710,
  AE: 2784,
  IE: 2372,
  NZ: 2554,
};

export function getLocationCode(country: string): number {
  return LOCATION_CODES[country.toUpperCase()] ?? 2840;
}
