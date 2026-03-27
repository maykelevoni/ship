"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import posthog from "posthog-js";

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

function PostViewTracker({
  postId,
  title,
  topicId,
}: {
  postId: string;
  title?: string;
  topicId?: string;
}) {
  useEffect(() => {
    posthog.capture("blog_post_viewed", { postId, title, topicId });
  }, [postId, title, topicId]);

  return null;
}

export default function PostEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PostViewTracker postId={params.id} />
      <PostEditorClient id={params.id} />
    </>
  );
}
