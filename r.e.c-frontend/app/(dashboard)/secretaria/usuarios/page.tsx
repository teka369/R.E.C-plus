"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { UserRole } from "@/types/user";
import { type UserDTO } from "@/lib/usersApi";
import { usePaginatedApi } from "@/hooks/useApi";

export default function UsuariosPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = usePaginatedApi<UserDTO>("/users", page, 20);

  const meta = result?.meta;

  const visible = useMemo(() => {
    const items = result?.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q),
    );
  }, [result?.data, query]);

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Usuarios Institucionales</h2>
          <p className="sec-subtitle">
            Vista transversal para filtrar por rol, buscar usuarios y acceder a
            mantenimiento completo.
          </p>
        </div>
        <span className="sec-chip">Control global</span>
      </div>

      <div className="sec-toolbar">
        <div className="sec-toolbar-group">
          <Link href="/secretaria/usuarios/create" prefetch={false}>
            <Button>Crear usuario</Button>
          </Link>
        </div>
        <span className="sec-muted">
          {meta ? `${meta.total} usuarios` : "Gestion centralizada de cuentas por rol"}
        </span>
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
          onChange={(e) => {
            setRole(e.target.value as UserRole | "ALL");
            setPage(1);
          }}
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
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-3 text-center" colSpan={5}>
                  Cargando...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td className="p-3 text-center" colSpan={5}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              visible.map((u) => (
                <tr key={u.id} className="border-t border-gray-200">
                  <td className="p-2">
                    {u.nombres} {u.apellidos}
                  </td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.codigo}</td>
                  <td className="p-2 sec-actions">
                    <Link
                      href={`/secretaria/usuarios/edit/${u.id}`}
                      prefetch={false}
                      className="inline-block"
                    >
                      <Button variant="secondary" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Link
                      href={`/secretaria/usuarios/delete/${u.id}`}
                      prefetch={false}
                      className="inline-block"
                    >
                      <Button variant="danger" size="sm">
                        Eliminar
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </section>
  );
}
