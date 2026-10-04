import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumberPlan",
  description: "Lumber inventories, editable cut lists and stock board layouts for your next project.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
