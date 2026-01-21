import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";

import Providers from "@/app/components/Providers";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YouTube Playlist Copier",
  description: "Clona playlists publicas de YouTube en tu cuenta en segundos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
