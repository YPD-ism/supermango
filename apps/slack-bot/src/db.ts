import {
  createSupabaseClient,
  type TypedSupabaseClient,
} from "@linkdigest/shared";

export interface SaveSummaryInput {
  teamId: string;
  channelId: string;
  userId: string;
  messageTs: string;
  urls: string[];
  summary: string[];
  tags: string[];
}

function getClient(): TypedSupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL environment variable is not set");
  if (!key)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  return createSupabaseClient(url, key, { isServiceRole: true });
}

/**
 * Upsert workspace, channel, user records and save message + urls + tags.
 * Uses service role key to bypass RLS.
 */
export async function saveSummaryResult(input: SaveSummaryInput): Promise<void> {
  const supabase = getClient();

  // 1. Upsert workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .upsert(
      { slack_team_id: input.teamId, name: input.teamId },
      { onConflict: "slack_team_id" },
    )
    .select("id")
    .single();
  if (wsError) throw new Error(`Failed to upsert workspace: ${wsError.message}`);

  // 2. Upsert channel
  const { data: channel, error: chError } = await supabase
    .from("channels")
    .upsert(
      {
        workspace_id: workspace.id,
        slack_channel_id: input.channelId,
        name: input.channelId,
      },
      { onConflict: "slack_channel_id" },
    )
    .select("id")
    .single();
  if (chError) throw new Error(`Failed to upsert channel: ${chError.message}`);

  // 3. Upsert user
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        workspace_id: workspace.id,
        slack_user_id: input.userId,
        display_name: input.userId,
      },
      { onConflict: "slack_user_id" },
    )
    .select("id")
    .single();
  if (userError) throw new Error(`Failed to upsert user: ${userError.message}`);

  // 4. Insert message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      channel_id: channel.id,
      user_id: user.id,
      slack_message_ts: input.messageTs,
      summary: input.summary.join("\n"),
      status: "summarized" as const,
    })
    .select("id")
    .single();
  if (msgError) throw new Error(`Failed to insert message: ${msgError.message}`);

  // 5. Insert URLs
  if (input.urls.length > 0) {
    const urlRows = input.urls.map((url, i) => ({
      message_id: message.id,
      url,
      position: i,
    }));
    const { error: urlError } = await supabase.from("urls").insert(urlRows);
    if (urlError) throw new Error(`Failed to insert urls: ${urlError.message}`);
  }

  // 6. Insert tags
  if (input.tags.length > 0) {
    const tagRows = input.tags.map((name) => ({
      message_id: message.id,
      name,
    }));
    const { error: tagError } = await supabase.from("tags").insert(tagRows);
    if (tagError) throw new Error(`Failed to insert tags: ${tagError.message}`);
  }
}
