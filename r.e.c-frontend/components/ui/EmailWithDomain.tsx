"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DEFAULT_EMAIL_DOMAIN } from "@/lib/constants";

type Props = {
  label?: string;
  email: string;
  onEmailChange: (value: string) => void;
  persistKey?: string; // localStorage key para el dominio
};

export default function EmailWithDomain({ label = "Correo", email, onEmailChange, persistKey = "rec_email_domain" }: Props) {
  const [domain, setDomain] = useState<string>("");
  const [localPart, setLocalPart] = useState<string>("");

  // Cargar dominio persistido o el por defecto
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(persistKey);
      setDomain((saved && saved.trim()) || DEFAULT_EMAIL_DOMAIN);
    } catch {
      setDomain(DEFAULT_EMAIL_DOMAIN);
    }
  }, [persistKey]);

  // Sincronizar localPart desde email completo
  useEffect(() => {
    const [local, dom] = email.split("@");
    setLocalPart(local || "");
    if (dom && !domain) setDomain(dom);
  }, [email]);

  // Construir email completo cada vez que cambian las partes
  useEffect(() => {
    const sanitizedLocal = localPart.replace(/\s+/g, "").replace(/@+/g, "");
    const sanitizedDomain = domain.replace(/^@+/, "").trim();
    const full = sanitizedDomain ? `${sanitizedLocal}@${sanitizedDomain}` : sanitizedLocal;
    onEmailChange(full);
  }, [localPart, domain, onEmailChange]);

  const domainDisplay = useMemo(() => (domain ? `@${domain.replace(/^@+/, "")}` : ""), [domain]);

  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm text-gray-700">{label}</label> : null}
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          inputMode="email"
          placeholder="usuario"
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black flex-1"
          value={localPart}
          onChange={(e) => setLocalPart(e.target.value)}
        />
        <div className="flex items-center">
          <span className="text-sm text-gray-700 px-2">@</span>
          <input
            type="text"
            placeholder="dominio"
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            value={domain.replace(/^@+/, "")}
            onChange={(e) => {
              const next = e.target.value.replace(/^@+/, "");
              setDomain(next);
              try {
                window.localStorage.setItem(persistKey, next);
              } catch {}
            }}
          />
        </div>
      </div>
      <p className="text-xs text-gray-600">Se guardará como: <span className="font-mono">{localPart.replace(/\s+/g, "").replace(/@+/g, "")}{domainDisplay}</span></p>
      <p className="text-xs text-gray-500">El dominio se guarda y reutiliza automáticamente en esta sección.</p>
    </div>
  );
}