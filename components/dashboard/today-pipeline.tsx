"use client";

import {
  PlatformStatusCard,
  PlatformStatusCardEmpty,
  type ContentPieceData,
} from "./platform-status-card";
import type { ActivePromotion, TodayBlogPost } from "./today-view";

const PLATFORMS = [
  "twitter",
  "linkedin",
  "video",
  "reddit",
  "instagram",
  "email",
] as const;

interface TodayPipelineProps {
  pieces: ContentPieceData[];
  blogPost: TodayBlogPost | null;
  promotion: ActivePromotion | null;
  gateModeEnabled: boolean;
  onPreview: (piece: ContentPieceData & { promotionName: string }) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function TodayPipeline({
  pieces,
  promotion,
  gateModeEnabled,
  onPreview,
  onApprove,
  onReject,
}: TodayPipelineProps) {
  const pieceByPlatform = new Map<string, ContentPieceData>();
  for (const p of pieces) {
    if (!pieceByPlatform.has(p.platform)) {
      pieceByPlatform.set(p.platform, p);
    }
  }

  return (
    <div>
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Platform Status
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {PLATFORMS.map((platform) => {
          const piece = pieceByPlatform.get(platform);
          return piece ? (
            <PlatformStatusCard
              key={platform}
              piece={piece}
              gateModeEnabled={gateModeEnabled}
              onPreview={(p) =>
                onPreview({ ...p, promotionName: promotion?.name ?? "" })
              }
              onApprove={onApprove}
              onReject={onReject}
            />
          ) : (
            <PlatformStatusCardEmpty key={platform} platform={platform} />
          );
        })}
      </div>
    </div>
  );
}
