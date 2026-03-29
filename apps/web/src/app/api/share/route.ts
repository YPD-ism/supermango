import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { messageId } = body as { messageId?: string };

  if (!messageId) {
    return NextResponse.json(
      { error: "messageId is required" },
      { status: 400 }
    );
  }

  // Fetch message (uses authenticated client — RLS ensures user can only see their workspace's messages)
  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, share_token, status")
    .eq("id", messageId)
    .single();

  if (fetchError || !message) {
    return NextResponse.json(
      { error: "Message not found" },
      { status: 404 }
    );
  }

  // If token already exists, return it
  if (message.share_token) {
    const shareUrl = buildShareUrl(request, message.share_token);
    return NextResponse.json({
      shareToken: message.share_token,
      shareUrl,
    });
  }

  // Generate new share token and update via service role (RLS doesn't allow authenticated UPDATE)
  const newToken = randomUUID();
  const serviceClient = createSupabaseServiceClient();

  const { data: updated, error: updateError } = await serviceClient
    .from("messages")
    .update({ share_token: newToken } as Record<string, unknown>)
    .eq("id", messageId)
    .select("id, share_token")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }

  const row = updated as { id: string; share_token: string };
  const shareUrl = buildShareUrl(request, row.share_token);
  return NextResponse.json({
    shareToken: row.share_token,
    shareUrl,
  });
}

function buildShareUrl(request: Request, token: string): string {
  const url = new URL(request.url);
  return `${url.origin}/share/${token}`;
}
