import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const rawLimit = parseInt(searchParams.get("limit") || "", 10);
  const pageSize = Math.min(
    Number.isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_PAGE_SIZE : rawLimit,
    MAX_PAGE_SIZE
  );

  const workspaceId = searchParams.get("workspace_id");
  const channelId = searchParams.get("channel_id");
  const tag = searchParams.get("tag");

  // Build dynamic select: use !inner joins when filtering on related tables
  const channelJoin = workspaceId ? "channel!inner:channel_id" : "channel:channel_id";
  const tagsJoin = tag ? "tags!inner" : "tags";

  const selectQuery = [
    "*",
    "user:user_id(id, display_name, avatar_url)",
    `${channelJoin}(id, name, workspace_id)`,
    "urls(id, url, title, position)",
    `${tagsJoin}(id, name)`,
  ].join(", ");

  let query = supabase
    .from("messages")
    .select(selectQuery)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  if (workspaceId) {
    query = query.eq("channel.workspace_id", workspaceId);
  }

  if (channelId) {
    query = query.eq("channel_id", channelId);
  }

  if (tag) {
    query = query.eq("tags.name", tag);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query.limit(pageSize + 1);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }

  const items = data as unknown as Array<{ created_at: string; [key: string]: unknown }>;
  const hasMore = items.length > pageSize;
  const trimmed = hasMore ? items.slice(0, pageSize) : items;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].created_at : null;

  return NextResponse.json({ data: trimmed, nextCursor });
}
