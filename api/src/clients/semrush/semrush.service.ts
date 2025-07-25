import { AppConfiguration } from "@/config/app.configuration";
import { Retryable } from "@/decorators/retryable.decorator";
import { Injectable, NotFoundException } from "@nestjs/common";
import axios from "axios";
import { SEMRUSH_EXPORT_COLS } from "./semrush.constants";
import { KeywordSummary } from "./semrush.interfaces";

@Injectable()
export class SemrushService {
  private readonly base = "https://api.semrush.com/";
  private readonly apiKey: string;
  private readonly database = "us";
  private readonly exportCols = SEMRUSH_EXPORT_COLS;

  constructor(private readonly config: AppConfiguration) {
    this.apiKey = config.semrushApiKey;
  }

  @Retryable({ retries: 3, minTimeout: 1000, factor: 2 })
  async related(phrases: string[], limit = 50): Promise<KeywordSummary[]> {
    const qs = new URLSearchParams({
      type: "phrase_related",
      key: this.apiKey,
      phrase: phrases.join(";"),
      export_columns: this.exportCols,
      database: this.database,
      display_limit: String(limit),
    });
    const res = await axios.get<string>(`${this.base}?${qs.toString()}`);
    return this.parseCsv(res.data);
  }

  @Retryable({ retries: 3, minTimeout: 1000, factor: 2 })
  async summary(phrases: string[]): Promise<KeywordSummary[]> {
    const type = phrases.length === 1 ? "phrase_this" : "phrase_these";
    const qs = new URLSearchParams({
      type,
      key: this.apiKey,
      phrase: phrases.join(";"),
      export_columns: this.exportCols,
      database: this.database,
    });
    const res = await axios.get<string>(`${this.base}?${qs.toString()}`);
    return this.parseCsv(res.data);
  }

  private parseCsv(csv: string): KeywordSummary[] {
    const lines = csv
      .trim()
      .split("\n")
      .filter((l) => l);
    if (lines.length < 2) throw new NotFoundException("No data returned");
    return lines.slice(1).map((line) => {
      const [phrase, sv, cp, co, nr, td, intentCode, kd] = line.split(";");
      return {
        phrase,
        searchVolume: +sv,
        cpc: +cp,
        competition: +co,
        numberOfResults: +nr,
        trend: td,
        intent: +intentCode,
        difficulty: +kd,
      };
    });
  }
}
