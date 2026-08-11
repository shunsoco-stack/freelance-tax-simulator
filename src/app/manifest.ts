import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "個人事業主 税金予測シミュレーター",
    short_name: "税金予測",
    description: "現在の売上・経費から、2026年の税金と社会保険をリアルタイムに概算します。",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6F3",
    theme_color: "#123D49",
    lang: "ja",
    icons: [
      { src: "/icons/tax-simulator-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/tax-simulator-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/tax-simulator.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
