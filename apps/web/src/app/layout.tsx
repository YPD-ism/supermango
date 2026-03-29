import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
