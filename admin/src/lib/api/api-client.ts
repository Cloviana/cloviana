import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { isPlatformHost } from '@/lib/tenant/surface';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  signal?: AbortSignal;
};

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

// On a marketplace host the API resolves the marketplace from the host the visitor used, which
// the Next server must pass along. Platform hosts return undefined.
async function getServerTenantHost(): Promise<string | undefined> {
  if (typeof window !== 'undefined') return undefined;
  try {
    const { headers: requestHeaders } = await import('next/headers');
    const store = await requestHeaders();
    const host = store.get('x-forwarded-host') ?? store.get('host');
    return host && !isPlatformHost(host) ? host : undefined;
  } catch {
    return undefined;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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

  const tenantHost = await getServerTenantHost();

  const config: AxiosRequestConfig = {
    baseURL:
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL || env.API_URL
        : env.API_URL,
    url,
    method: method as AxiosRequestConfig['method'],
    headers: {
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(tenantHost ? { 'x-forwarded-host': tenantHost } : {}),
    },
    params: filterParams(params),
    data: body || undefined,
    onUploadProgress,
    signal,
  };

  try {
    const response = await axios.request<T>(config);
    return response.data;
  } catch (error) {
    if (typeof window === 'undefined' && axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusSuffix = status ? ` (${status})` : '';
      throw new ApiError(
        `API request failed: ${method} ${url}${statusSuffix}`,
        status,
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : Array.isArray(error.response?.data?.message)
            ? error.response.data.message
                .filter((value: unknown) => typeof value === 'string')
                .join(' ')
            : undefined,
      );
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
