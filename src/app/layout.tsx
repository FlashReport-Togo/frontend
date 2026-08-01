import type { Metadata } from "next";
import { Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlashReport — Surveillance épidémiologique",
  description:
    "Plateforme de surveillance épidémiologique — Ministère de la Santé, République Togolaise.",
};

// Applique le thème (localStorage -> préférence système) avant le premier rendu,
// pour éviter tout flash de thème incorrect au chargement.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("flashreport-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${publicSans.variable} ${plexMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-primary font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
