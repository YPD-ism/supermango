"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const handleLogin = () => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.signInWithOAuth({
      provider: "slack_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0e27",
        color: "#e2e8f0",
        fontFamily:
          "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
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
          color: "#94a3b8",
          marginBottom: "3rem",
        }}
      >
        Slack 링크 자동 요약 &amp; 카드뉴스
      </p>
      <button
        onClick={handleLogin}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 2rem",
          fontSize: "1rem",
          fontWeight: 700,
          color: "#0a0e27",
          backgroundColor: "#facc15",
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
