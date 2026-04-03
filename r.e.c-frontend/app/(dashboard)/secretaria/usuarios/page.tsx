"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PageHero, DataTable, Chip } from "@/components/ui";
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

  const columns = useMemo(
    () => [
      {
        key: "nombre",
        header: "Nombre",
        render: (u: UserDTO) => <>{u.nombres} {u.apellidos}</>,
      },
      { key: "email", header: "Correo", render: (u: UserDTO) => u.email },
      { key: "role", header: "Rol", render: (u: UserDTO) => u.role },
      { key: "codigo", header: "Código", render: (u: UserDTO) => u.codigo },
      {
        key: "acciones",
        header: "Acciones",
        render: (u: UserDTO) => (
          <div className="sec-actions">
            <Link
              href={`/secretaria/usuarios/edit/${u.publicId}`}
              prefetch={false}
              className="inline-block"
            >
              <Button variant="secondary" size="sm">
                Editar
              </Button>
            </Link>
            <Link
              href={`/secretaria/usuarios/delete/${u.publicId}`}
              prefetch={false}
              className="inline-block"
            >
              <Button variant="danger" size="sm">
                Eliminar
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <section className="sec-page space-y-5">
      <PageHero
        title="Usuarios Institucionales"
        subtitle="Vista transversal para filtrar por rol, buscar usuarios y acceder a mantenimiento completo."
        chips={["Control global"]}
      />

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

      <DataTable<UserDTO>
        columns={columns}
        data={visible}
        isLoading={isLoading}
        emptyMessage="Sin resultados"
      />

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
