import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  signal?: AbortSignal;
};

const SESSION_EXPIRED_PATH = '/api/auth/session-expired';

async function redirectAfterUnauthorized(): Promise<never> {
  if (typeof window !== 'undefined') {
    window.location.replace(SESSION_EXPIRED_PATH);
    return new Promise<never>(() => undefined);
  }

  const { redirect } = await import('next/navigation');
  redirect(SESSION_EXPIRED_PATH);
}

function filterParams(
  params?: RequestOptions['params'],
): Record<string, any> | undefined {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  );
}

export async function getServerCookies(): Promise<string> {
  if (typeof window !== 'undefined') return '';
  const mod = await import('next/headers');
  const store = await mod.cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
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
    signal,
  } = options;
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookieHeader)
    cookieHeader = await getServerCookies();

  const config: AxiosRequestConfig = {
    baseURL:
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL || env.API_URL
        : env.API_URL,
    url,
    method: method as AxiosRequestConfig['method'],
    headers: { ...headers, ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
    params: filterParams(params),
    data: body || undefined,
    onUploadProgress,
    signal,
  };

  try {
    const response = await axios.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return redirectAfterUnauthorized();
    }
    throw error;
  }
}

export const api = {
  get<T>(url: string, options?: RequestOptions) {
    return axiosApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: any, options?: RequestOptions) {
    return axiosApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(url: string, body?: any, options?: RequestOptions) {
    return axiosApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(url: string, body?: any, options?: RequestOptions) {
    return axiosApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions) {
    return axiosApi<T>(url, { ...options, method: 'DELETE' });
  },
};
