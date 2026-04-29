export type BusinessProfileEnrichment = {
  name: string;
  description: string;
  icp: string;
  category: string;
};

export type CompetitorSearchResult = {
  domain: string;
  title: string;
};

export type CompetitorsPayload = {
  competitors: CompetitorSearchResult[];
};
