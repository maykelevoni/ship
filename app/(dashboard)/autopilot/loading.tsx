export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "24px",
      }}
    >
      {/* Header skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            background: "#1a1a1a",
          }}
        />
        <div
          style={{
            width: "100px",
            height: "22px",
            borderRadius: "4px",
            background: "#1a1a1a",
          }}
        />
      </div>

      {/* Tab switcher skeleton */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "8px",
          padding: "4px",
          width: "fit-content",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "32px",
            borderRadius: "6px",
            background: "#1a1a1a",
          }}
        />
        <div
          style={{
            width: "140px",
            height: "32px",
            borderRadius: "6px",
            background: "#1a1a1a",
          }}
        />
      </div>

      {/* Card skeleton */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "200px",
            height: "20px",
            borderRadius: "4px",
            background: "#1a1a1a",
          }}
        />
        <div
          style={{
            width: "280px",
            height: "14px",
            borderRadius: "4px",
            background: "#1a1a1a",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "200px",
            borderRadius: "4px",
            background: "#0a0a0a",
          }}
        />
      </div>
    </div>
  );
}
