"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import EmailWithDomain from "@/components/ui/EmailWithDomain";
import { UserRole } from "@/types/user";
import { usersApi } from "@/lib/usersApi";
import { getErrorMessage } from "@/lib/errors";

function CrearUsuarioContent() {
  const router = useRouter();
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("ESTUDIANTE");
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{ codigo: string; nombres: string; apellidos: string } | null>(null);
  const [instDomain, setInstDomain] = useState<string | null>(null);

  useEffect(() => {
    api.get("/users/me").then((res) => {
      const dominio = res.data?.institution?.dominio;
      if (dominio) setInstDomain(dominio);
    }).catch(() => {});
  }, []);

  const search = useSearchParams();
  const roleParam = search.get("role");
  const lockedRole: UserRole | null =
    roleParam === "ESTUDIANTE" ||
    roleParam === "PROFESOR" ||
    roleParam === "SECRETARIA"
      ? roleParam
      : null;
  const role = lockedRole ?? selectedRole;
  const roleLocked = lockedRole !== null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombres.trim() || !apellidos.trim() || !email.trim()) {
      setError("Nombres, apellidos y email son obligatorios");
      return;
    }
    // SECRETARIA: contraseña requerida
    if (role === "SECRETARIA" && !password.trim()) {
      setError("La contraseña es obligatoria para secretaría");
      return;
    }
    try {
      const res = await usersApi.create({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        role,
      });
      setCreatedUser({ codigo: res.codigo, nombres: res.nombres, apellidos: res.apellidos });
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al crear usuario"));
    }
  };

  const handleClose = () => {
    const target = role === "ESTUDIANTE" ? "/secretaria/estudiantes" : role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
    router.push(target);
  };

  if (createdUser) {
    const usedPassword = password.trim() || createdUser.codigo;
    return (
      <section className="sec-page space-y-5">
        <div className="sec-hero">
          <div>
            <h2 className="sec-title">Usuario Creado</h2>
            <p className="sec-subtitle">El usuario ha sido registrado exitosamente.</p>
          </div>
          <span className="sec-chip sec-chip--success">✓ Creado</span>
        </div>
        <div className="sec-card p-6 max-w-xl space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{createdUser.nombres} {createdUser.apellidos}</strong> ya puede acceder a la plataforma con las siguientes credenciales:
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-sm"><strong>Código:</strong> <code className="rounded bg-white px-2 py-0.5 text-sm font-mono border">{createdUser.codigo}</code></p>
            <p className="text-sm"><strong>Contraseña inicial:</strong> <code className="rounded bg-white px-2 py-0.5 text-sm font-mono border">{usedPassword}</code></p>
            <p className="mt-2 text-xs text-amber-700">
              {password.trim()
                ? "Se usó la contraseña proporcionada."
                : "La contraseña inicial es el mismo código. El usuario debe cambiarla en su primer acceso desde \"¿Olvidaste tu contraseña?\"."}
            </p>
          </div>
          <Button onClick={handleClose}>Continuar</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Crear Usuario</h2>
          <p className="sec-subtitle">Registra usuarios con validaciones por rol para mantener consistencia institucional.</p>
        </div>
        <span className="sec-chip">Alta de usuario</span>
      </div>
      <form onSubmit={onSubmit} className="sec-card p-4 space-y-3 max-w-xl">
        <Input label="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
        <Input label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        <EmailWithDomain label="Correo" email={email} onEmailChange={setEmail} institutionDomain={instDomain} />
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
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            options={[
              { label: "Estudiante", value: "ESTUDIANTE" },
              { label: "Profesor", value: "PROFESOR" },
              { label: "Secretaría", value: "SECRETARIA" },
            ]}
          />
        )}
        {role === "SECRETARIA" && (
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
    <Suspense
      fallback={
        <section className="p-4">
          <h2 className="text-lg font-semibold">Cargando…</h2>
        </section>
      }
    >
      <CrearUsuarioContent />
    </Suspense>
  );
}