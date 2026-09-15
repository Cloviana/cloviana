import type { ID, ISODate } from '@/types/api';

export type Topic = {
  id: ID;
  businessId: ID;
  name: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  _count: {
    prompts: number;
  };
};
