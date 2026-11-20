import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "個人事業主 税金予測シミュレーター",
  description:
    "売上・経費・控除を入力し、2026年の所得税・住民税・個人事業税・消費税・社会保険と納税準備額を概算します。",
  applicationName: "個人事業主 税金予測シミュレーター",
  icons: {
    icon: [
      { url: "/icons/tax-simulator.svg", type: "image/svg+xml" },
      { url: "/icons/tax-simulator-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/tax-simulator-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123D49",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
