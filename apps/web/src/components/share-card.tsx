"use client";

import { useState } from "react";
import Image from "next/image";
import { colors, fonts } from "@/lib/theme";

interface ShareMessage {
  id: string;
  summary: string;
  card_images: string[];
  tags: { id: string; name: string }[];
}

export default function ShareCard({ message }: { message: ShareMessage }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const summaryLines = message.summary.split("\n").filter(Boolean);
  const totalSlides = message.card_images.length;

  const goNext = () => setCurrentSlide((i) => Math.min(i + 1, totalSlides - 1));
  const goPrev = () => setCurrentSlide((i) => Math.max(i - 1, 0));

  return (
    <article
      data-testid="share-card"
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
      {/* Carousel */}
      <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", backgroundColor: "#060a1f" }}>
        <div
          style={{
            display: "flex",
            transition: "transform 0.3s ease",
            transform: `translateX(-${currentSlide * 100}%)`,
            height: "100%",
          }}
        >
          {message.card_images.map((src, i) => (
            <div key={i} style={{ position: "relative", width: "100%", height: "100%", flexShrink: 0 }}>
              <Image
                src={src}
                alt={`카드뉴스 ${i + 1}/${totalSlides}`}
                fill
                sizes="480px"
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Nav buttons */}
        <button
          data-testid="carousel-prev"
          onClick={goPrev}
          aria-label="이전"
          style={{
            position: "absolute",
            left: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(10, 14, 39, 0.7)",
            color: colors.textPrimary,
            fontSize: "0.875rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: currentSlide === 0 ? 0.3 : 0.8,
          }}
        >
          ‹
        </button>
        <button
          data-testid="carousel-next"
          onClick={goNext}
          aria-label="다음"
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(10, 14, 39, 0.7)",
            color: colors.textPrimary,
            fontSize: "0.875rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: currentSlide === totalSlides - 1 ? 0.3 : 0.8,
          }}
        >
          ›
        </button>

        {/* Indicators */}
        <div
          style={{
            position: "absolute",
            bottom: "0.75rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "0.375rem",
          }}
        >
          {message.card_images.map((_, i) => (
            <span
              key={i}
              data-testid="carousel-indicator"
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                backgroundColor: i === currentSlide ? colors.accent : "rgba(226, 232, 240, 0.35)",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1rem 1.25rem" }}>
        {/* Summary bullets */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 0.75rem 0",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          {summaryLines.map((line, i) => (
            <li
              key={i}
              style={{
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                color: colors.textPrimary,
                paddingLeft: "0.875rem",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: colors.accent,
                  fontWeight: 700,
                }}
              >
                ›
              </span>
              {line}
            </li>
          ))}
        </ul>

        {/* Tags */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {message.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: colors.accent,
                backgroundColor: "rgba(250, 204, 21, 0.08)",
                border: `1px solid rgba(250, 204, 21, 0.2)`,
                borderRadius: "0.25rem",
                padding: "0.125rem 0.5rem",
                letterSpacing: "0.02em",
                fontFamily: fonts.mono,
              }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
