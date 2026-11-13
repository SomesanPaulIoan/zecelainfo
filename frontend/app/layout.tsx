import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { SiteFooterGate } from "@/components/layout/SiteFooterGate";
import { ChromeProvider } from "@/components/layout/ChromeContext";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingRuntime } from "@/components/analytics/MarketingRuntime";
import { TrialStatusBar } from "@/components/trial/TrialStatusBar";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

// `latin-ext` e necesar pentru diacriticele românești (ă, â, î, ș, ț).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

// Fontul mono e folosit doar in zonele de cod; nu il preincarcam pe fiecare pagina.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  preload: false,
});

const SITE_DESCRIPTION =
  "Platforma de informatică pentru Bacalaureat și admitere: mii de grile cu explicații video, cursuri complete, simulări de examen și probleme cu evaluare automată.";

// Fara `title`/`url` in openGraph/twitter la nivel de root: altfel orice pagina fara metadata proprie
// ar fi distribuita pe WhatsApp/Facebook cu titlul si URL-ul homepage-ului.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "ro_RO",
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Aplica tema inainte de prima randare, ca sa nu clipeasca pagina alba la cei cu modul intunecat. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: SITE_NAME,
            legalName: "Zece la Grile SRL",
            url: SITE_URL,
            logo: `${SITE_URL}/assets/zece-la-info-logo.png`,
            email: "zecelainfo@gmail.com",
            founder: { "@type": "Person", name: "Paul-Ioan Someșan" },
            address: {
              "@type": "PostalAddress",
              streetAddress: "Împăratul Traian 27",
              addressLocality: "Bistrița",
              postalCode: "420145",
              addressCountry: "RO",
            },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "ro-RO",
            publisher: { "@id": `${SITE_URL}/#organization` },
          }}
        />
        <AuthProvider>
          <ChromeProvider>
            <a
              href="#continut"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-sky-950 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
            >
              Sari la conținut
            </a>
            <MainNavbar />
            <TrialStatusBar />
            <div id="continut" className="flex-1">
              {children}
            </div>
            <SiteFooterGate />
            <MarketingRuntime
              gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null}
              tiktokPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || null}
            />
          </ChromeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
