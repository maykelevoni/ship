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

      {/* Blog post rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "100%",
              height: "80px",
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "8px",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}
