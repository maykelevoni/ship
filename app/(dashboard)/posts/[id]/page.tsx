"use client";

import dynamic from "next/dynamic";

// TipTap cannot run on the server — load the editor client-only
const PostEditorClient = dynamic(() => import("./editor-client"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "32px 0",
      }}
    >
      {[400, 200, 120].map((h, i) => (
        <div
          key={i}
          style={{
            height: `${h}px`,
            borderRadius: "8px",
            background: "#1a1a1a",
          }}
        />
      ))}
    </div>
  ),
});

export default function PostEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return <PostEditorClient id={params.id} />;
}
