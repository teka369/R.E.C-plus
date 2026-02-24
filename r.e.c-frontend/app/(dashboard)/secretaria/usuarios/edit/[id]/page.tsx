"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { UserRole } from "@/types/user";
import { usersApi, type UserDTO } from "@/lib/usersApi";

export default function EditUsuarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [role, setRole] = useState<UserRole>("ESTUDIANTE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idNum = Number(id);
    usersApi.get(idNum).then((u) => {
      setUser(u);
      if (u) {
        setNombres(u.nombres);
        setApellidos(u.apellidos);
        setEmail(u.email);
        setDocumento(u.documento_identidad);
        setTelefono(u.telefono || "");
        setRole(u.role);
      }
    });
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !documento.trim()) {
      setError("Nombres, apellidos, email y documento son obligatorios");
      return;
    }
    const idNum = Number(id);
    try {
      await usersApi.update(idNum, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        documento_identidad: documento.trim(),
        telefono: telefono.trim() || undefined,
        role,
      });
      const target = role === "ESTUDIANTE" ? "/secretaria/estudiantes" : role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
      router.push(target);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al actualizar usuario");
    }
  };

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Editar usuario #{id}</h2>
      {!user ? (
        <p className="text-sm text-gray-600">Usuario no encontrado.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 max-w-md">
          <Input label="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
          <Input label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Documento de identidad" value={documento} onChange={(e) => setDocumento(e.target.value)} />
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
          {role === "PROFESOR" && (
            <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          )}
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