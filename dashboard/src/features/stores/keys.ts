export const getStoresKey = () => ['stores'] as const;
export const getStoreKey = (id: string) => [...getStoresKey(), id] as const;
