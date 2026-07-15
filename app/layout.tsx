import type { Metadata } from "next";
import { Libre_Franklin, Syne } from "next/font/google";
import Navbar from "@/components/navbar";
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
  applicationName: "Helix",
  title: {
    default: "Helix — Customer Support Ticketing",
    template: "%s | Helix",
  },
  description:
    "A modern customer support platform for submitting, tracking, and discussing support tickets.",
  keywords: [
    "customer support",
    "helpdesk",
    "ticketing system",
    "support tickets",
    "Next.js",
    "Princewill Nanakumor",
  ],
  authors: [
    {
      name: "Nanakumor Princewill",
      url: "https://princewillnanakumor.com/",
    },
  ],
  creator: "Nanakumor Princewill",
  publisher: "Nanakumor Princewill",
  category: "technology",
  openGraph: {
    type: "website",
    siteName: "Helix",
    title: "Helix — Customer Support Ticketing",
    description:
      "Submit, track, and discuss customer support tickets through a clear, role-based helpdesk.",
  },
  twitter: {
    card: "summary",
    title: "Helix — Customer Support Ticketing",
    description:
      "Submit, track, and discuss customer support tickets through a clear, role-based helpdesk.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body className="flex min-h-full flex-col font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
