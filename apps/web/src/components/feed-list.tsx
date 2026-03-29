"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FeedCard from "./feed-card";
import { colors, fonts } from "@/lib/theme";

interface FeedMessage {
  id: string;
  summary: string;
  card_images: string[];
  created_at: string;
  user: { id: string; display_name: string; avatar_url: string };
  channel: { id: string; name: string; workspace_id: string };
  urls: { id: string; url: string; title: string; position: number }[];
  tags: { id: string; name: string }[];
}

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton-card"
      style={{
        backgroundColor: "#0f1535",
        border: `1px solid ${colors.border}`,
        borderRadius: "0.75rem",
        overflow: "hidden",
        maxWidth: "480px",
        width: "100%",
        fontFamily: fonts.mono,
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 3",
          background: `linear-gradient(110deg, #0f1535 30%, #1a2347 50%, #0f1535 70%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
      <div style={{ padding: "1rem 1.25rem" }}>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ width: "4rem", height: "0.875rem", borderRadius: "0.25rem", backgroundColor: "#1a2347" }} />
          <div style={{ width: "3rem", height: "0.875rem", borderRadius: "0.25rem", backgroundColor: "#1a2347" }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "0.8125rem",
              borderRadius: "0.25rem",
              backgroundColor: "#1a2347",
              marginBottom: "0.375rem",
              width: `${85 - i * 10}%`,
            }}
          />
        ))}
        <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.75rem" }}>
          <div style={{ width: "3rem", height: "1.25rem", borderRadius: "0.25rem", backgroundColor: "#1a2347" }} />
          <div style={{ width: "2.5rem", height: "1.25rem", borderRadius: "0.25rem", backgroundColor: "#1a2347" }} />
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default function FeedList() {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async (cursor?: string | null) => {
    const isInitial = !cursor;
    if (isInitial) {
      setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();

      setMessages((prev) => (isInitial ? json.data : [...prev, ...json.data]));
      setNextCursor(json.nextCursor);
    } catch {
      if (isInitial) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && nextCursor && !loadingMore) {
        fetchFeed(nextCursor);
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchFeed]);

  if (loading && !initialized) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <p style={{ color: colors.textMuted, fontSize: "0.9375rem", fontFamily: fonts.mono }}>
          피드를 불러올 수 없습니다
        </p>
        <button
          aria-label="재시도"
          onClick={() => fetchFeed()}
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: colors.bgDeep,
            backgroundColor: colors.accent,
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontFamily: fonts.mono,
          }}
        >
          재시도
        </button>
      </div>
    );
  }

  if (initialized && messages.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <p style={{ color: colors.textMuted, fontSize: "0.9375rem", fontFamily: fonts.mono }}>
          아직 공유된 링크가 없어요.
        </p>
        <p style={{ color: colors.textMuted, fontSize: "0.8125rem", fontFamily: fonts.mono }}>
          Slack 채널에 봇을 초대해보세요!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
      {messages.map((msg) => (
        <FeedCard key={msg.id} message={msg} />
      ))}
      {loadingMore && <SkeletonCard />}
      <div ref={sentinelRef} style={{ height: "1px" }} />
    </div>
  );
}
