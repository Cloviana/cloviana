import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
};

const axiosInstance = axios.create({
  baseURL: env.API_URL,
  withCredentials: false,
});

// Helper function that filters out undefined or null query parameters.
// Axios will automatically convert the params object into a query string.
function filterParams(
  params?: RequestOptions['params'],
): Record<string, any> | undefined {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
}

// Get server-side cookies (only used in Node environments)
export function getServerCookies(): Promise<string> {
  if (typeof window !== 'undefined') return Promise.resolve('');
  return import('next/headers')
    .then(({ cookies }) => {
      try {
        const cookieStore = cookies();
        return cookieStore
          .getAll()
          .map((c) => `${c.name}=${c.value}`)
          .join('; ');
      } catch (error) {
        console.error('Failed to access cookies:', error);
        return '';
      }
    })
    .catch((error) => {
      console.error('Error importing next/headers:', error);
      return '';
    });
}

async function axiosApi<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    cookie,
    params,
    onUploadProgress,
  } = options;

  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookieHeader) {
    cookieHeader = await getServerCookies();
  }

  const config: AxiosRequestConfig = {
    url,
    method: method as AxiosRequestConfig['method'],
    headers: {
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    params: filterParams(params),
    data: body || undefined,
    onUploadProgress,
  };

  try {
    const response = await axiosInstance.request<T>(config);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(message);
  }
}

export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return axiosApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return axiosApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return axiosApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return axiosApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return axiosApi<T>(url, { ...options, method: 'DELETE' });
  },
};
