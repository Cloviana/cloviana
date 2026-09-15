import type { ID, ISODate } from '@/types/api';

export type Tag = {
  id: ID;
  businessId: ID;
  text: string;
  createdAt: ISODate;
  _count: {
    prompts: number;
  };
};
