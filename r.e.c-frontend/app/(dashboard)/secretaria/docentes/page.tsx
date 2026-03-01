"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import Select from "@/components/ui/Select";
import { academicApi } from "@/lib/academicApi";

export default function SecretariaDocentesPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<{ id: number; label: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; nombre: string }[]>([]);
  const [assignments, setAssignments] = useState<Record<number, { groupId?: string; subjectId?: string }>>({});
  const [assignStatus, setAssignStatus] = useState<Record<number, "idle" | "loading" | "ok" | "error">>({});
  const [teacherAssignmentsMap, setTeacherAssignmentsMap] = useState<Record<number, { loaded: boolean; items: { id: number; groupLabel: string; subjectName: string }[]; expanded?: boolean }>>({});

  useEffect(() => {
    usersApi.list("PROFESOR").then(setUsers);
    academicApi.listGroups().then((gs) => setGroups(gs.map((g) => ({ id: g.id, label: `${g.grade?.nombre ?? g.gradeId}-${g.nombre}` }))));
    academicApi.listSubjects().then((ss) => setSubjects(ss.map((s) => ({ id: s.id, nombre: s.nombre }))));
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
        <h2 className="text-lg font-semibold">Docentes</h2>
        <div className="flex items-center gap-2">
        <Link href="/secretaria/usuarios/create?role=PROFESOR" prefetch={false}>
            <Button>Crear usuario</Button>
          </Link>
        <Link href="/secretaria/registro-masivo" prefetch={false}>
            <Button variant="secondary">Registro masivo</Button>
          </Link>
        </div>
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
              <th className="p-2 text-left">Grupo</th>
              <th className="p-2 text-left">Materia</th>
              <th className="p-2 text-left">Asignar</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <React.Fragment key={u.id}>
              <tr className="border-t border-gray-200">
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.documento_identidad}</td>
                <td className="p-2">
                  <Select
                    options={[{ label: "Seleccione grupo", value: "" }, ...groups.map((g) => ({ label: g.label, value: String(g.id) }))]}
                    value={assignments[u.id]?.groupId || ""}
                    onChange={(e) => setAssignments((prev) => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), groupId: e.target.value } }))}
                  />
                </td>
                <td className="p-2">
                  <Select
                    options={[{ label: "Seleccione materia", value: "" }, ...subjects.map((s) => ({ label: s.nombre, value: String(s.id) }))]}
                    value={assignments[u.id]?.subjectId || ""}
                    onChange={(e) => setAssignments((prev) => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), subjectId: e.target.value } }))}
                  />
                </td>
                <td className="p-2">
                  <Button
                    size="sm"
                    disabled={!assignments[u.id]?.groupId || !assignments[u.id]?.subjectId || assignStatus[u.id] === "loading"}
                    onClick={async () => {
                      const gid = Number(assignments[u.id]?.groupId);
                      const sid = Number(assignments[u.id]?.subjectId);
                      if (!gid || !sid) return;
                      try {
                        setAssignStatus((s) => ({ ...s, [u.id]: "loading" }));
                        const created = await academicApi.assignTeacher(Number(u.id), gid, sid);
                        // Actualizar vista en tiempo real si las asignaciones están cargadas
                        const groupLabel = groups.find((g) => g.id === gid)?.label ?? String(gid);
                        const subjectName = subjects.find((s) => s.id === sid)?.nombre ?? String(sid);
                        setTeacherAssignmentsMap((m) => {
                          const current = m[u.id];
                          const newItem = { id: created.id, groupLabel, subjectName };
                          if (current?.loaded) {
                            return { ...m, [u.id]: { ...current, items: [...current.items, newItem] } };
                          }
                          // Si no está cargado, preparar una lista con el nuevo elemento y expandir
                          return { ...m, [u.id]: { loaded: true, items: [newItem], expanded: true } };
                        });
                        // Limpiar selección para evitar reasignaciones accidentales
                        setAssignments((prev) => ({ ...prev, [u.id]: { groupId: "", subjectId: "" } }));
                        setAssignStatus((s) => ({ ...s, [u.id]: "ok" }));
                      } catch {
                        setAssignStatus((s) => ({ ...s, [u.id]: "error" }));
                      }
                    }}
                  >Asignar</Button>
                  {assignStatus[u.id] === "ok" && <span className="ml-2 text-xs text-green-600">Asignado</span>}
                  {assignStatus[u.id] === "error" && <span className="ml-2 text-xs text-red-600">Error</span>}
                </td>
                <td className="p-2 space-x-2">
                    <Link href={`/secretaria/usuarios/edit/${u.id}`} prefetch={false} className="inline-block">
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                    <Link href={`/secretaria/usuarios/delete/${u.id}`} prefetch={false} className="inline-block">
                    <Button variant="danger" size="sm">Eliminar</Button>
                  </Link>
                  <Button
                    className="inline-block"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      setTeacherAssignmentsMap((m) => ({ ...m, [u.id]: { ...(m[u.id] || { loaded: false, items: [] }), expanded: !(m[u.id]?.expanded) } }));
                      if (!teacherAssignmentsMap[u.id]?.loaded) {
                        const list = await academicApi.listTeacherAssignments(Number(u.id));
                        const items = list.map((a) => ({ id: a.id, groupLabel: `${a.group.grade?.nombre}-${a.group.nombre}`, subjectName: a.subject.nombre }));
                        setTeacherAssignmentsMap((m) => ({ ...m, [u.id]: { loaded: true, items, expanded: true } }));
                      }
                    }}
                  >Ver asignaciones</Button>
                </td>
              </tr>
              {teacherAssignmentsMap[u.id]?.expanded && (
                <tr className="border-t border-gray-200">
                  <td className="p-2 bg-gray-50" colSpan={7}>
                    <div className="text-sm">
                      <div className="font-medium mb-2">Asignaciones de {u.nombres} {u.apellidos}</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Grupo</th>
                              <th className="p-2 text-left">Materia</th>
                              <th className="p-2 text-left">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherAssignmentsMap[u.id]?.items.map((it) => (
                              <tr key={it.id} className="border-t border-gray-200">
                                <td className="p-2">{it.groupLabel}</td>
                                <td className="p-2">{it.subjectName}</td>
                                <td className="p-2">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                      await academicApi.deleteTeacherAssignment(it.id);
                                      setTeacherAssignmentsMap((m) => ({
                                        ...m,
                                        [u.id]: { ...m[u.id]!, items: m[u.id]!.items.filter((x) => x.id !== it.id) }
                                      }));
                                    }}
                                  >Eliminar</Button>
                                </td>
                              </tr>
                            ))}
                            {(!teacherAssignmentsMap[u.id] || teacherAssignmentsMap[u.id]?.items.length === 0) && (
                              <tr><td className="p-2 text-center" colSpan={3}>Sin asignaciones</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
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