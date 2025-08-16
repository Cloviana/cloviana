import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

}
