import type { Metadata } from "next";
import "./globals.css";
import { AnimatedAmbientBackground } from "@/components/AnimatedAmbientBackground";

export const metadata: Metadata = {
  title: "Hamora | Create a moment",
  description: "Hamora is a place to create beautiful personal moments and share them through private links."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.cdnfonts.com/css/geraldine" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Allura&family=Caveat:wght@500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Dancing+Script:wght@500;600;700&family=Great+Vibes&family=Pacifico&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Sacramento&family=Satisfy&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("hamora-website-theme");if(t!=="dark"){document.documentElement.setAttribute("data-website-theme","bright");}}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <AnimatedAmbientBackground />
        {children}
      </body>
    </html>
  );
}