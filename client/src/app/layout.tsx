import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./config.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Luminex",
  description: "Reproductor Video Luminex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/luminex/logo-best.jpeg" />
        <script src="https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
