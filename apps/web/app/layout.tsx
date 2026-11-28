import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROADGUARD AI — City Safety & Infrastructure Intelligence",
  description:
    "AI-assisted road-safety review, city surveillance monitoring, and municipal corrective-action governance platform.",
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('roadguard_theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var t=(s==='light'||s==='dark')?s:m;document.documentElement.setAttribute('data-theme',t);if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased selection:bg-[var(--accent-soft)] selection:text-[var(--accent-primary)]">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
