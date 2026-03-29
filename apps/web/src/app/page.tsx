import Link from "next/link";
import { colors } from "@/lib/theme";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: "1rem",
        }}
      >
        🔗 LinkDigest
      </h1>
      <p
        style={{
          fontSize: "1.125rem",
          color: colors.textMuted,
          marginBottom: "3rem",
        }}
      >
        Slack 링크 자동 요약 &amp; 카드뉴스
      </p>
      <Link
        href="/login"
        style={{
          padding: "0.875rem 2rem",
          fontSize: "1rem",
          fontWeight: 700,
          color: colors.bgDeep,
          backgroundColor: colors.accent,
          borderRadius: "0.5rem",
          textDecoration: "none",
        }}
      >
        시작하기
      </Link>
    </main>
  );
}
