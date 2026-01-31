import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with your knowledge base and get accurate answers from your content.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
