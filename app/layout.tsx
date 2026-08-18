import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cherivo | Create a moment",
  description: "Create beautiful interactive greetings and memories."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}