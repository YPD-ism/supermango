import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@linkdigest/shared", () => ({
  createSupabaseClient: vi.fn(),
}));

import { createSupabaseClient } from "@linkdigest/shared";
import {
  uploadCardImages,
  updateMessageWithCardImages,
  type UploadResult,
} from "../card-news-publisher.js";

const mockCreateSupabaseClient = vi.mocked(createSupabaseClient);

// Helpers to build mock Supabase client
function makeMockClient(overrides?: {
  uploadError?: { message: string };
  updateError?: { message: string };
  selectData?: { id: string }[];
  selectError?: { message: string };
}) {
  const mockGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: "https://storage.example.com/card-images/test.png" },
  });
  const mockUpload = vi.fn().mockResolvedValue({
    data: { path: "test.png" },
    error: overrides?.uploadError ?? null,
  });
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      error: overrides?.updateError ?? null,
    }),
  });
  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: overrides?.selectData ?? [{ id: "msg-uuid-123" }],
      error: overrides?.selectError ?? null,
    }),
  });

  const client = {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
    from: vi.fn().mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
    }),
  };

  return { client, mockUpload, mockGetPublicUrl, mockUpdate, mockSelect };
}

describe("uploadCardImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  });

  it("uploads 3 images to Supabase Storage and returns public URLs", async () => {
    const { client, mockUpload, mockGetPublicUrl } = makeMockClient();
    mockCreateSupabaseClient.mockReturnValue(client as never);
    mockGetPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: "https://storage.example.com/card-images/img1.png" } })
      .mockReturnValueOnce({ data: { publicUrl: "https://storage.example.com/card-images/img2.png" } })
      .mockReturnValueOnce({ data: { publicUrl: "https://storage.example.com/card-images/img3.png" } });

    const buffers = [Buffer.from("img1"), Buffer.from("img2"), Buffer.from("img3")];
    const result = await uploadCardImages(buffers, "T123", "C456", "1234567890.123456");

    expect(result.success).toBe(true);
    expect(result.urls).toHaveLength(3);
    expect(result.urls![0]).toContain("img1.png");
    expect(mockUpload).toHaveBeenCalledTimes(3);
    // Verify storage bucket
    expect(client.storage.from).toHaveBeenCalledWith("card-images");
  });

  it("generates unique file paths using team/channel/timestamp", async () => {
    const { client, mockUpload } = makeMockClient();
    mockCreateSupabaseClient.mockReturnValue(client as never);

    const buffers = [Buffer.from("a"), Buffer.from("b"), Buffer.from("c")];
    await uploadCardImages(buffers, "T123", "C456", "1234567890.123456");

    const firstCallPath = mockUpload.mock.calls[0][0] as string;
    expect(firstCallPath).toContain("T123");
    expect(firstCallPath).toContain("C456");
    expect(firstCallPath).toContain("1234567890.123456");
  });

  it("returns failure if any upload fails", async () => {
    const { client } = makeMockClient({ uploadError: { message: "Storage full" } });
    mockCreateSupabaseClient.mockReturnValue(client as never);

    const buffers = [Buffer.from("a"), Buffer.from("b"), Buffer.from("c")];
    const result = await uploadCardImages(buffers, "T123", "C456", "1234567890.123456");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Storage full");
  });

  it("uploads with correct content type", async () => {
    const { client, mockUpload } = makeMockClient();
    mockCreateSupabaseClient.mockReturnValue(client as never);

    const buffers = [Buffer.from("a"), Buffer.from("b"), Buffer.from("c")];
    await uploadCardImages(buffers, "T123", "C456", "1234567890.123456");

    const uploadOptions = mockUpload.mock.calls[0][2];
    expect(uploadOptions).toEqual(expect.objectContaining({ contentType: "image/png" }));
  });
});

describe("updateMessageWithCardImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  });

  it("updates message status to complete and saves image URLs", async () => {
    const { client, mockUpdate, mockSelect } = makeMockClient();
    mockCreateSupabaseClient.mockReturnValue(client as never);

    const imageUrls = ["https://a.png", "https://b.png", "https://c.png"];
    await updateMessageWithCardImages("1234567890.123456", imageUrls);

    // Should query for message by slack_message_ts
    expect(mockSelect).toHaveBeenCalled();
    // Should update with card_images and status
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        card_images: imageUrls,
        status: "complete",
      }),
    );
  });

  it("throws if message not found in DB", async () => {
    const { client } = makeMockClient({ selectData: [] });
    mockCreateSupabaseClient.mockReturnValue(client as never);

    await expect(
      updateMessageWithCardImages("nonexistent", ["https://a.png"]),
    ).rejects.toThrow();
  });

  it("throws if DB update fails", async () => {
    const { client } = makeMockClient({ updateError: { message: "Update failed" } });
    mockCreateSupabaseClient.mockReturnValue(client as never);

    await expect(
      updateMessageWithCardImages("1234567890.123456", ["https://a.png"]),
    ).rejects.toThrow("Update failed");
  });
});
