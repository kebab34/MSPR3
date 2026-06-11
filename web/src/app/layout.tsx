import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HealthAI Coach",
  description: "Interface web MSPR — coaching santé personnalisé",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="bg-zinc-950">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
