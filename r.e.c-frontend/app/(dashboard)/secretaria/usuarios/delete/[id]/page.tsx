"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import { getErrorMessage } from "@/lib/errors";

export default function DeleteUsuarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const idNum = Number(id);
  const invalidId = Number.isNaN(idNum);
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidId) return;

    usersApi
      .get(idNum)
      .then((u) => setUser(u))
      .catch((error: unknown) => {
        setError(getErrorMessage(error, "Error al cargar usuario"));
      })
      .finally(() => setLoading(false));
  }, [idNum, invalidId]);

  const onDelete = async () => {
    try {
      await usersApi.remove(idNum);
      const target = user?.role === "ESTUDIANTE" ? "/secretaria/estudiantes" : user?.role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
      router.push(target);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al eliminar usuario"));
    }
  };

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Eliminar usuario #{id}</h2>
      {invalidId && <p className="text-sm text-red-600">ID inválido</p>}
      {loading && <p className="text-sm text-gray-600">Cargando usuario...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && !user ? (
        <p className="text-sm text-gray-600">Usuario no encontrado.</p>
      ) : !loading && user ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
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