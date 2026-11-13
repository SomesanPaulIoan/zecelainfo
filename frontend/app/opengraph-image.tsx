import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #facc15 130%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, display: "flex" }}>Zece la Info</div>
        <div style={{ fontSize: 34, marginTop: 24, maxWidth: 900, opacity: 0.95, display: "flex" }}>
          Cursuri, grile și pregătire pentru bacalaureat și admitere la informatică
        </div>
      </div>
    ),
    { ...size },
  );
}
