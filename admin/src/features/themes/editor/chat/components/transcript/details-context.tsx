'use client';

import { createContext, useContext } from 'react';

/** Whether every step shows its full output, instead of one summary line. */
const DetailsContext = createContext(false);

export const DetailsProvider = DetailsContext.Provider;
export const useShowDetails = () => useContext(DetailsContext);
