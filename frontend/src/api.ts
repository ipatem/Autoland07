// Centralized API client + auth helpers
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = "autoland07_token";

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function apiGet<T>(path: string, auth = false): Promise<T> {
  const headers = auth ? await authHeaders() : {};
  const res = await fetchWithTimeout(`${API}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Eroare server" }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Eroare");
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: any, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(auth ? await authHeaders() : {}),
  };
  const res = await fetchWithTimeout(`${API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Eroare server" }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Eroare");
  }
  return res.json();
}

export async function apiPut<T>(path: string, body: any, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(auth ? await authHeaders() : {}),
  };
  const res = await fetchWithTimeout(`${API}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Eroare server" }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Eroare");
  }
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${API}${path}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Eroare server" }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Eroare");
  }
  return res.json();
}
