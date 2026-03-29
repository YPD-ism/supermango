import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  // Link auth user to public.users by matching Slack identity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const slackIdentity = user.identities?.find(
      (i) => i.provider === "slack_oidc"
    );
    const slackUserId =
      slackIdentity?.identity_data?.["https://slack.com/user_id"] ??
      slackIdentity?.identity_data?.provider_id ??
      slackIdentity?.id;

    if (slackUserId) {
      const serviceClient = createSupabaseServiceClient();
      await serviceClient
        .from("users")
        .update({ auth_user_id: user.id })
        .eq("slack_user_id", slackUserId)
        .is("auth_user_id", null);
    }
  }

  return NextResponse.redirect(new URL("/feed", origin));
}
