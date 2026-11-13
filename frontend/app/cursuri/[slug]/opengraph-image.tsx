import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type CourseResponse = { data: { h1?: string | null; name: string; hook: string | null } };

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let title = "Curs video de informatică";
  let subtitle = "Zece la Info";
  try {
    const response = await apiFetch<CourseResponse>(`/api/courses/${encodeURIComponent(slug)}`);
    title = response.data.h1 || response.data.name;
    subtitle = response.data.hook || "Curs video de informatică — Zece la Info";
  } catch {
    /* fallback la titlul generic */
  }

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
        <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.85, display: "flex" }}>Zece la Info</div>
        <div style={{ fontSize: 58, fontWeight: 800, marginTop: 20, maxWidth: 1000, display: "flex" }}>{title}</div>
        <div style={{ fontSize: 28, marginTop: 24, maxWidth: 950, opacity: 0.9, display: "flex" }}>
          {subtitle.length > 140 ? `${subtitle.slice(0, 137)}...` : subtitle}
        </div>
      </div>
    ),
    { ...size },
  );
}
