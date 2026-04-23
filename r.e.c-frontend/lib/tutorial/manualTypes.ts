export type ManualBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; title?: string; text: string }
  | { type: "note"; text: string };

export type ManualChapter = {
  id: string;
  title: string;
  subtitle?: string;
  /** Ruta principal en la app, si aplica */
  route?: string;
  blocks: ManualBlock[];
};

export type ManualFaq = { id: string; question: string; answer: string };
