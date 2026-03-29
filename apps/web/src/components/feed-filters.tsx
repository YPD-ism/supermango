"use client";

import { useState, useEffect, useCallback } from "react";
import { colors, fonts } from "@/lib/theme";

export interface FilterState {
  workspace_id: string;
  channel_id: string;
  tag: string;
}

interface Workspace {
  id: string;
  name: string;
  icon_url: string | null;
}

interface Channel {
  id: string;
  name: string;
  workspace_id: string;
}

interface FeedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "0.5rem 0.75rem",
  fontSize: "0.8125rem",
  fontFamily: fonts.mono,
  fontWeight: 600,
  color: colors.textPrimary,
  backgroundColor: "#0f1535",
  border: `1px solid ${colors.border}`,
  borderRadius: "0.375rem",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.5rem center",
  backgroundSize: "12px",
  paddingRight: "1.75rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  paddingLeft: "2rem",
  fontSize: "0.8125rem",
  fontFamily: fonts.mono,
  color: colors.textPrimary,
  backgroundColor: "#0f1535",
  border: `1px solid ${colors.border}`,
  borderRadius: "0.375rem",
};

export default function FeedFilters({ onFilterChange }: FeedFiltersProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setWorkspaces(json.data || []));

    fetch("/api/channels")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setAllChannels(json.data || []));
  }, []);

  const filteredChannels = workspaceId
    ? allChannels.filter((ch) => ch.workspace_id === workspaceId)
    : allChannels;

  const emitChange = useCallback(
    (overrides: Partial<FilterState>) => {
      const next = { workspace_id: workspaceId, channel_id: channelId, tag, ...overrides };
      onFilterChange(next);
    },
    [workspaceId, channelId, tag, onFilterChange]
  );

  const handleWorkspaceChange = (value: string) => {
    setWorkspaceId(value);
    setChannelId("");
    emitChange({ workspace_id: value, channel_id: "" });
  };

  const handleChannelChange = (value: string) => {
    setChannelId(value);
    emitChange({ channel_id: value });
  };

  const handleTagChange = (value: string) => {
    setTag(value);
    emitChange({ tag: value });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "480px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <label style={{ flex: 1, minWidth: 0 }}>
          <span className="sr-only" style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            borderWidth: 0,
          }}>
            워크스페이스
          </span>
          <select
            aria-label="워크스페이스"
            value={workspaceId}
            onChange={(e) => handleWorkspaceChange(e.target.value)}
            style={selectStyle}
          >
            <option value="">모든 워크스페이스</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1, minWidth: 0 }}>
          <span className="sr-only" style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            borderWidth: 0,
          }}>
            채널
          </span>
          <select
            aria-label="채널"
            value={channelId}
            onChange={(e) => handleChannelChange(e.target.value)}
            style={selectStyle}
          >
            <option value="">모든 채널</option>
            {filteredChannels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "0.625rem",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.875rem",
            color: colors.textMuted,
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
        <input
          type="text"
          placeholder="태그 검색..."
          value={tag}
          onChange={(e) => handleTagChange(e.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
