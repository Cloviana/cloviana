import type { PlatformUser } from "@/modules/platform-users/domain/platform-user";

export class MeResponseDto {
  id!: string;
  email!: string;
  onboardedAt!: string | null;

  static from(user: PlatformUser): MeResponseDto {
    return {
      id: user.id,
      email: user.email,
      onboardedAt: user.onboardedAt?.toISOString() ?? null,
    };
  }
}
