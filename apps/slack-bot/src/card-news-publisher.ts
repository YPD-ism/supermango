import { createSupabaseClient } from "@linkdigest/shared";

export interface UploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL environment variable is not set");
  if (!key)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  return createSupabaseClient(url, key, { isServiceRole: true });
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
  const supabase = getClient();
  const bucket = supabase.storage.from("card-images");
  const urls: string[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const filePath = `${teamId}/${channelId}/${messageTs}/card-${i + 1}.png`;

    const { error } = await bucket.upload(filePath, buffers[i], {
      contentType: "image/png",
      upsert: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data } = bucket.getPublicUrl(filePath);
    urls.push(data.publicUrl);
  }

  return { success: true, urls };
}

/**
 * Update the message record in DB with card image URLs and set status to complete.
 */
export async function updateMessageWithCardImages(
  slackMessageTs: string,
  imageUrls: string[],
): Promise<void> {
  const supabase = getClient();

  const { data: messages, error: selectError } = await supabase
    .from("messages")
    .select("id")
    .eq("slack_message_ts", slackMessageTs);

  if (selectError) {
    throw new Error(`Failed to find message: ${selectError.message}`);
  }

  if (!messages || messages.length === 0) {
    throw new Error(`Message not found for ts: ${slackMessageTs}`);
  }

  const messageId = (messages[0] as { id: string }).id;

  const { error: updateError } = await supabase
    .from("messages")
    .update({
      card_images: imageUrls,
      status: "complete",
    } as never)
    .eq("id", messageId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
