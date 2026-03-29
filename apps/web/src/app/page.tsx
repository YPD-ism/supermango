"use client";

import { handleSlackLogin } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";

export default function LandingPage() {

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px ${colors.accentGlowMd}; }
          50% { box-shadow: 0 0 40px ${colors.accentShadow}; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
        .landing-cta:hover {
          background-color: ${colors.accentHoverBg} !important;
          transform: translateY(-2px);
        }
        .feature-card:hover {
          border-color: ${colors.accentBorder} !important;
          background-color: ${colors.accentHover} !important;
        }
      `}</style>

      {/* Grid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(${colors.accentBorder} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.accentBorder} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.04,
          animation: "gridPulse 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accentGlow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Terminal-style tag */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: "0.75rem",
            color: colors.accent,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
            padding: "0.375rem 1rem",
            border: `1px solid ${colors.accentBorder}`,
            borderRadius: "2px",
            backgroundColor: colors.accentLight,
            animation: "fadeInUp 0.6s ease-out",
          }}
        >
          <span style={{ opacity: 0.5 }}>$</span> linkdigest v1.0
          <span style={{ animation: "blink 1s step-end infinite", marginLeft: "2px" }}>▋</span>
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textAlign: "center",
            margin: 0,
            marginBottom: "1.5rem",
            animation: "fadeInUp 0.6s ease-out 0.1s both",
          }}
        >
          <span style={{ color: colors.textPrimary }}>링크는 공유하고,</span>
          <br />
          <span
            style={{
              color: colors.accent,
              textShadow: `0 0 40px ${colors.accentBorder}`,
            }}
          >
            요약은 맡기세요
          </span>
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontFamily: fonts.display,
            fontSize: "clamp(1rem, 3vw, 1.25rem)",
            color: colors.textMuted,
            textAlign: "center",
            maxWidth: "480px",
            lineHeight: 1.6,
            margin: 0,
            marginBottom: "2.5rem",
            animation: "fadeInUp 0.6s ease-out 0.2s both",
          }}
        >
          Slack에 링크를 공유하면 AI가 3줄 요약과
          <br />
          카드뉴스를 자동으로 만들어 드립니다
        </p>

        {/* CTA Button */}
        <button
          className="landing-cta"
          onClick={handleSlackLogin}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "1rem 2.25rem",
            fontSize: "1.0625rem",
            fontFamily: fonts.display,
            fontWeight: 700,
            color: colors.bgDeep,
            backgroundColor: colors.accent,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            animation: "fadeInUp 0.6s ease-out 0.3s both, pulseGlow 3s ease-in-out 1s infinite",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill={colors.bgDeep}/>
            <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill={colors.bgDeep}/>
            <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.522 2.522v6.312z" fill={colors.bgDeep}/>
            <path d="M15.165 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zm0-1.27a2.527 2.527 0 0 1-2.521-2.522 2.528 2.528 0 0 1 2.521-2.522h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill={colors.bgDeep}/>
          </svg>
          Slack으로 로그인
        </button>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: "2rem 1.5rem 4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            width: "100%",
            maxWidth: "800px",
          }}
        >
          {[
            {
              icon: "👀",
              title: "자동 감지",
              desc: "Slack에 링크가 올라오면 봇이 즉시 감지합니다",
            },
            {
              icon: "⚡",
              title: "AI 요약",
              desc: "3줄 핵심 요약과 태그를 자동 생성합니다",
            },
            {
              icon: "🖼️",
              title: "카드뉴스",
              desc: "시각적 카드뉴스 3장을 자동으로 만들어 줍니다",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="feature-card"
              style={{
                padding: "1.5rem",
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                backgroundColor: colors.bgCard,
                transition: "all 0.2s ease",
                animation: `slideIn 0.5s ease-out ${0.4 + i * 0.1}s both`,
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: fonts.display,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: 0,
                  marginBottom: "0.375rem",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontFamily: fonts.mono,
                  fontSize: "0.8125rem",
                  color: colors.textMuted,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: fonts.mono,
          fontSize: "0.75rem",
          color: colors.textMuted,
          opacity: 0.5,
          position: "relative",
          zIndex: 1,
        }}
      >
        LinkDigest — Slack 링크 자동 요약 서비스
      </footer>
    </main>
  );
}
