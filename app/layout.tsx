import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
    default: "CostInMyCity — What this job costs in your city",
    template: "%s — CostInMyCity",
  },
  description: "City-specific home project estimates: typical job cost plus the actual local permit fee, with citations.",
  metadataBase: new URL("https://tpgoebel231.github.io/costinmycity"),
  openGraph: {
    title: "CostInMyCity — What this job costs in your city",
    description: "City-specific home project estimates: typical job cost plus the actual local permit fee, with citations.",
    url: "https://tpgoebel231.github.io/costinmycity",
    siteName: "CostInMyCity",
    type: "website",
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
