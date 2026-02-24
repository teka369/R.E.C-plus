"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { usersApi, type UserDTO } from "@/lib/usersApi";

export default function DeleteUsuarioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idNum = Number(id);
    if (Number.isNaN(idNum)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }
    usersApi
      .get(idNum)
      .then((u) => setUser(u))
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Error al cargar usuario");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onDelete = async () => {
    const idNum = Number(id);
    try {
      await usersApi.remove(idNum);
      const target = user?.role === "ESTUDIANTE" ? "/secretaria/estudiantes" : user?.role === "PROFESOR" ? "/secretaria/docentes" : "/secretaria/secretaria";
      router.push(target);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al eliminar usuario");
    }
  };

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Eliminar usuario #{id}</h2>
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