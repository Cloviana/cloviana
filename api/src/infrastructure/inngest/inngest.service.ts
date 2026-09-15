import { Injectable } from "@nestjs/common";
import type { SendEventPayload } from "inngest";
import { inngest } from "./inngest.client";

@Injectable()
export class InngestService {
  send(payload: SendEventPayload) {
    return inngest.send(payload);
  }
}
