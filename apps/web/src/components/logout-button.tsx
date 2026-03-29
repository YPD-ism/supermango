"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "#94a3b8",
        backgroundColor: "transparent",
        border: "1px solid #334155",
        borderRadius: "0.375rem",
        cursor: "pointer",
      }}
    >
      로그아웃
    </button>
  );
}
