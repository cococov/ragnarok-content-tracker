import type { Metadata } from "next";
import { cookies } from "next/headers";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieTheme = (await cookies()).get("theme")?.value;
  const initialTheme = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : "dark";

  return (
    <html lang="es" suppressHydrationWarning data-theme={initialTheme} style={{ colorScheme: initialTheme }}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
try {
  const cookieMatch = document.cookie.match(/(?:^|; )theme=(light|dark)(?:;|$)/);
  const cookieTheme = cookieMatch?.[1];
  const stored = localStorage.getItem("theme");
  const theme = cookieTheme === "light" || cookieTheme === "dark"
    ? cookieTheme
    : stored === "light" || stored === "dark"
    ? stored
    : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (stored !== theme) localStorage.setItem("theme", theme);
} catch {}
`}
        </Script>
      </head>
      <body>
        <div className="theme-toggle-wrap">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
