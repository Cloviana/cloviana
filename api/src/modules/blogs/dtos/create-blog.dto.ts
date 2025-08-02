import { IsString } from "class-validator";

export class CreateBlogDto {
  @IsString()
  storeId: string;
}
