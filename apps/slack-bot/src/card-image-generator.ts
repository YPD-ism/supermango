import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1080;

let fontDataPromise: Promise<ArrayBuffer> | null = null;

function loadFont(): Promise<ArrayBuffer> {
  if (!fontDataPromise) {
    fontDataPromise = (async () => {
      // In dev (tsx), __dirname is available. In built output, resolve from cwd.
      const base =
        typeof __dirname !== "undefined"
          ? __dirname
          : join(process.cwd(), "src");
      const fontPath = join(base, "assets", "NotoSansKR-Bold.ttf");
      const buffer = await readFile(fontPath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    })();
  }
  return fontDataPromise;
}

function buildCardMarkup(
  line: string,
  cardNumber: number,
): Record<string, unknown> {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d1b33 100%)",
        padding: "80px",
        fontFamily: "NotoSansKR",
        position: "relative",
      },
      children: [
        // Top-left logo
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "48px",
              left: "60px",
              fontSize: "28px",
              color: "#FFD60A",
              letterSpacing: "-0.5px",
            },
            children: "LinkDigest",
          },
        },
        // Card number badge (top-right)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "48px",
              right: "60px",
              fontSize: "22px",
              color: "rgba(255, 255, 255, 0.4)",
            },
            children: `${cardNumber}/3`,
          },
        },
        // Main summary text
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              width: "100%",
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontSize: "44px",
                  color: "#FFFFFF",
                  lineHeight: "1.5",
                  textAlign: "center",
                  maxWidth: "860px",
                },
                children: line,
              },
            },
          },
        },
        // Bottom accent line
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "60px",
              left: "60px",
              right: "60px",
              height: "3px",
              background:
                "linear-gradient(90deg, #FFD60A 0%, rgba(255, 214, 10, 0.2) 100%)",
            },
          },
        },
      ],
    },
  };
}

async function renderCard(
  line: string,
  cardNumber: number,
): Promise<Buffer> {
  const fontData = await loadFont();
  const markup = buildCardMarkup(line, cardNumber);

  const svg = await satori(markup as unknown as React.ReactNode, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      {
        name: "NotoSansKR",
        data: fontData,
        weight: 700,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_WIDTH },
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

/**
 * Generate 3 card news PNG images from a 3-line summary.
 * Each card displays one summary line with deep navy dark design.
 */
export async function generateCardImages(
  summary: string[],
): Promise<Buffer[]> {
  if (summary.length !== 3) {
    throw new Error("3줄 요약이 필요합니다");
  }

  const images = await Promise.all(
    summary.map((line, i) => renderCard(line, i + 1)),
  );

  return images;
}
