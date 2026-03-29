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

  let query = supabase
    .from("messages")
    .select(
      `
      *,
      user:user_id(id, display_name, avatar_url),
      channel:channel_id(id, name, workspace_id),
      urls(id, url, title, position),
      tags(id, name)
    `
    )
    .eq("status", "complete")
    .order("created_at", { ascending: false })

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

  const hasMore = data.length > pageSize;
  const items = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? items[items.length - 1].created_at : null;

  return NextResponse.json({ data: items, nextCursor });
}
