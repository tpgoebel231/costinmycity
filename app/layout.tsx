import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DEFAULT_DESCRIPTION, HOME_TITLE, OG_IMAGE, SITE } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: HOME_TITLE,
    template: "%s — CostInMyCity",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE),
  openGraph: {
    siteName: "CostInMyCity",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable + " " + source.variable}>
      <body className="min-h-screen font-sans">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0Z3ZHWEGHM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0Z3ZHWEGHM');
          `}
        </Script>
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
