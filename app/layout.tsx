import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DEFAULT_DESCRIPTION, HOME_TITLE, OG_IMAGE, SITE, SITE_NAME } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: HOME_TITLE,
    template: "%s – CostInMyCity",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE),
  icons: {
    icon: [
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    siteName: "CostInMyCity",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE + "/",
  logo: SITE + "/icon-192.png",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable + " " + inter.variable}>
      <body className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script id="deferred-third-parties" strategy="lazyOnload">
          {`
            (function () {
              var started = false;
              function load() {
                if (started) return;
                started = true;
                var ads = document.createElement("script");
                ads.async = true;
                ads.crossOrigin = "anonymous";
                ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5973852449721010";
                document.head.appendChild(ads);
                var ga = document.createElement("script");
                ga.async = true;
                ga.src = "https://www.googletagmanager.com/gtag/js?id=G-0Z3ZHWEGHM";
                document.head.appendChild(ga);
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag("js", new Date());
                gtag("config", "G-0Z3ZHWEGHM");
              }
              ["pointerdown", "keydown", "touchstart"].forEach(function (name) {
                window.addEventListener(name, load, { once: true, passive: true });
              });
            })();
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
