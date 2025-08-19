import { Controller } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("stores")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

}
