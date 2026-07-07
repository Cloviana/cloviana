// LangGraph's "configurable" context: the services each node needs
// (dataForSeo, groq, logger) are injected here at graph.invoke() time
// instead of via Nest DI, since graph nodes are plain functions, not classes.
import { GroqService } from "@/clients/groq/groq.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import { Logger } from "@nestjs/common";

export type MonitoringDependencies = {
  dataForSeo: DataForSeoService;
  groq: GroqService;
  logger?: Logger;
};

export const MonitoringContextAnnotation = Annotation.Root({
  dataForSeo: Annotation<DataForSeoService>,
  groq: Annotation<GroqService>,
  logger: Annotation<Logger | undefined>,
});

export type MonitoringNodeConfig =
  LangGraphRunnableConfig<MonitoringDependencies>;

export function requireMonitoringDependencies(
  config?: MonitoringNodeConfig,
): MonitoringDependencies {
  const configurable = config?.configurable;

  if (!configurable?.dataForSeo) {
    throw new Error("DataForSeoService not provided");
  }

  if (!configurable?.groq) {
    throw new Error("GroqService not provided");
  }

  return configurable;
}
