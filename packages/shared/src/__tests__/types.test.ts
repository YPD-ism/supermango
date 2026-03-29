import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  Database,
  MessageStatus,
  Workspace,
  Channel,
  User,
  Message,
  Url,
  Tag,
} from "../types.js";

describe("TypeScript DB types", () => {
  it("Database has all 6 tables", () => {
    type TableNames = keyof Database["public"]["Tables"];
    type Expected = "workspaces" | "channels" | "users" | "messages" | "urls" | "tags";
    expectTypeOf<TableNames>().toEqualTypeOf<Expected>();
  });

  it("MessageStatus matches SQL check constraint values", () => {
    const validStatuses: MessageStatus[] = [
      "pending",
      "summarized",
      "complete",
      "failed",
    ];
    expect(validStatuses).toHaveLength(4);
  });

  it("Workspace row has required fields", () => {
    expectTypeOf<Workspace>().toHaveProperty("id");
    expectTypeOf<Workspace>().toHaveProperty("slack_team_id");
    expectTypeOf<Workspace>().toHaveProperty("name");
    expectTypeOf<Workspace>().toHaveProperty("icon_url");
    expectTypeOf<Workspace>().toHaveProperty("created_at");
    expectTypeOf<Workspace>().toHaveProperty("updated_at");
  });

  it("Channel row has workspace_id foreign key", () => {
    expectTypeOf<Channel>().toHaveProperty("workspace_id");
    expectTypeOf<Channel>().toHaveProperty("slack_channel_id");
  });

  it("User row has workspace_id and auth_user_id", () => {
    expectTypeOf<User>().toHaveProperty("workspace_id");
    expectTypeOf<User>().toHaveProperty("auth_user_id");
    expectTypeOf<User>().toHaveProperty("slack_user_id");
    expectTypeOf<User>().toHaveProperty("display_name");
  });

  it("Message row has summary, card_images, status, share_token", () => {
    expectTypeOf<Message>().toHaveProperty("channel_id");
    expectTypeOf<Message>().toHaveProperty("user_id");
    expectTypeOf<Message>().toHaveProperty("summary");
    expectTypeOf<Message>().toHaveProperty("card_images");
    expectTypeOf<Message>().toHaveProperty("status");
    expectTypeOf<Message>().toHaveProperty("share_token");
  });

  it("Message.card_images is a string array", () => {
    expectTypeOf<Message["card_images"]>().toEqualTypeOf<string[]>();
  });

  it("Message.status is MessageStatus", () => {
    expectTypeOf<Message["status"]>().toEqualTypeOf<MessageStatus>();
  });

  it("Url row has message_id, url, title, position", () => {
    expectTypeOf<Url>().toHaveProperty("message_id");
    expectTypeOf<Url>().toHaveProperty("url");
    expectTypeOf<Url>().toHaveProperty("title");
    expectTypeOf<Url>().toHaveProperty("position");
  });

  it("Tag row has message_id and name", () => {
    expectTypeOf<Tag>().toHaveProperty("message_id");
    expectTypeOf<Tag>().toHaveProperty("name");
  });

  it("Each table has Row, Insert, and Update types", () => {
    type Tables = Database["public"]["Tables"];
    type TableKeys = keyof Tables;
    // Verify structure exists for each table
    type HasRowInsertUpdate = {
      [K in TableKeys]: Tables[K] extends { Row: unknown; Insert: unknown; Update: unknown }
        ? true
        : false;
    };
    expectTypeOf<HasRowInsertUpdate[TableKeys]>().toEqualTypeOf<true>();
  });
});
