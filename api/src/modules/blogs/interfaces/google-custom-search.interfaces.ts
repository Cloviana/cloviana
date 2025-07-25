export interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
  logo: string;
}

export interface RankedGoogleSearchItem extends GoogleSearchItem {
  recommended: boolean;
}
