"use client";

// Replaces the root layout when it fails, so it renders its own document and
// cannot rely on globals.css or the app's components.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f6f2ea",
          color: "#0e2c3c",
          padding: 16,
        }}
      >
        <title>PB Wisdom</title>
        <div
          style={{
            maxWidth: 360,
            width: "100%",
            background: "#fff",
            borderRadius: 32,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Terjadi kesalahan</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 16px" }}>
            Aplikasi gagal dimuat. Coba lagi sebentar.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
              Kode: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              border: 0,
              borderRadius: 16,
              padding: "10px 20px",
              fontWeight: 700,
              background: "#0e2c3c",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
