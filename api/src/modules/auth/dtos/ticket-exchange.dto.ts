import { IsUUID } from "class-validator";

export class TicketExchangeDto {
  @IsUUID()
  ticket!: string
}