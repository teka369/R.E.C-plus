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
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Personal de Secretaría</h2>
          <p className="sec-subtitle">Gestiona el equipo administrativo, con búsqueda rápida y acceso directo a edición y eliminación.</p>
        </div>
        <span className="sec-chip">Gestión administrativa</span>
      </div>

      <div className="sec-toolbar">
        <div className="sec-toolbar-group">
          <Link href="/secretaria/usuarios/create?role=SECRETARIA" prefetch={false}>
            <Button>Crear usuario</Button>
          </Link>
        </div>
        <span className="sec-muted">Equipo administrativo con acceso directo a mantenimiento</span>
      </div>

      <div className="sec-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Buscar"
          placeholder="Nombre o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto sec-table">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Correo</th>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-gray-200">
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.codigo}</td>
                <td className="p-2 sec-actions">
                    <Link href={`/secretaria/usuarios/edit/${u.publicId}`} prefetch={false} className="inline-block">
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                    <Link href={`/secretaria/usuarios/delete/${u.publicId}`} prefetch={false} className="inline-block">
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