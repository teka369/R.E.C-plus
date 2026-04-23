/** Convierte enlaces típicos de YouTube a URL de embed; devuelve la URL original si no aplica. */
export function toTutorialEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
    if (host.includes("youtube.com") && u.pathname.startsWith("/embed/")) {
      return trimmed;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}
