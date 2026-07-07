// Graph node: final merge step. Combines each raw engine response with the
// mentions and inferred fan-out queries produced by the two parallel
// analysis nodes, keyed by responseKey, into the final engineResponses list.
import type { MonitoringState } from "../monitoring.state";
import type { EngineResponse, Mention } from "../monitoring.types";

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  return [...new Map(values.map((value) => [key(value), value])).values()];
}

function uniqueMentions(mentions: Mention[]): Mention[] {
  return uniqueBy(mentions, ({ domain }) => domain);
}

export function assembleEngineResponsesNode(state: MonitoringState): {
  engineResponses: EngineResponse[];
} {
  const mentionsByResponseKey = new Map(
    state.responseMentions.map(({ responseKey, mentions }) => [
      responseKey,
      mentions,
    ]),
  );
  const inferredQueriesByResponseKey = new Map(
    state.fanOutInferences.map(({ responseKey, queries }) => [
      responseKey,
      queries,
    ]),
  );

  return {
    engineResponses: state.rawEngineResponses.map((response) => {
      const inferredFanOutQueries = (
        inferredQueriesByResponseKey.get(response.responseKey) ?? []
      ).map((query) => ({ query, inferred: true }));

      return {
        ...response,
        mentions: uniqueMentions([
          ...response.mentions,
          ...(mentionsByResponseKey.get(response.responseKey) ?? []),
        ]),
        fanOutQueries: [...response.fanOutQueries, ...inferredFanOutQueries],
      };
    }),
  };
}
