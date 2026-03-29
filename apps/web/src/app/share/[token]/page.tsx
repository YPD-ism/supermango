import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import ShareCard from "@/components/share-card";
import { colors, fonts } from "@/lib/theme";

type Props = {
  params: Promise<{ token: string }>;
};

const getSharedMessage = cache(async function getSharedMessage(token: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, summary, card_images, tags(id, name)")
    .eq("share_token", token)
    .single();

  if (error || !data) return null;
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const message = await getSharedMessage(token);

  if (!message) {
    return {
      title: "LinkDigest",
      description: "Slack 링크 자동 요약 & 카드뉴스",
    };
  }

  const summary = message.summary || "";
  const firstImage = message.card_images?.[0];

  return {
    title: "LinkDigest — 공유된 요약",
    openGraph: {
      title: "LinkDigest — 공유된 요약",
      description: summary,
      ...(firstImage && {
        images: [{ url: firstImage, width: 1200, height: 900 }],
      }),
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const message = await getSharedMessage(token);

  if (!message) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            marginBottom: "1rem",
            opacity: 0.6,
          }}
        >
          🔗
        </div>
        <h1
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: "0.5rem",
          }}
        >
          이 링크는 더 이상 유효하지 않습니다
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: colors.textMuted,
            marginBottom: "1.5rem",
          }}
        >
          삭제되었거나 잘못된 링크입니다.
        </p>
        <Link
          href="/"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: colors.bgDeep,
            backgroundColor: colors.accent,
            padding: "0.625rem 1.5rem",
            borderRadius: "0.375rem",
            textDecoration: "none",
            fontFamily: fonts.mono,
          }}
        >
          LinkDigest 홈으로
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          padding: "1rem 1.5rem",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
          🔗 LinkDigest
        </h1>
      </header>

      {/* Content */}
      <main
        style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <ShareCard message={message} />

        {/* CTA */}
        <div
          style={{
            marginTop: "1.5rem",
            width: "100%",
            maxWidth: "480px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "0.875rem",
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: colors.bgDeep,
              backgroundColor: colors.accent,
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontFamily: fonts.mono,
              letterSpacing: "0.02em",
              boxSizing: "border-box",
            }}
          >
            나도 써보기 →
          </Link>
        </div>
      </main>
    </div>
  );
}
