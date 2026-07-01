import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProviders from "@/components/providers/ThemeProviders";
import GoogleAnalytics from "@/components/providers/GoogleAnalytics";
import dynamic from "next/dynamic";
const RecoveryCountdownBanner = dynamic(
  () => import("@/components/layouts/RecoveryCountdownBanner"),
  { ssr: false },
);

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://recedu.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Recedu — Plataforma de Gestión Académica para Colegios en Colombia",
    template: "%s | Recedu",
  },
  description:
    "Recedu (R.E.C) es la plataforma de gestión académica diseñada para colegios e instituciones educativas en Colombia. Gestiona notas, recuperaciones, horarios, materiales y comunicación docente-estudiante en un solo lugar.",
  keywords: [
    "gestión académica",
    "plataforma educativa",
    "colegios Colombia",
    "notas escolares",
    "recuperaciones académicas",
    "software educativo",
    "gestión escolar",
    "recedu",
  ],
  authors: [{ name: "Recedu" }],
  creator: "Recedu",
  publisher: "Recedu",
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: SITE_URL,
    siteName: "Recedu",
    title: "Recedu — Plataforma de Gestión Académica para Colegios",
    description:
      "Gestiona notas, recuperaciones, horarios y materiales educativos. Diseñada para colegios e instituciones educativas colombianas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recedu — Gestión Académica para Colegios",
    description:
      "Plataforma integral de gestión académica para instituciones educativas en Colombia.",
  },
  icons: {
    icon: "/logo2.webp",
    apple: "/logo2.webp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Recedu",
  alternateName: "R.E.C — Refuerzo Educativo Complementario",
  description:
    "Plataforma de gestión académica para colegios e instituciones educativas en Colombia. Gestiona notas, recuperaciones, horarios, materiales y comunicación docente-estudiante.",
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  availableOnDevice: "Desktop, Mobile, Tablet",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "COP",
    description: "Plataforma gratuita para instituciones educativas",
  },
  author: {
    "@type": "Organization",
    name: "Recedu",
    url: SITE_URL,
  },
  featureList: [
    "Gestión de notas y calificaciones",
    "Recuperaciones académicas",
    "Horarios institucionales",
    "Materiales de estudio",
    "Temarios por periodo",
    "Feedback docente-estudiante",
    "Reportes de rendimiento académico",
  ],
  inLanguage: "es",
  countryOfOrigin: {
    "@type": "Country",
    name: "Colombia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen bg-rec-bg-base text-rec-text-primary`}
      >
        <GoogleAnalytics />
        <ThemeProviders>
          <AuthProvider>
            {children}
            <RecoveryCountdownBanner />
          </AuthProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
