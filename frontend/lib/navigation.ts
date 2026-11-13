/** Doar cai interne (ex. `/grile#pachete`); `//host` sau URL-uri absolute ar fi open redirect. */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  const value = (raw ?? "").trim();
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}

/**
 * Browserele integrate din aplicatii (TikTok, Instagram, Facebook). Google blocheaza login-ul OAuth in ele
 * (eroarea „disallowed_useragent”), deci acolo oferim doar contul cu email.
 */
export function isInAppBrowser(userAgent: string): boolean {
  return /BytedanceWebview|musical_ly|TikTok|trill|FBAN|FBAV|FB_IAB|Instagram|Snapchat|Line\//i.test(userAgent);
}
