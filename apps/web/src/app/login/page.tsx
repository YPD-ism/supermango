"use client";

import { handleSlackLogin } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function LoginPage() {

  return (
    <div
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
          fontSize: "2.5rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em",
        }}
      >
        🔗 LinkDigest
      </h1>
      <p
        style={{
          fontSize: "1rem",
          color: colors.textMuted,
          marginBottom: "3rem",
        }}
      >
        Slack 링크 자동 요약 &amp; 카드뉴스
      </p>
      <button
        onClick={handleSlackLogin}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 2rem",
          fontSize: "1rem",
          fontWeight: 700,
          color: colors.bgDeep,
          backgroundColor: colors.accent,
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
      >
        Slack으로 로그인
      </button>
    </div>
  );
}
