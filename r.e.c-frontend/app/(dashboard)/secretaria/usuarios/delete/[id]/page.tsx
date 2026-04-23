"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import { getErrorMessage } from "@/lib/errors";

export default function DeleteUsuarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    usersApi
      .get(id)
      .then((u) => setUser(u))
      .catch((error: unknown) => {
        setError(getErrorMessage(error, "Error al cargar usuario"));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onDelete = async () => {
    try {
      await usersApi.remove(id);
      const target = user?.role === "ESTUDIANTE" ? "/secretaria/estudiantes" : user?.role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
      router.push(target);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al eliminar usuario"));
    }
  };

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Eliminar Usuario #{id}</h2>
          <p className="sec-subtitle">Confirmación segura para evitar eliminaciones accidentales de cuentas institucionales.</p>
        </div>
        <span className="sec-chip">Acción crítica</span>
      </div>
      {loading && <p className="text-sm text-rec-text-muted">Cargando usuario...</p>}
      {error && <p className="text-sm text-rec-danger-text">{error}</p>}
      {!loading && !error && !user ? (
        <p className="sec-muted">Usuario no encontrado.</p>
      ) : !loading && user ? (
        <div className="sec-card p-4 space-y-3 max-w-xl">
          <p className="text-sm text-rec-text-secondary">
            ¿Seguro que deseas eliminar a <span className="font-medium">{user.nombres} {user.apellidos}</span> ({user.email})?
          </p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={onDelete}>Eliminar</Button>
            <Button
              variant="secondary"
              onClick={() => {
                const target = user?.role === "ESTUDIANTE" ? "/secretaria/estudiantes" : user?.role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
                router.push(target);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}