import type { Metadata } from "next";
import { Libre_Franklin, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({
  variable: "--font-helix-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Libre_Franklin({
  variable: "--font-helix-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helix — Support Tickets",
  description: "Submit and track support tickets with calm, clear focus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
