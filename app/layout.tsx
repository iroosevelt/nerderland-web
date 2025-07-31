// app/layout.tsx
import localFont from "next/font/local";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { NerdModal } from "@/components/nerd-modal/NerdModal";
import { Web3Provider } from "@/components/Web3Provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Load local fonts
const bungee = localFont({
  src: "../public/fonts/Bungee-Regular.ttf",
  variable: "--font-bungee",
  display: "swap",
  weight: "400",
});

const azeretMono = localFont({
  src: "../public/fonts/AzeretMono-VariableFont_wght.ttf",
  variable: "--font-azeret-mono",
  display: "swap",
});

const pressStart2P = localFont({
  src: "../public/fonts/PressStart2P-Regular.ttf",
  variable: "--font-press-start-2p",
  display: "swap",
  weight: "400",
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
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bungee.variable} ${azeretMono.variable} ${pressStart2P.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Web3Provider>
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
            {modal}
            {children}
            <Toaster />
            <NerdModal />
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
