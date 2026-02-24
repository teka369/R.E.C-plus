"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import EmailWithDomain from "@/components/ui/EmailWithDomain";
import { UserRole } from "@/types/user";
import { usersApi } from "@/lib/usersApi";

function CrearUsuarioContent() {
  const router = useRouter();
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ESTUDIANTE");
  const [roleLocked, setRoleLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useSearchParams();
  useEffect(() => {
    const r = search.get("role");
    if (r === "ESTUDIANTE" || r === "PROFESOR" || r === "SECRETARIA") {
      setRole(r as UserRole);
      setRoleLocked(true);
    }
  }, [search]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !documento.trim()) {
      setError("Nombres, apellidos, email y documento son obligatorios");
      return;
    }
    // Validaciones según backend:
    // PROFESOR: teléfono y contraseña requeridos
    if (role === "PROFESOR" && (!telefono.trim() || !password.trim())) {
      setError("Teléfono y contraseña son obligatorios para profesores");
      return;
    }
    // SECRETARIA: contraseña requerida
    if (role === "SECRETARIA" && !password.trim()) {
      setError("La contraseña es obligatoria para secretaría");
      return;
    }
    try {
      await usersApi.create({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        documento_identidad: documento.trim(),
        telefono: telefono.trim() || undefined,
        password: password.trim() || undefined,
        role,
      });
      const target = role === "ESTUDIANTE" ? "/secretaria/estudiantes" : role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
      router.push(target);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al crear usuario");
    }
  };

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Crear usuario</h2>
      <form onSubmit={onSubmit} className="space-y-3 max-w-md">
        <Input label="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
        <Input label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        <EmailWithDomain label="Correo" email={email} onEmailChange={setEmail} />
        <Input label="Documento de identidad" value={documento} onChange={(e) => setDocumento(e.target.value)} />
        {roleLocked ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Rol</label>
            <div className="rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm">
              {role === "ESTUDIANTE" ? "Estudiante" : role === "PROFESOR" ? "Profesor" : "Secretaría"}
            </div>
          </div>
        ) : (
          <Select
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { label: "Estudiante", value: "ESTUDIANTE" },
              { label: "Profesor", value: "PROFESOR" },
              { label: "Secretaría", value: "SECRETARIA" },
            ]}
          />
        )}
        {role === "PROFESOR" && (
          <>
            <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </>
        )}
        {(role === "PROFESOR" || role === "SECRETARIA") && (
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit">Guardar</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const target = role === "ESTUDIANTE" ? "/secretaria/estudiantes" : role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
              router.push(target);
            }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}

export default function CrearUsuarioPage() {
  // Envolver el uso de useSearchParams en un límite de Suspense para evitar CSR bailouts
  return (
    <Suspense fallback={<section className="p-4"><h2 className="text-lg font-semibold">Cargando…</h2></section>}>
      <CrearUsuarioContent />
    </Suspense>
  );
}