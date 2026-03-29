import type { Metadata } from "next";
import { Space_Mono, Outfit } from "next/font/google";
import { colors } from "@/lib/theme";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Supermango",
  description: "Slack 링크 자동 요약 & 카드뉴스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${spaceMono.className} ${outfit.variable}`}>
      <body
        style={{
          margin: 0,
          backgroundColor: colors.bgDeep,
          color: colors.textPrimary,
        }}
      >
        {children}
      </body>
    </html>
  );
}
