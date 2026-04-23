"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usersApi } from "@/lib/usersApi";

type Role = "SUPER_ADMIN" | "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Usuario tal como viene de `POST /auth/login` (nombres/apellidos, sin `name`). */
export type LoginApiUser = {
  id: string;
  email: string;
  role: Role;
  nombres?: string;
  apellidos?: string;
};

function toAuthUser(u: AuthUser | LoginApiUser): AuthUser {
  const raw = u as AuthUser & LoginApiUser;
  const nameFromParts = [raw.nombres, raw.apellidos].filter(Boolean).join(" ").trim();
  const name = (typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name : nameFromParts) || "";
  return {
    id: String(raw.id),
    email: raw.email ?? "",
    name,
    role: raw.role,
  };
}

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser | LoginApiUser, token: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Hidratar estado de autenticación desde cookies (httpOnly) en el servidor
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data?.ok) {
          setToken((prev) => prev ?? "cookie");
          if (data?.userId && data?.role) {
            setUser((prev) => {
              if (prev) return prev;
              return {
                id: String(data.userId),
                role: data.role as Role,
                name: "",
                email: "",
              };
            });
          }
        } else {
          setUser(null);
          setToken(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        // noop
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Completar datos del usuario (name/email) tras hidratar sesión
  useEffect(() => {
    let abort = false;
    (async () => {
      if (!user || !token) return;
      const needsProfile = !user.name || !user.email;
      if (!needsProfile) return;
      try {
        const dto = await usersApi.me();
        if (abort) return;
        const name = [dto.nombres, dto.apellidos].filter(Boolean).join(" ").trim();
        const email = dto.email || user.email || "";
        setUser((prev) => (prev ? { ...prev, name, email } : prev));
      } catch {
        // Ignorar errores de perfil para no romper navegación
      }
    })();
    return () => {
      abort = true;
    };
  }, [user, token]);

  const login = async (u: AuthUser | LoginApiUser, t: string, refreshToken?: string) => {
    // Primero las cookies httpOnly: si setUser/setToken van antes, el effect de perfil
    // puede llamar a /api/rec antes de que exista rec_token → 401 → refresh → redirect.
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: t, refreshToken }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(
        typeof data?.message === "string" ? data.message : "No se pudo establecer la sesión",
      );
    }
    setUser(toAuthUser(u));
    setToken(t);
  };

  const logout = () => {
    const prevRole = user?.role;
    setUser(null);
    setToken(null);
    const target =
      prevRole === "SECRETARIA" || prevRole === "SUPER_ADMIN"
        ? "/acceso-secretaria"
        : "/login";
    // Borrar cookies y navegación completa para que el proxy aplique rutas públicas
    fetch("/api/auth/session", { method: "DELETE" })
      .catch(() => {})
      .finally(() => {
        if (typeof window !== "undefined") {
          window.location.assign(target);
        }
      });
  };

  const value: AuthContextType = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}