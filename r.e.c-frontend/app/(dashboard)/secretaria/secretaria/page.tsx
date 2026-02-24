"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type UserDTO } from "@/lib/usersApi";

export default function SecretariaPersonalPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    usersApi.list("SECRETARIA").then(setUsers);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [users, query]);

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Secretaría</h2>
          <Link href="/secretaria/usuarios/create?role=SECRETARIA" prefetch={false}>
          <Button>Crear usuario</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Buscar"
          placeholder="Nombre o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Correo</th>
              <th className="p-2 text-left">Documento</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-gray-200">
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.documento_identidad}</td>
                <td className="p-2 space-x-2">
                    <Link href={`/secretaria/usuarios/edit/${u.id}`} prefetch={false} className="inline-block">
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                    <Link href={`/secretaria/usuarios/delete/${u.id}`} prefetch={false} className="inline-block">
                    <Button variant="danger" size="sm">Eliminar</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td className="p-3 text-center" colSpan={4}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}