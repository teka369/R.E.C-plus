"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { UserRole } from "@/types/user";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import { getErrorMessage } from "@/lib/errors";

export default function EditUsuarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ESTUDIANTE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    usersApi.get(id).then((u) => {
      setUser(u);
      if (u) {
        setNombres(u.nombres);
        setApellidos(u.apellidos);
        setEmail(u.email);
        setRole(u.role);
      }
    });
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombres.trim() || !apellidos.trim() || !email.trim()) {
      setError("Nombres, apellidos y email son obligatorios");
      return;
    }
    try {
      await usersApi.update(id, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        role,
      });
      const target = role === "ESTUDIANTE" ? "/secretaria/estudiantes" : role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
      router.push(target);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al actualizar usuario"));
    }
  };

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Editar Usuario #{id}</h2>
          <p className="sec-subtitle">Actualiza datos personales y rol manteniendo integridad de información.</p>
        </div>
        <span className="sec-chip">Edición</span>
      </div>
      {!user ? (
        <p className="sec-muted">Usuario no encontrado.</p>
      ) : (
        <form onSubmit={onSubmit} className="sec-card p-4 space-y-3 max-w-xl">
          <Input label="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
          <Input label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { label: "Estudiante", value: "ESTUDIANTE" },
              { label: "Secretaría", value: "SECRETARIA" },
              { label: "Profesor", value: "PROFESOR" },
            ]}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit">Guardar cambios</Button>
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
      )}
    </section>
  );
}