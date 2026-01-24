import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TitleBar } from "@/components/TitleBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sales Note",
  description: "Offline Sales Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <TitleBar />
        <div className="pt-8 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
