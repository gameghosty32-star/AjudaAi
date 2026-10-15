import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AjudaAí — A plataforma de ajuda de Angola",
  description: "Faz perguntas, partilha conhecimento e ajuda outros angolanos. Comunidades por província e tópico. 🇦🇴",
  keywords: ["Angola", "ajuda", "perguntas", "respostas", "Luanda", "comunidade", "kwanza", "educação"],
  authors: [{ name: "AjudaAí" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AjudaAí",
  },
  openGraph: {
    title: "AjudaAí — A plataforma de ajuda de Angola",
    description: "Pergunta, responde e partilha conhecimento com angolanos.",
    siteName: "AjudaAí",
    type: "website",
    locale: "pt_AO",
  },
  twitter: {
    card: "summary",
    title: "AjudaAí",
    description: "A plataforma de ajuda de Angola 🇦🇴",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
