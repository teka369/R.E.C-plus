export type UserRole = "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";

// Modelo simple usado en AuthContext
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};