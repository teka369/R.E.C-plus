"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import Select from "@/components/ui/Select";
import { academicApi } from "@/lib/academicApi";

export default function SecretariaEstudiantesPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<{ id: number; label: string }[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [assignStatus, setAssignStatus] = useState<Record<number, "idle" | "loading" | "ok" | "error">>({});
  const [currentGroup, setCurrentGroup] = useState<Record<number, { label: string } | null>>({});

  useEffect(() => {
    usersApi.list("ESTUDIANTE").then(setUsers);
    academicApi.listGroups().then((gs) => setGroups(gs.map((g) => ({ id: g.id, label: `${g.grade?.nombre ?? g.gradeId}-${g.nombre}` }))));
  }, []);

  useEffect(() => {
    if (users.length === 0) return;
    (async () => {
      const map: Record<number, { label: string } | null> = {};
      for (const u of users) {
        try {
          const sg = await academicApi.getStudentGroup(Number(u.id));
          if (sg?.group) {
            const label = `${sg.group.grade?.nombre ?? sg.group.grade?.id ?? ""}-${sg.group.nombre}`;
            map[u.id] = { label };
          } else {
            map[u.id] = null;
          }
        } catch {
          map[u.id] = null;
        }
      }
      setCurrentGroup(map);
    })();
  }, [users]);

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
        <h2 className="text-lg font-semibold">Estudiantes</h2>
          <Link href="/secretaria/usuarios/create?role=ESTUDIANTE" prefetch={false}>
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
              <th className="p-2 text-left">Asignar a Grupo</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-gray-200">
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.documento_identidad}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Select
                      options={[{ label: "Seleccione grupo", value: "" }, ...groups.map((g) => ({ label: g.label, value: String(g.id) }))]}
                      value={assignments[u.id] || ""}
                      onChange={(e) => setAssignments((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      disabled={Boolean(currentGroup[u.id])}
                    />
                    <Button
                      size="sm"
                      disabled={Boolean(currentGroup[u.id]) || !assignments[u.id] || assignStatus[u.id] === "loading"}
                      onClick={async () => {
                        const gid = Number(assignments[u.id]);
                        if (!gid) return;
                        try {
                          setAssignStatus((s) => ({ ...s, [u.id]: "loading" }));
                          await academicApi.assignStudentToGroup(Number(u.id), gid);
                          setAssignStatus((s) => ({ ...s, [u.id]: "ok" }));
                          const grpLabel = groups.find((g) => g.id === gid)?.label || "";
                          setCurrentGroup((m) => ({ ...m, [u.id]: { label: grpLabel } }));
                          setAssignments((prev) => ({ ...prev, [u.id]: "" }));
                        } catch {
                          setAssignStatus((s) => ({ ...s, [u.id]: "error" }));
                        }
                      }}
                    >Asignar</Button>
                    {assignStatus[u.id] === "ok" && <span className="text-xs text-green-600">Asignado</span>}
                    {assignStatus[u.id] === "error" && <span className="text-xs text-red-600">Error</span>}
                    {currentGroup[u.id] && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-700">Grupo actual: {currentGroup[u.id]?.label}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            try {
                              await academicApi.deleteStudentGroup(Number(u.id));
                              setCurrentGroup((m) => ({ ...m, [u.id]: null }));
                            } catch {}
                          }}
                        >Quitar asignación</Button>
                      </div>
                    )}
                  </div>
                </td>
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