import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { config } from '@fortawesome/fontawesome-svg-core';
import UserContextProvider from '@/hooks/user.hook';
import '@fortawesome/fontawesome-svg-core/styles.css';
import 'overlayscrollbars/overlayscrollbars.css';
import "./globals.css";

// Prevent Font Awesome from adding its CSS since we did it manually above
config.autoAddCss = false

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Todo App with AI",
  description: "A simple todo app with AI enhancements",
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
        <UserContextProvider>
          {children}
        </UserContextProvider>
      </body>
    </html>
  );
}
