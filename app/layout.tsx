import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ThemeToggle } from "./theme-toggle";
import "./styles.css";

const resolvedAppUrl = process.env.APP_URL ?? "https://tracker.rolatools.com";
const absoluteOgImage = resolvedAppUrl
  ? new URL("/opengraph-image", resolvedAppUrl).toString()
  : "/opengraph-image";
const absoluteTwitterImage = resolvedAppUrl
  ? new URL("/twitter-image", resolvedAppUrl).toString()
  : "/twitter-image";

export const metadata: Metadata = {
  metadataBase: resolvedAppUrl ? new URL(resolvedAppUrl) : undefined,
  title: "Checklist de Instancias - Ragnarok Online",
  description: "Seguimiento diario de misiones y contenido en Ragnarok Online",
  verification: {
    google: "OQyADeLI3GjGHSwxqTUF8Ct08Ifc2gkusKujWW3cmpA",
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Checklist de Instancias - Ragnarok Online",
    description: "Seguimiento diario de instancias y misiones en Ragnarok Online.",
    url: resolvedAppUrl ?? undefined,
    images: [
      {
        url: absoluteOgImage,
        width: 512,
        height: 512,
        alt: "ROLA Replays - Ragnarok Online LATAM replay analyzer",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Checklist de Instancias - Ragnarok Online",
    description: "Seguimiento diario de instancias y misiones en Ragnarok Online.",
    images: [absoluteTwitterImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialTheme = "dark";

  return (
    <html lang="es" suppressHydrationWarning data-theme={initialTheme} style={{ colorScheme: initialTheme }}>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <div className="theme-toggle-wrap">
          <ThemeToggle />
        </div>
        <div className="app-shell">{children}</div>
        <footer className="site-footer">
          <div className="footer-bottom">
            <p>Hecho con <span className="footer-heart" aria-hidden="true">💜</span> para la comunidad de Ragnarok Online</p>
            <span className="footer-dot" aria-hidden="true" />
            <Link href="/privacy" className="footer-link">Política de privacidad</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
