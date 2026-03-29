import { describe, it, expect } from "vitest";
import { generateCardImages } from "../card-image-generator.js";

describe("generateCardImages", () => {
  it("returns exactly 3 PNG image buffers", async () => {
    const summary = [
      "AI가 코드 리뷰를 자동으로 수행하는 새로운 도구가 출시되었습니다",
      "개발자 생산성이 평균 30% 향상되었다는 연구 결과가 발표되었습니다",
      "오픈소스 커뮤니티에서 큰 관심을 받고 있으며 빠르게 성장 중입니다",
    ];

    const result = await generateCardImages(summary);

    expect(result).toHaveLength(3);
  });

  it("each buffer is a valid PNG", async () => {
    const summary = [
      "첫 번째 요약 문장입니다",
      "두 번째 요약 문장입니다",
      "세 번째 요약 문장입니다",
    ];

    const result = await generateCardImages(summary);

    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    for (const buf of result) {
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50); // P
      expect(buf[2]).toBe(0x4e); // N
      expect(buf[3]).toBe(0x47); // G
    }
  });

  it("each image has reasonable size (> 1KB)", async () => {
    const summary = [
      "첫 번째 요약 문장입니다",
      "두 번째 요약 문장입니다",
      "세 번째 요약 문장입니다",
    ];

    const result = await generateCardImages(summary);

    for (const buf of result) {
      expect(buf.length).toBeGreaterThan(1024);
    }
  });

  it("throws if summary does not have exactly 3 lines", async () => {
    await expect(generateCardImages(["only one"])).rejects.toThrow(
      "3줄 요약이 필요합니다",
    );

    await expect(
      generateCardImages(["one", "two", "three", "four"]),
    ).rejects.toThrow("3줄 요약이 필요합니다");
  });

  it("produces distinct images for each card", async () => {
    const summary = [
      "첫 번째 요약입니다",
      "두 번째 요약입니다",
      "세 번째 요약입니다",
    ];

    const result = await generateCardImages(summary);

    // Each card has different text and card number, so buffers must differ
    expect(Buffer.compare(result[0], result[1])).not.toBe(0);
    expect(Buffer.compare(result[1], result[2])).not.toBe(0);
    expect(Buffer.compare(result[0], result[2])).not.toBe(0);
  });
});
