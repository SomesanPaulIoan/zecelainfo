"use client";

import { isInAppBrowser } from "@/lib/navigation";
import { track } from "@/lib/track";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { setStoredToken } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme: "outline" | "filled_blue"; size: "large" | "medium"; text?: string },
          ) => void;
        };
      };
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleLoginButton({ onError }: { onError: (message: string) => void }) {
  const { refreshUser } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!googleClientId || isInAppBrowser(navigator.userAgent)) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => onError("Nu am putut incarca Google Identity script.");
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [onError]);

  useEffect(() => {
    if (!ready || !googleClientId || !window.google || !containerRef.current) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          const result = await apiFetch<{ data: { token: string; is_new_user?: boolean } }>("/api/auth/google-login", {
            method: "POST",
            body: JSON.stringify({ id_token: response.credential }),
          });
          setStoredToken(result.data.token);
          if (result.data.is_new_user) track({ name: "sign_up", method: "google" });
          await refreshUser();
        } catch (error) {
          onError(error instanceof Error ? error.message : "Google login failed");
        }
      },
    });

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
    });
  }, [ready, refreshUser, onError]);

  if (inApp) {
    return (
      <p className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs text-slate-600">
        Conectarea cu Google nu funcționează în browserul din aplicații (TikTok, Instagram). Folosește emailul mai sus sau
        deschide pagina în Chrome/Safari din meniul „⋯”.
      </p>
    );
  }

  if (!googleClientId) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
        Google login neconfigurat. Seteaza `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
      </p>
    );
  }

  return <div ref={containerRef} />;
}
