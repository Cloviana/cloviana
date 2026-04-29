import { BadRequestException } from "@nestjs/common";

export function assertSetupCanBeCompleted(
  business: {
    name: string;
    icp: string | null;
    competitors: Array<{ id: string }>;
  },
  shouldCollectAttribution: boolean,
  heardAboutUs: string | null,
) {
  if (!business.name.trim()) {
    throw new BadRequestException("Business name is required");
  }

  if (!business.icp?.trim()) {
    throw new BadRequestException("Ideal customer profile is required");
  }

  if (business.competitors.length < 3) {
    throw new BadRequestException("Please add at least 3 competitors");
  }

  if (shouldCollectAttribution && !heardAboutUs?.trim()) {
    throw new BadRequestException("Please tell us how you heard about us");
  }
}
