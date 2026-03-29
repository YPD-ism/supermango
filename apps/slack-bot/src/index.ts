import { App } from "@slack/bolt";
import { shouldProcessMessage } from "./link-detector.js";
import { extractUrls } from "./extract-urls.js";
import { runSummaryPipeline, formatSummaryMessage } from "./summary-pipeline.js";
import { generateCardImages } from "./card-image-generator.js";
import {
  uploadCardImages,
  updateMessageWithCardImages,
} from "./card-news-publisher.js";

const requiredEnvVars = [
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_APP_TOKEN",
] as const;

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}\n` +
      "Copy .env.example to .env and fill in the values."
  );
  process.exit(1);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Listen for all messages and filter for link-containing channel messages
app.message(async ({ message, client, logger, context }) => {
  if (!shouldProcessMessage(message)) {
    return;
  }

  const msgText = "text" in message ? (message.text as string) : undefined;
  const urls = extractUrls(msgText ?? "");
  if (urls.length === 0) return;

  const teamId = (context as { teamId?: string }).teamId ?? "unknown";

  // Add 👀 reaction to indicate processing
  try {
    await client.reactions.add({
      name: "eyes",
      channel: message.channel,
      timestamp: message.ts,
    });
  } catch (error) {
    logger.error("Failed to add 👀 reaction:", error);
  }

  // Run the summary pipeline
  const result = await runSummaryPipeline({
    urls,
    channelId: message.channel,
    messageTs: message.ts,
    userId: (message as { user?: string }).user ?? "unknown",
    teamId,
  });

  if (result.success && result.summary) {
    // Post summary as a thread reply
    const text = formatSummaryMessage(result.summary, result.skippedUrlCount);
    try {
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text,
      });
    } catch (error) {
      logger.error("Failed to post summary thread:", error);
    }

    // Remove 👀 and add ✅
    try {
      await client.reactions.remove({
        name: "eyes",
        channel: message.channel,
        timestamp: message.ts,
      });
      await client.reactions.add({
        name: "white_check_mark",
        channel: message.channel,
        timestamp: message.ts,
      });
    } catch (error) {
      logger.error("Failed to update reactions:", error);
    }

    logger.info(`Summary posted to thread ${message.ts} in ${message.channel}`);

    // Card news generation (async, failure does not affect summary)
    try {
      const cardBuffers = await generateCardImages(result.summary);

      const uploadResult = await uploadCardImages(
        cardBuffers,
        teamId,
        message.channel,
        message.ts,
      );

      if (uploadResult.success && uploadResult.urls) {
        // Post card images to Slack thread (parallel)
        await Promise.all(
          uploadResult.urls.map((imageUrl) =>
            client.chat.postMessage({
              channel: message.channel,
              thread_ts: message.ts,
              text: "카드뉴스",
              blocks: [
                {
                  type: "image",
                  image_url: imageUrl,
                  alt_text: "카드뉴스",
                },
              ],
            }),
          ),
        );

        // Add 🖼️ reaction
        await client.reactions.add({
          name: "frame_with_picture",
          channel: message.channel,
          timestamp: message.ts,
        });

        // Update DB: card_images + status=complete
        try {
          await updateMessageWithCardImages(message.ts, uploadResult.urls);
        } catch (dbError) {
          logger.error("Failed to update DB with card images:", dbError);
        }

        logger.info(`Card news posted to thread ${message.ts}`);
      } else {
        logger.error(`Card image upload failed: ${uploadResult.error}`);
      }
    } catch (cardError) {
      logger.error("Card news generation failed:", cardError);
    }
  } else {
    // Failure: add ❌ and post error in thread
    try {
      await client.reactions.remove({
        name: "eyes",
        channel: message.channel,
        timestamp: message.ts,
      });
      await client.reactions.add({
        name: "x",
        channel: message.channel,
        timestamp: message.ts,
      });
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text: `❌ 요약에 실패했습니다: ${result.error ?? "알 수 없는 오류"}`,
      });
    } catch (error) {
      logger.error("Failed to post error thread:", error);
    }

    logger.error(`Summary failed for ${message.ts}: ${result.error}`);
  }
});

(async () => {
  await app.start();
  console.log("LinkDigest Slack Bot is running (Socket Mode)");
})();
