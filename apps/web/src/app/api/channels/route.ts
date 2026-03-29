import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspace_id");

  let query = supabase
    .from("channels")
    .select("id, name, workspace_id");

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query.order("name");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
