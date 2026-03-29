import { getServiceRoleClient } from "./supabase-client.js";

export interface UploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

/**
 * Upload card news images to Supabase Storage and return their public URLs.
 */
export async function uploadCardImages(
  buffers: Buffer[],
  teamId: string,
  channelId: string,
  messageTs: string,
): Promise<UploadResult> {
  const supabase = getServiceRoleClient();
  const bucket = supabase.storage.from("card-images");

  const results = await Promise.all(
    buffers.map(async (buf, i) => {
      const filePath = `${teamId}/${channelId}/${messageTs}/card-${i + 1}.png`;

      const { error } = await bucket.upload(filePath, buf, {
        contentType: "image/png",
        upsert: true,
      });

      if (error) {
        return { error: error.message };
      }

      const { data } = bucket.getPublicUrl(filePath);
      return { url: data.publicUrl };
    }),
  );

  const firstError = results.find((r) => "error" in r && r.error);
  if (firstError && "error" in firstError) {
    return { success: false, error: firstError.error };
  }

  const urls = results.map((r) => ("url" in r ? r.url! : ""));
  return { success: true, urls };
}

/**
 * Update the message record in DB with card image URLs and set status to complete.
 */
export async function updateMessageWithCardImages(
  slackMessageTs: string,
  imageUrls: string[],
): Promise<void> {
  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("messages")
    .update({
      card_images: imageUrls,
      status: "complete",
    } as never)
    .eq("slack_message_ts", slackMessageTs);

  if (error) {
    throw new Error(error.message);
  }
}
