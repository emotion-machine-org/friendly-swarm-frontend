import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import FlockBackground from "@/components/FlockBackground";

export const metadata: Metadata = {
  title: "Friendly Swarm",
  description: "A friendly swarm of people helping each other succeed.",
  robots: "noindex, nofollow, noarchive, nosnippet",
  openGraph: {
    title: "Friendly Swarm",
    description: "A friendly swarm of people helping each other succeed.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Friendly Swarm",
    description: "A friendly swarm of people helping each other succeed.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐝</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <FlockBackground />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
