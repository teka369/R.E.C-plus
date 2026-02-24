export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

export const ROLES = {
  SECRETARIA: "SECRETARIA",
  PROFESOR: "PROFESOR",
  ESTUDIANTE: "ESTUDIANTE",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Dominio por defecto para correos institucionales (puede ser sobrescrito por localStorage)
export const DEFAULT_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "iejavieralondonobarriosevilla.edu.co";