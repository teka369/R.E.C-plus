import OGImage from "./opengraph-image";

export const runtime = "edge";
export const alt =
  "Recedu — Plataforma de Gestión Académica para Colegios en Colombia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return OGImage();
}
