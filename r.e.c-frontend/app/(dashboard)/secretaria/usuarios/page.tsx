"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { UserRole } from "@/types/user";
import { usersApi, type UserDTO } from "@/lib/usersApi";

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "ALL">("ALL");

  useEffect(() => {
    usersApi.list(role === "ALL" ? undefined : role).then(setUsers);
  }, [role]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [users, query]);

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Usuarios Institucionales</h2>
          <p className="sec-subtitle">Vista transversal para filtrar por rol, buscar usuarios y acceder a mantenimiento completo.</p>
        </div>
        <span className="sec-chip">Control global</span>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/secretaria/usuarios/create" prefetch={false}>
          <Button>Crear usuario</Button>
        </Link>
      </div>

      <div className="sec-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Buscar"
          placeholder="Nombre o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Rol"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | "ALL")}
          options={[
            { label: "Todos", value: "ALL" },
            { label: "Estudiante", value: "ESTUDIANTE" },
            { label: "Profesor", value: "PROFESOR" },
              { label: "Secretaría", value: "SECRETARIA" },
          ]}
        />
      </div>

      <div className="overflow-x-auto sec-table">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Correo</th>
              <th className="p-2 text-left">Rol</th>
              <th className="p-2 text-left">Documento</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-gray-200">
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
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
                <td className="p-3 text-center" colSpan={5}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}