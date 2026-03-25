import axios from 'axios';

import { env } from '@/config/env';

const axiosInstance = axios.create({ baseURL: env.API_URL });

export const api = {
  get: <T>(url: string) => axiosInstance.get<T>(url).then((r) => r.data),
  post: <T>(url: string, body?: unknown) =>
    axiosInstance.post<T>(url, body).then((r) => r.data),
};
