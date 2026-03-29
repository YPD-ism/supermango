import { getServiceRoleClient } from "./supabase-client.js";

export interface SaveSummaryInput {
  teamId: string;
  channelId: string;
  userId: string;
  messageTs: string;
  urls: string[];
  summary: string[];
  tags: string[];
}

/**
 * Upsert workspace, channel, user records and save message + urls + tags.
 * Uses service role key to bypass RLS.
 */
export async function saveSummaryResult(input: SaveSummaryInput): Promise<void> {
  const supabase = getServiceRoleClient();

  // 1. Upsert workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .upsert(
      { slack_team_id: input.teamId, name: input.teamId } as never,
      { onConflict: "slack_team_id" },
    )
    .select("id")
    .single();
  if (wsError || !workspace)
    throw new Error(`Failed to upsert workspace: ${wsError?.message}`);
  const workspaceId = (workspace as { id: string }).id;

  // 2. Upsert channel
  const { data: channel, error: chError } = await supabase
    .from("channels")
    .upsert(
      {
        workspace_id: workspaceId,
        slack_channel_id: input.channelId,
        name: input.channelId,
      } as never,
      { onConflict: "workspace_id,slack_channel_id" },
    )
    .select("id")
    .single();
  if (chError || !channel)
    throw new Error(`Failed to upsert channel: ${chError?.message}`);
  const channelId = (channel as { id: string }).id;

  // 3. Upsert user
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        workspace_id: workspaceId,
        slack_user_id: input.userId,
        display_name: input.userId,
      } as never,
      { onConflict: "workspace_id,slack_user_id" },
    )
    .select("id")
    .single();
  if (userError || !user)
    throw new Error(`Failed to upsert user: ${userError?.message}`);
  const userId = (user as { id: string }).id;

  // 4. Insert message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert(
      {
        channel_id: channelId,
        user_id: userId,
        slack_message_ts: input.messageTs,
        summary: input.summary.join("\n"),
        status: "summarized",
      } as never,
    )
    .select("id")
    .single();
  if (msgError || !message)
    throw new Error(`Failed to insert message: ${msgError?.message}`);
  const messageId = (message as { id: string }).id;

  // 5. Insert URLs
  if (input.urls.length > 0) {
    const urlRows = input.urls.map((url, i) => ({
      message_id: messageId,
      url,
      position: i,
    }));
    const { error: urlError } = await supabase
      .from("urls")
      .insert(urlRows as never);
    if (urlError)
      throw new Error(`Failed to insert urls: ${urlError.message}`);
  }

  // 6. Insert tags
  if (input.tags.length > 0) {
    const tagRows = input.tags.map((name) => ({
      message_id: messageId,
      name,
    }));
    const { error: tagError } = await supabase
      .from("tags")
      .insert(tagRows as never);
    if (tagError)
      throw new Error(`Failed to insert tags: ${tagError.message}`);
  }
}
