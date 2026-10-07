const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");
const API_BASE_URL = configuredBaseUrl || "/api";

const TOKEN_KEY = "lisensibank_token";
const USER_KEY = "lisensibank_user";

export type SessionUser = { id: string; email: string };

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveSession(token: string, user: SessionUser) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): SessionUser | null {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}, authenticated = true) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export function navigate(path: string, replace = false) {
  if (replace) window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
