import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { WorkflowRunType } from "@prisma/client";
import { WorkflowRunsService } from "./workflow-runs.service";

@Controller("businesses/:businessId/workflow-runs")
@UseGuards(BusinessAccessGuard)
export class WorkflowRunsController {
  constructor(private readonly workflowRuns: WorkflowRunsService) {}

  @Get()
  list(
    @Param("businessId") businessId: string,
    @Query("type", new ParseEnumPipe(WorkflowRunType, { optional: true }))
    type?: WorkflowRunType,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.workflowRuns.list(businessId, type, limit);
  }

  @Get("latest")
  latest(
    @Param("businessId") businessId: string,
    @Query("type", new ParseEnumPipe(WorkflowRunType)) type: WorkflowRunType,
  ) {
    return this.workflowRuns.latest(businessId, type);
  }

  @Get(":workflowRunId")
  get(
    @Param("businessId") businessId: string,
    @Param("workflowRunId") workflowRunId: string,
  ) {
    return this.workflowRuns.getById(businessId, workflowRunId);
  }
}
