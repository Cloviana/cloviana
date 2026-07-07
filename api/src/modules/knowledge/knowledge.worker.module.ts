import { Module } from "@nestjs/common";
import { KnowledgeConsumer } from "./consumers/knowledge.consumer";
import { KnowledgeModule } from "./knowledge.module";

@Module({
  imports: [KnowledgeModule],
  controllers: [KnowledgeConsumer],
})
export class KnowledgeWorkerModule {}
