import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export async function handleSlackLogin() {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "slack_oidc",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    console.error("OAuth login failed:", error.message);
  }
}
