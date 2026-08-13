import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Sistema de Registro Civil - Unión",
  description: "Gestión Municipal de Actas y Trámites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            visibleToasts={4}
            gap={12}
            toastOptions={{
              classNames: {
                toast: "group toast !min-h-[52px] items-start",
                title: "text-sm font-semibold leading-snug",
                description: "text-xs leading-relaxed",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
