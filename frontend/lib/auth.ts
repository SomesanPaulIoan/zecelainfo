const TOKEN_KEY = "zecelainfo_token";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  role: "student" | "professor" | "admin";
  email_verified: boolean;
  phone?: string | null;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}
