import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import FeedList from "@/components/feed-list";
import { colors } from "@/lib/theme";

export default async function FeedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
          🥭 Supermango
        </h1>
        <div
          style={{ display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <span style={{ fontSize: "0.875rem", color: colors.textMuted }}>
            {user?.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main style={{ padding: "1.5rem", display: "flex", justifyContent: "center" }}>
        <FeedList />
      </main>
    </div>
  );
}
