"use client";
import axios from "axios";
import { API_BASE_URL } from "./constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// No adjuntamos Authorization desde localStorage.
// El backend valida con cookies HttpOnly (rec_token).

export default api;