/**
 * Cookie-backed key/value store used for most client-side persistence.
 * Falls back to localStorage for values too large for a cookie.
 */
const MAX_COOKIE_LEN = 3500;
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = encodeURIComponent(name) + "=";
  for (const part of document.cookie.split(";")) {
    const c = part.trim();
    if (c.startsWith(target)) {
      try {
        return decodeURIComponent(c.slice(target.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; samesite=lax`;
}

export const store = {
  getItem(key: string): string | null {
    const fromCookie = readCookie(key);
    if (fromCookie !== null) return fromCookie;
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (typeof document === "undefined") return;
    if (encodeURIComponent(value).length <= MAX_COOKIE_LEN) {
      writeCookie(key, value);
      try {
        window.localStorage.removeItem(key);
      } catch {}
      return;
    }
    // Too large for a cookie - keep it in localStorage instead.
    deleteCookie(key);
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string) {
    deleteCookie(key);
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {}
  },
};
