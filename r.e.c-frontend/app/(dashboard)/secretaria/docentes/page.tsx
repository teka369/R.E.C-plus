"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import Select from "@/components/ui/Select";
import { academicApi } from "@/lib/academicApi";

type AssignStatus = "idle" | "loading" | "ok" | "error";

type TeacherAssignmentItem = {
  id: number;
  groupId: number;
  subjectId: number;
  groupLabel: string;
  subjectName: string;
};

type TeacherAssignmentsState = {
  loaded: boolean;
  loading: boolean;
  expanded: boolean;
  items: TeacherAssignmentItem[];
};

type GroupSubjectsState = {
  loading: boolean;
  loaded: boolean;
  options: { id: number; nombre: string }[];
};

export default function SecretariaDocentesPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<{ id: number; label: string }[]>([]);
  const [assignments, setAssignments] = useState<Record<number, { groupId?: string; subjectId?: string }>>({});
  const [assignStatus, setAssignStatus] = useState<Record<number, AssignStatus>>({});
  const [teacherAssignmentsMap, setTeacherAssignmentsMap] = useState<Record<number, TeacherAssignmentsState>>({});
  const [groupSubjectsMap, setGroupSubjectsMap] = useState<Record<number, GroupSubjectsState>>({});
  const [selectedTeachers, setSelectedTeachers] = useState<Record<number, boolean>>({});
  const [bulkAssignment, setBulkAssignment] = useState<{ groupId: string; subjectId: string }>({ groupId: "", subjectId: "" });
  const [bulkStatus, setBulkStatus] = useState<{ loading: boolean; message?: string; tone?: "ok" | "error" }>({ loading: false });

  useEffect(() => {
    usersApi.list("PROFESOR").then(setUsers);
    academicApi.listGroups().then((gs) => setGroups(gs.map((g) => ({ id: g.id, label: `${g.grade?.nombre ?? g.gradeId}-${g.nombre}` }))));
  }, []);

  async function ensureGroupSubjects(groupId: number) {
    if (!groupId) return;
    const cached = groupSubjectsMap[groupId];
    if (cached?.loaded || cached?.loading) return;

    setGroupSubjectsMap((prev) => ({
      ...prev,
      [groupId]: { loading: true, loaded: false, options: prev[groupId]?.options ?? [] },
    }));

    try {
      const list = await academicApi.listGroupSubjects(groupId);
      const options = list.map((item) => ({ id: item.subject.id, nombre: item.subject.nombre }));
      setGroupSubjectsMap((prev) => ({
        ...prev,
        [groupId]: { loading: false, loaded: true, options },
      }));
    } catch {
      setGroupSubjectsMap((prev) => ({
        ...prev,
        [groupId]: { loading: false, loaded: false, options: prev[groupId]?.options ?? [] },
      }));
    }
  }

  async function loadTeacherAssignments(teacherId: number, expandAfterLoad = false): Promise<TeacherAssignmentItem[]> {
    setTeacherAssignmentsMap((prev) => ({
      ...prev,
      [teacherId]: {
        loaded: prev[teacherId]?.loaded ?? false,
        loading: true,
        expanded: expandAfterLoad ? true : (prev[teacherId]?.expanded ?? false),
        items: prev[teacherId]?.items ?? [],
      },
    }));

    try {
      const list = await academicApi.listTeacherAssignments(teacherId);
      const items = list.map((a) => ({
        id: a.id,
        groupId: a.group.id,
        subjectId: a.subject.id,
        groupLabel: `${a.group.grade?.nombre}-${a.group.nombre}`,
        subjectName: a.subject.nombre,
      }));

      setTeacherAssignmentsMap((prev) => ({
        ...prev,
        [teacherId]: {
          loaded: true,
          loading: false,
          expanded: expandAfterLoad ? true : (prev[teacherId]?.expanded ?? false),
          items,
        },
      }));

      return items;
    } catch {
      setTeacherAssignmentsMap((prev) => ({
        ...prev,
        [teacherId]: {
          loaded: prev[teacherId]?.loaded ?? false,
          loading: false,
          expanded: prev[teacherId]?.expanded ?? false,
          items: prev[teacherId]?.items ?? [],
        },
      }));
      return [];
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [users, query]);

  const selectedVisibleTeacherIds = useMemo(
    () => visible.filter((u) => selectedTeachers[u.id]).map((u) => u.id),
    [visible, selectedTeachers],
  );

  const bulkGroupId = Number(bulkAssignment.groupId || 0);
  const bulkSubjectOptions = bulkGroupId ? (groupSubjectsMap[bulkGroupId]?.options ?? []) : [];

  async function runBulkTeacherAssignment() {
    const groupId = Number(bulkAssignment.groupId);
    const subjectId = Number(bulkAssignment.subjectId);
    if (!groupId || !subjectId || selectedVisibleTeacherIds.length === 0) return;

    const groupLabel = groups.find((g) => g.id === groupId)?.label ?? String(groupId);
    const subjectName = bulkSubjectOptions.find((s) => s.id === subjectId)?.nombre ?? String(subjectId);
    let assigned = 0;
    let failed = 0;

    setBulkStatus({ loading: true });
    setAssignStatus((prev) => {
      const next = { ...prev };
      for (const id of selectedVisibleTeacherIds) next[id] = "loading";
      return next;
    });

    const results = await Promise.allSettled(
      selectedVisibleTeacherIds.map(async (teacherId) => {
        const created = await academicApi.assignTeacher(teacherId, groupId, subjectId);
        return { teacherId, assignmentId: created.id };
      }),
    );

    const nextStatus: Record<number, AssignStatus> = {};
    const updates: Record<number, TeacherAssignmentsState> = {};

    for (let i = 0; i < results.length; i += 1) {
      const result = results[i];
      const teacherId = selectedVisibleTeacherIds[i];

      if (result.status === "fulfilled") {
        assigned += 1;
        nextStatus[teacherId] = "ok";
        const prevState = teacherAssignmentsMap[teacherId];
        if (prevState?.loaded) {
          updates[teacherId] = {
            ...prevState,
            items: [
              ...prevState.items,
              {
                id: result.value.assignmentId,
                groupId,
                subjectId,
                groupLabel,
                subjectName,
              },
            ],
          };
        }
      } else {
        failed += 1;
        nextStatus[teacherId] = "error";
      }
    }

    setAssignStatus((prev) => ({ ...prev, ...nextStatus }));
    if (Object.keys(updates).length > 0) {
      setTeacherAssignmentsMap((prev) => ({ ...prev, ...updates }));
    }

    setAssignments((prev) => {
      const next = { ...prev };
      for (const id of selectedVisibleTeacherIds) {
        next[id] = { groupId: "", subjectId: "" };
      }
      return next;
    });
    setSelectedTeachers({});
    setBulkStatus({
      loading: false,
      tone: failed > 0 ? "error" : "ok",
      message: `Asignados: ${assigned}. Fallidos: ${failed}.`,
    });
  }

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Gestión de Docentes</h2>
          <p className="sec-subtitle">Controla asignaciones por grupo y materia, con carga inteligente y operaciones masivas seguras.</p>
        </div>
        <span className="sec-chip">Asignación docente</span>
      </div>

      <div className="sec-toolbar">
        <div className="sec-toolbar-group">
          <Link href="/secretaria/usuarios/create?role=PROFESOR" prefetch={false}>
            <Button>Crear usuario</Button>
          </Link>
          <Link href="/secretaria/registro-masivo" prefetch={false}>
            <Button variant="secondary">Registro masivo</Button>
          </Link>
        </div>
        <span className="sec-muted">Asignaciones por grupo y materia en una sola vista</span>
      </div>

      <div className="sec-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Buscar"
          placeholder="Nombre o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="sec-card p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Asignacion rapida masiva</span>
          <span className="text-xs text-gray-600">{selectedVisibleTeacherIds.length} seleccionados en esta vista</span>
        </div>
        <div className="sec-action-cluster">
          <div className="min-w-[220px]">
            <Select
              label="Grupo"
              options={[{ label: "Seleccione grupo", value: "" }, ...groups.map((g) => ({ label: g.label, value: String(g.id) }))]}
              value={bulkAssignment.groupId}
              onChange={(e) => {
                const nextGroupId = e.target.value;
                setBulkAssignment({ groupId: nextGroupId, subjectId: "" });
                if (nextGroupId) {
                  void ensureGroupSubjects(Number(nextGroupId));
                }
              }}
              disabled={bulkStatus.loading}
            />
          </div>
          <div className="min-w-[220px]">
            <Select
              label="Materia"
              options={[
                { label: bulkAssignment.groupId ? "Seleccione materia" : "Seleccione un grupo primero", value: "" },
                ...bulkSubjectOptions.map((s) => ({ label: s.nombre, value: String(s.id) })),
              ]}
              value={bulkAssignment.subjectId}
              onChange={(e) => setBulkAssignment((prev) => ({ ...prev, subjectId: e.target.value }))}
              disabled={!bulkAssignment.groupId || bulkStatus.loading || Boolean(groupSubjectsMap[bulkGroupId]?.loading)}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedTeachers((prev) => {
                const next = { ...prev };
                for (const u of visible) next[u.id] = true;
                return next;
              });
            }}
            disabled={visible.length === 0 || bulkStatus.loading}
          >Seleccionar visibles</Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedTeachers({})}
            disabled={selectedVisibleTeacherIds.length === 0 || bulkStatus.loading}
          >Limpiar seleccion</Button>
          <Button
            size="sm"
            disabled={!bulkAssignment.groupId || !bulkAssignment.subjectId || selectedVisibleTeacherIds.length === 0 || bulkStatus.loading}
            onClick={runBulkTeacherAssignment}
          >{bulkStatus.loading ? "Asignando..." : "Asignar materia"}</Button>
        </div>
        {bulkStatus.message && (
          <p className={`text-xs ${bulkStatus.tone === "error" ? "text-red-600" : "text-green-700"}`}>{bulkStatus.message}</p>
        )}
      </div>

      <div className="overflow-x-auto sec-table">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Sel.</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Correo</th>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Asignación rápida</th>
              <th className="p-2 text-left">Gestión</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <React.Fragment key={u.id}>
              <tr className="border-t border-gray-200">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedTeachers[u.id])}
                    onChange={(e) => setSelectedTeachers((prev) => ({ ...prev, [u.id]: e.target.checked }))}
                  />
                </td>
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.codigo}</td>
                <td className="p-2">
                  <div className="min-w-[360px] space-y-2">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Grupo</p>
                        <Select
                          options={[{ label: "Seleccione grupo", value: "" }, ...groups.map((g) => ({ label: g.label, value: String(g.id) }))]}
                          value={assignments[u.id]?.groupId || ""}
                          onChange={(e) => {
                            const nextGroupId = e.target.value;
                            setAssignments((prev) => ({ ...prev, [u.id]: { groupId: nextGroupId, subjectId: "" } }));
                            if (nextGroupId) {
                              void ensureGroupSubjects(Number(nextGroupId));
                            }
                          }}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Materia</p>
                        {(() => {
                          const selectedGroupId = Number(assignments[u.id]?.groupId || 0);
                          const groupSubjects = selectedGroupId ? (groupSubjectsMap[selectedGroupId]?.options ?? []) : [];
                          const loadingSubjects = selectedGroupId ? Boolean(groupSubjectsMap[selectedGroupId]?.loading) : false;
                          return (
                            <Select
                              options={[
                                { label: selectedGroupId ? "Seleccione materia" : "Seleccione un grupo primero", value: "" },
                                ...groupSubjects.map((s) => ({ label: s.nombre, value: String(s.id) })),
                              ]}
                              value={assignments[u.id]?.subjectId || ""}
                              onChange={(e) => setAssignments((prev) => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), subjectId: e.target.value } }))}
                              disabled={!selectedGroupId || loadingSubjects}
                            />
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        disabled={!assignments[u.id]?.groupId || !assignments[u.id]?.subjectId || assignStatus[u.id] === "loading"}
                        onClick={async () => {
                          const gid = Number(assignments[u.id]?.groupId);
                          const sid = Number(assignments[u.id]?.subjectId);
                          if (!gid || !sid) return;
                          try {
                            setAssignStatus((s) => ({ ...s, [u.id]: "loading" }));

                            const cachedAssignments = teacherAssignmentsMap[u.id]?.loaded
                              ? teacherAssignmentsMap[u.id].items
                              : await loadTeacherAssignments(Number(u.id), false);

                            const duplicate = cachedAssignments.some((item) => item.groupId === gid && item.subjectId === sid);
                            if (duplicate) {
                              setAssignStatus((s) => ({ ...s, [u.id]: "error" }));
                              return;
                            }

                            const created = await academicApi.assignTeacher(Number(u.id), gid, sid);
                            const groupLabel = groups.find((g) => g.id === gid)?.label ?? String(gid);
                            const subjectName = (groupSubjectsMap[gid]?.options ?? []).find((s) => s.id === sid)?.nombre ?? String(sid);
                            setTeacherAssignmentsMap((m) => {
                              const current = m[u.id];
                              const newItem = { id: created.id, groupId: gid, subjectId: sid, groupLabel, subjectName };
                              if (current?.loaded) {
                                return { ...m, [u.id]: { ...current, items: [...current.items, newItem] } };
                              }
                              return { ...m, [u.id]: { loaded: true, loading: false, items: [newItem], expanded: true } };
                            });
                            setAssignments((prev) => ({ ...prev, [u.id]: { groupId: "", subjectId: "" } }));
                            setAssignStatus((s) => ({ ...s, [u.id]: "ok" }));
                          } catch {
                            setAssignStatus((s) => ({ ...s, [u.id]: "error" }));
                          }
                        }}
                      >Asignar materia</Button>
                      {assignStatus[u.id] === "ok" && <span className="text-xs font-medium text-green-700">Asignado correctamente</span>}
                      {assignStatus[u.id] === "error" && <span className="text-xs font-medium text-red-600">Revisa grupo/materia</span>}
                    </div>
                  </div>
                </td>
                <td className="p-2 sec-actions">
                    <Link href={`/secretaria/usuarios/edit/${u.publicId}`} prefetch={false} className="inline-block">
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                    <Link href={`/secretaria/usuarios/delete/${u.publicId}`} prefetch={false} className="inline-block">
                    <Button variant="danger" size="sm">Eliminar</Button>
                  </Link>
                  <Button
                    className="inline-block"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      const state = teacherAssignmentsMap[u.id];
                      if (state?.expanded) {
                        setTeacherAssignmentsMap((m) => ({
                          ...m,
                          [u.id]: { ...(m[u.id] || { loaded: false, loading: false, expanded: false, items: [] }), expanded: false },
                        }));
                        return;
                      }

                      if (!state?.loaded) {
                        await loadTeacherAssignments(Number(u.id), true);
                        return;
                      }

                      setTeacherAssignmentsMap((m) => ({ ...m, [u.id]: { ...m[u.id], expanded: true } }));
                    }}
                  >{teacherAssignmentsMap[u.id]?.expanded ? "Ocultar asignaciones" : "Ver asignaciones"}</Button>
                </td>
              </tr>
              {teacherAssignmentsMap[u.id]?.expanded && (
                <tr className="border-t border-gray-200">
                  <td className="p-2 bg-gray-50" colSpan={6}>
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
                <td className="p-3 text-center" colSpan={6}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}