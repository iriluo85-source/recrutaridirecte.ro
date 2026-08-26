import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const DESCRIERE =
  "Angajatorii caută direct candidații potriviți — fără intermediari, fără anunțuri. Candidații își publică profilul și CV-ul ca să fie găsiți.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Recrutare Directă",
  description: DESCRIERE,
  applicationName: "Recrutare Directă",
  openGraph: {
    type: "website",
    siteName: "Recrutare Directă",
    title: "Recrutare Directă",
    description: DESCRIERE,
    url: APP_URL,
    locale: "ro_RO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recrutare Directă",
    description: DESCRIERE,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
