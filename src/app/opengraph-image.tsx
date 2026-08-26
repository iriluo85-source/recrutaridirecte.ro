import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Recrutare Directă";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #04231a 0%, #065f46 55%, #0f172a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 700,
            }}
          >
            RD
          </div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>Recrutare Directă</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 62, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Angajatorii caută direct candidații potriviți
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#a7f3d0" }}>
          Fără intermediari · Fără anunțuri · Contact direct
        </div>
      </div>
    ),
    { ...size }
  );
}
