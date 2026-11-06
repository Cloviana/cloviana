export interface SellerInviteNotification {
  to: string;
  slug: string;
  marketplaceName: string;
  sellerName: string;
  token: string;
  expiresAt: Date;
}

export abstract class SellerInviteNotifier {
  abstract send(input: SellerInviteNotification): Promise<void>;
}
