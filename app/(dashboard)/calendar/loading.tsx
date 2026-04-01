export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
      }}
    >
      <style>{`@keyframes shimmer { 0%,100% { opacity:0.5 } 50% { opacity:1 } }`}</style>

      {/* Header */}
      <div
        style={{
          width: "200px",
          height: "28px",
          background: "#1a1a1a",
          borderRadius: "6px",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />

      {/* Month nav bar */}
      <div
        style={{
          width: "100%",
          height: "40px",
          background: "#1a1a1a",
          borderRadius: "6px",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />

      {/* Calendar grid: 5 rows × 7 cols */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "8px",
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((col) => (
              <div
                key={col}
                style={{
                  height: "80px",
                  background: "#111111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  animation: "shimmer 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
