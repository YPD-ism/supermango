import { App } from "@slack/bolt";
import { shouldProcessMessage } from "./link-detector.js";

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
app.message(async ({ message, client, logger }) => {
  if (!shouldProcessMessage(message)) {
    return;
  }

  try {
    await client.reactions.add({
      name: "eyes",
      channel: message.channel,
      timestamp: message.ts,
    });
    logger.info(
      `Link detected in ${message.channel}, added 👀 reaction to ${message.ts}`
    );
  } catch (error) {
    logger.error("Failed to add 👀 reaction:", error);
  }
});

(async () => {
  await app.start();
  console.log("LinkDigest Slack Bot is running (Socket Mode)");
})();
