import type { Metadata } from "next";
import { Bungee, Azeret_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nerderland",
    template: "%s | Nerderland",
  },
  description: "Inside every mystery, mystery...",

  metadataBase: new URL("https://nerderland.com"),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Nerderland",
    description: "Inside every mystery, mystery...",
    url: "https://Nerderland.com",
    siteName: "Nerderland",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nerderland",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Nerderland",
    description: "Inside every mystery, mystery...",
    creator: "@Nerderland",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bungee.variable} ${azeretMono.variable} ${pressStart2P.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div
            className="min-h-screen fixed left-0 right-0 top-0 bottom-0 bg-cover bg-center overflow-hidden -z-50"
            style={{
              backgroundImage: 'url("/img/bg.webp")',
              backgroundRepeat: "no-repeat",
            }}
          />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
