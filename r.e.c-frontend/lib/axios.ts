"use client";
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ── Interceptor de respuesta: refresh silencioso en 401 ──────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Rutas del BFF proxy que no deben disparar un refresh al recibir 401
 * (son rutas de auth que manejan su propio flujo).
 */
const SKIP_REFRESH_PATHS = ["auth/login", "auth/refresh", "auth/logout"];

function shouldSkipRefresh(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config?.url) return false;
  return SKIP_REFRESH_PATHS.some((p) => config.url!.includes(p));
}

function isNetworkError(error: AxiosError): boolean {
  // Sin respuesta del servidor (timeout, offline, DNS, etc.)
  return !error.response;
}

/**
 * Llama al BFF endpoint de refresh (lee rec_refresh de cookies httpOnly,
 * renueva tokens en el backend y actualiza las cookies de sesión).
 * Retorna `true` si el refresh fue exitoso.
 */
async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  // Limpiar cookies de sesión vía BFF y redirigir
  fetch("/api/auth/session", { method: "DELETE" })
    .catch(() => {})
    .finally(() => {
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    });
}

api.interceptors.response.use(
  // Respuestas exitosas pasan sin cambios
  (response) => response,

  async (error: AxiosError) => {
    // Errores de red (timeout, offline): propagar directamente, no intentar refresh
    if (isNetworkError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    // Solo interceptar 401 — cualquier otro código pasa tal cual
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Evitar loops: no reintentar si la request ya fue reintentada o es una ruta de auth
    if (originalRequest._retried || shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    // Si ya hay un refresh en curso, reutilizar la misma promesa (evitar múltiples refreshes)
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (!refreshed) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // El refresh actualizó las cookies httpOnly — el proxy BFF usará el nuevo token
    // automáticamente en la siguiente request, así que simplemente reintentamos.
    return api(originalRequest);
  },
);

export default api;
