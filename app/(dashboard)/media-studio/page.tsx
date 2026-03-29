"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaAsset = {
  id: string;
  type: string;
  prompt: string;
  groupId: string;
  parentId: string | null;
  platform: string | null;
  filePath: string | null;
  status: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

// ─── Media URL helper ─────────────────────────────────────────────────────────

function mediaUrl(p: string): string {
  return "/" + p.replace("./", "");
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaStudioPage() {
  // Mode
  const [mode, setMode] = useState<"image" | "video">("image");

  // Form state
  const [prompt, setPrompt] = useState("");
  const [baseAssetId, setBaseAssetId] = useState("");
  const [useAiBg, setUseAiBg] = useState(false);
  const [bgAssetId, setBgAssetId] = useState("");

  // Status
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [currentAssets, setCurrentAssets] = useState<MediaAsset[]>([]);

  // Gallery data
  const [recentImages, setRecentImages] = useState<MediaAsset[]>([]);
  const [recentVideos, setRecentVideos] = useState<MediaAsset[]>([]);

  // Gallery panel state
  const [gallery, setGallery] = useState<MediaAsset[]>([]);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  async function fetchRecentImages() {
    try {
      const res = await fetch("/api/media?type=image&limit=20");
      if (res.ok) {
        const data: MediaAsset[] = await res.json();
        // Only base assets (platform=null) for the selector
        setRecentImages(data.filter((a) => a.platform === null));
      }
    } catch { /* ignore */ }
  }

  async function fetchRecentVideos() {
    try {
      const res = await fetch("/api/media?type=video&limit=10");
      if (res.ok) {
        const data: MediaAsset[] = await res.json();
        setRecentVideos(data);
      }
    } catch { /* ignore */ }
  }

  async function fetchGallery() {
    try {
      const res = await fetch("/api/media?limit=50");
      if (res.ok) {
        const data: MediaAsset[] = await res.json();
        setGallery(data);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchRecentImages();
    fetchRecentVideos();
    fetchGallery();
  }, []);

  // ── Generate ─────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        type: mode,
        prompt: prompt.trim(),
      };
      if (baseAssetId) body.parentId = baseAssetId;
      if (mode === "video") {
        if (useAiBg) body.useAiBackground = true;
        if (useAiBg && bgAssetId) body.backgroundAssetId = bgAssetId;
      }

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Generation failed");
      } else {
        const data = await res.json();
        setCurrentAssets(data.assets ?? []);
        // Re-fetch base selectors and gallery
        await fetchRecentImages();
        await fetchRecentVideos();
        await fetchGallery();
      }
    } catch {
      setError("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const baseOptions = mode === "image" ? recentImages : recentVideos;

  // For current result preview
  const baseResultAsset = currentAssets.find((a) => a.platform === null);
  const platformAssets = currentAssets.filter(
    (a) => a.platform !== null && a.filePath
  );

  const videoResultAsset =
    mode === "video" ? currentAssets.find((a) => a.filePath) : null;

  // ── Gallery derived ──────────────────────────────────────────────────────────

  const filtered = gallery.filter(
    (a) => filter === "all" || a.type === filter
  );
  const groups: Record<string, MediaAsset[]> = {};
  for (const a of filtered) {
    groups[a.groupId] ??= [];
    groups[a.groupId].push(a);
  }
  const sortedGroups = Object.values(groups).sort(
    (a, b) =>
      new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()
  );

  // ── Styles ───────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "7px",
    color: "#e4e4e7",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#52525b",
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* ── LEFT: Workspace panel ─────────────────────────────────────────── */}
        <div
          style={{
            flex: "0 0 420px",
            background: "#111",
            border: "1px solid #1a1a1a",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#e4e4e7",
              }}
            >
              Media Studio
            </span>

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: "4px" }}>
              {(["image", "video"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setBaseAssetId("");
                    setCurrentAssets([]);
                    setError(null);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: mode === m ? "none" : "1px solid #2a2a2a",
                    background: mode === m ? "#6366f1" : "transparent",
                    color: mode === m ? "#fff" : "#71717a",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Base selector */}
            <div>
              <label style={labelStyle}>Base</label>
              <select
                value={baseAssetId}
                onChange={(e) => setBaseAssetId(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">No base (new generation)</option>
                {baseOptions.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.prompt.slice(0, 40)}
                    {asset.prompt.length > 40 ? "…" : ""} —{" "}
                    {fmtDate(asset.createdAt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Result preview */}
            {currentAssets.length > 0 && (
              <div
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #1a1a1a",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Image mode preview */}
                {mode === "image" && baseResultAsset?.filePath && (
                  <>
                    <img
                      src={mediaUrl(baseResultAsset.filePath)}
                      alt={baseResultAsset.prompt}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "6px",
                        display: "block",
                        border: "1px solid #1a1a1a",
                        objectFit: "contain",
                      }}
                    />
                    {/* Platform thumbnails row */}
                    {platformAssets.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {platformAssets.map((pa) => {
                          const isPortrait =
                            pa.platform === "tiktok" ||
                            (pa.height != null &&
                              pa.width != null &&
                              pa.height > pa.width);
                          return (
                            <div
                              key={pa.id}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <img
                                src={mediaUrl(pa.filePath!)}
                                alt={pa.platform ?? ""}
                                style={{
                                  width: isPortrait ? "40px" : "60px",
                                  height: isPortrait ? "60px" : "40px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                  border: "1px solid #2a2a2a",
                                  display: "block",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "9px",
                                  color: "#52525b",
                                  textAlign: "center",
                                }}
                              >
                                {pa.platform}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Video mode preview */}
                {mode === "video" && videoResultAsset?.filePath && (
                  <video
                    controls
                    src={mediaUrl(videoResultAsset.filePath)}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 300,
                      borderRadius: "6px",
                      display: "block",
                      border: "1px solid #1a1a1a",
                    }}
                  />
                )}
              </div>
            )}

            {/* Prompt textarea */}
            <div>
              <label style={labelStyle}>Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  mode === "image"
                    ? "Describe the image to generate…"
                    : "Describe the video topic…"
                }
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.6,
                  minHeight: "72px",
                }}
              />
            </div>

            {/* Video-only: AI background options */}
            {mode === "video" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useAiBg}
                    onChange={(e) => {
                      setUseAiBg(e.target.checked);
                      if (!e.target.checked) setBgAssetId("");
                    }}
                    style={{ accentColor: "#6366f1", cursor: "pointer" }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#a1a1aa",
                      userSelect: "none",
                    }}
                  >
                    Use AI background image
                  </span>
                </label>

                {useAiBg && (
                  <div>
                    <label style={labelStyle}>Background image</label>
                    <select
                      value={bgAssetId}
                      onChange={(e) => setBgAssetId(e.target.value)}
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Generate new background</option>
                      {recentImages.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.prompt.slice(0, 40)}
                          {asset.prompt.length > 40 ? "…" : ""} —{" "}
                          {fmtDate(asset.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background:
                  generating || !prompt.trim() ? "#1a1a1a" : "#6366f1",
                color:
                  generating || !prompt.trim() ? "#52525b" : "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor:
                  generating || !prompt.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {generating && (
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: "1.5px solid #6366f1",
                    borderTopColor: "transparent",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                />
              )}
              {generating ? "Generating…" : "Generate"}
            </button>

            {/* Error */}
            {error && (
              <span style={{ fontSize: "12px", color: "#f87171" }}>
                {error}
              </span>
            )}
          </div>
        </div>

        {/* ── RIGHT: Gallery panel ──────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            background: "#111",
            border: "1px solid #1a1a1a",
            borderRadius: "10px",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Gallery header + filter tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#e4e4e7",
              }}
            >
              Gallery
            </span>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "16px" }}>
              {(["all", "image", "video"] as const).map((f) => {
                const label = f === "all" ? "All" : f === "image" ? "Images" : "Videos";
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
                      color: active ? "#e4e4e7" : "#71717a",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "2px 0 4px",
                      transition: "color 0.15s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gallery groups */}
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
            }}
          >
            {sortedGroups.length === 0 && (
              <span style={{ fontSize: "12px", color: "#3f3f46" }}>
                No assets yet. Generate something!
              </span>
            )}

            {sortedGroups.map((group) => {
              const firstAsset = group[0];
              const truncatedPrompt =
                firstAsset.prompt.length > 60
                  ? firstAsset.prompt.slice(0, 60) + "…"
                  : firstAsset.prompt;

              return (
                <div key={firstAsset.groupId}>
                  {/* Group header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#a1a1aa",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {truncatedPrompt}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#52525b",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {fmtDate(firstAsset.createdAt)}
                    </span>
                  </div>

                  {/* Thumbnails row */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {group.map((asset) => {
                      const isVideo = asset.type === "video";
                      const thumbW = isVideo ? 45 : 72;
                      const thumbH = 72;
                      const platformLabel = asset.platform ?? "base";
                      const isHovered = hoveredId === asset.id;

                      return (
                        <div
                          key={asset.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: thumbW,
                              height: thumbH,
                              cursor: "pointer",
                            }}
                            onMouseEnter={() => setHoveredId(asset.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => {
                              setBaseAssetId(asset.id);
                              setMode(asset.type as "image" | "video");
                            }}
                          >
                            {isVideo ? (
                              asset.filePath ? (
                                <video
                                  src={mediaUrl(asset.filePath)}
                                  style={{
                                    width: thumbW,
                                    height: thumbH,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    display: "block",
                                    border: "1px solid #1a1a1a",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: thumbW,
                                    height: thumbH,
                                    borderRadius: 4,
                                    background: "#1a1a1a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <span style={{ fontSize: 9, color: "#52525b" }}>
                                    {asset.status}
                                  </span>
                                </div>
                              )
                            ) : asset.filePath ? (
                              <img
                                src={mediaUrl(asset.filePath)}
                                alt={asset.prompt}
                                style={{
                                  width: thumbW,
                                  height: thumbH,
                                  objectFit: "cover",
                                  borderRadius: 4,
                                  display: "block",
                                  border: "1px solid #1a1a1a",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: thumbW,
                                  height: thumbH,
                                  borderRadius: 4,
                                  background: "#1a1a1a",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <span style={{ fontSize: 9, color: "#52525b" }}>
                                  {asset.status}
                                </span>
                              </div>
                            )}

                            {/* Download overlay on hover */}
                            {isHovered && asset.filePath && (
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(0,0,0,0.5)",
                                  borderRadius: 4,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a
                                  href={mediaUrl(asset.filePath)}
                                  download
                                  style={{
                                    fontSize: "10px",
                                    color: "#6366f1",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                  }}
                                >
                                  ↓
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Platform label */}
                          <span
                            style={{
                              fontSize: "9px",
                              color: "#3f3f46",
                              textAlign: "center",
                            }}
                          >
                            {platformLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
