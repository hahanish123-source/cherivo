import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hanora | Create a moment",
  description: "Hanora is a place to create beautiful personal moments and share them through private links."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}