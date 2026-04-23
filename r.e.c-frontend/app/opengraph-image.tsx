import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Recedu — Plataforma de Gestión Académica para Colegios en Colombia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #289a4e 0%, #32a656 50%, #38ad44 100%)",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Glassmorphism circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-60px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "140px",
            left: "200px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
          }}
        />

        {/* Glass card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 64px",
            borderRadius: "32px",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.25)",
            maxWidth: "900px",
          }}
        >
          {/* Logo text */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              R
            </div>
            <span
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              Recedu
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.95)",
              textAlign: "center",
              lineHeight: 1.3,
              margin: "8px 0 0 0",
            }}
          >
            Gestión Académica Inteligente
          </p>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "18px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.75)",
              textAlign: "center",
              lineHeight: 1.5,
              margin: "16px 0 0 0",
              maxWidth: "600px",
            }}
          >
            Notas, recuperaciones, horarios y materiales en una sola plataforma.
            Diseñada para colegios colombianos.
          </p>
        </div>

        {/* Footer URL */}
        <p
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.08em",
          }}
        >
          recedu.co
        </p>
      </div>
    ),
    { ...size }
  );
}
