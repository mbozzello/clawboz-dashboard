import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserIdentityProvider } from "@/components/UserIdentityProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Launchpad",
  description: "Hands-on AI skills for product managers. Learn by building.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserIdentityProvider>
          {children}
        </UserIdentityProvider>
      </body>
    </html>
  );
}
