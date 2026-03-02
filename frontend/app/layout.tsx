import type { Metadata } from "next";
import {
  Geist as FontSans,
  JetBrains_Mono as FontMono,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-client-context";
import { AuthProvider } from "@/providers/auth-context";
import { LayoutShell } from "@/components/layout-shell";

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = FontMono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schooly - Payments",
  description: "Schooly Payments Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
