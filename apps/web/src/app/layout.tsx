import type { Metadata } from "next";
import { colors, fonts } from "@/lib/theme";

export const metadata: Metadata = {
  title: "LinkDigest",
  description: "Slack 링크 자동 요약 & 카드뉴스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          backgroundColor: colors.bgDeep,
          color: colors.textPrimary,
          fontFamily: fonts.mono,
        }}
      >
        {children}
      </body>
    </html>
  );
}
