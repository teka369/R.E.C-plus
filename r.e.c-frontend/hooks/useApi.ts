"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { api } from "@/lib/axios";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useApi<T = unknown>(
  key: string | null,
  config?: SWRConfiguration<T>,
) {
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    ...config,
  });
}

export function usePaginatedApi<T = unknown>(
  basePath: string,
  page: number = 1,
  limit: number = 20,
  config?: SWRConfiguration<{ data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }>,
) {
  const key = `${basePath}?page=${page}&limit=${limit}`;
  return useSWR<{ data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
}
