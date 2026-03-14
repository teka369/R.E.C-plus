"use client";
import axios from "axios";
import { API_BASE_URL } from "./constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((v) => v.trim());
  const entry = cookies.find((v) => v.startsWith(`${name}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.split("=").slice(1).join("="));
}

api.interceptors.request.use((config) => {
  const token = getCookie("rec_token_client");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;