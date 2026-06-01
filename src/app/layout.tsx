import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: {
    default: "Q&A Support Bot — Knowledge Base Chat",
    template: "%s | Q&A Support Bot",
  },
  description:
    "Turn any website into a searchable knowledge base. Crawl sites, save content, and chat with your data for accurate, context-aware answers.",
  keywords: ["Q&A", "knowledge base", "RAG", "chat", "support bot", "document Q&A"],
  openGraph: {
    title: "Q&A Support Bot — Knowledge Base Chat",
    description:
      "Turn any website into a searchable knowledge base. Chat with your content and get accurate answers.",
    type: "website",
  },
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
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--foreground)",
            },
            classNames: {
              success: "border-accent/30",
              error: "border-red-500/30",
            },
          }}
        />
      </body>
    </html>
  );
}
