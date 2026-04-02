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

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string, refreshToken?: string) => Promise<void>;
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
      const idNum = Number(user.id);
      if (!Number.isFinite(idNum)) return;
      try {
        const dto = await usersApi.get(idNum);
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

  const login = async (u: AuthUser, t: string, refreshToken?: string) => {
    setUser(u);
    setToken(t);
    // Cookies HttpOnly vía API (JWT validado en servidor; proxy usa rec_token)
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, refreshToken }),
      });
    } catch {
      // Ignorar errores de red; el proxy depende de cookies, pero el contexto mantiene estado en memoria para esta sesión
    }
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