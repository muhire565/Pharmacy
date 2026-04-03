import axios, { type AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ApiErrorBody } from "./types";

const baseURL = import.meta.env.VITE_API_URL?.trim() || "/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    if (status === 401) {
      useAuthStore.getState().logout();
      const p = window.location.pathname;
      if (!p.startsWith("/login") && !p.startsWith("/register")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown, fallback = "Request failed") {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
