import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slimbox - Developer Dashboard",
  description: "Real-time visibility into Headroom compression.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
