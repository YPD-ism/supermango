import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
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
          🔗 LinkDigest
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
      <main style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
        <p style={{ color: colors.textMuted }}>
          아직 공유된 링크가 없어요. Slack 채널에 봇을 초대해보세요!
        </p>
      </main>
    </div>
  );
}
