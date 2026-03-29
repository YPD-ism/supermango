import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(__dirname, "../../../../supabase/migrations");

function getMigrationSQL(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  expect(files.length).toBeGreaterThan(0);
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf-8")).join("\n");
}

describe("Supabase DB schema migration", () => {
  const expectedTables = [
    "workspaces",
    "channels",
    "users",
    "messages",
    "urls",
    "tags",
  ];

  it("migration SQL file exists", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(expectedTables)("creates table: %s", (table) => {
    const sql = getMigrationSQL();
    expect(sql).toMatch(new RegExp(`create table[^;]*${table}`, "i"));
  });

  it("enables RLS on all tables", () => {
    const sql = getMigrationSQL();
    for (const table of expectedTables) {
      expect(sql).toMatch(
        new RegExp(`alter table[^;]*${table}[^;]*enable row level security`, "i")
      );
    }
  });

  it("messages table has required columns", () => {
    const sql = getMigrationSQL();
    const requiredColumns = [
      "summary",
      "card_images",
      "status",
      "share_token",
    ];
    for (const col of requiredColumns) {
      expect(sql).toMatch(new RegExp(`${col}\\s`, "i"));
    }
  });

  it("defines foreign key relationships", () => {
    const sql = getMigrationSQL();
    // channels -> workspaces
    expect(sql).toMatch(/channels[^;]*references[^;]*workspaces/is);
    // messages -> channels
    expect(sql).toMatch(/messages[^;]*references[^;]*channels/is);
    // messages -> users
    expect(sql).toMatch(/messages[^;]*references[^;]*users/is);
    // urls -> messages
    expect(sql).toMatch(/urls[^;]*references[^;]*messages/is);
    // tags -> messages
    expect(sql).toMatch(/tags[^;]*references[^;]*messages/is);
  });

  it("has RLS policy for share_token public access", () => {
    const sql = getMigrationSQL();
    expect(sql).toMatch(/share_token/i);
    expect(sql).toMatch(/create policy/i);
  });
});
