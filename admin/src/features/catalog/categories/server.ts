import 'server-only';

// What a server component needs and the client entry point (`index.ts`) can't carry.
export { findCategory } from './api/find-category';
