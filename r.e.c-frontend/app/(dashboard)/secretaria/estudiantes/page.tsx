"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import Select from "@/components/ui/Select";
import { academicApi } from "@/lib/academicApi";

type AssignStatus = "idle" | "loading" | "ok" | "error";
type CurrentGroupInfo = { id: number; label: string } | null;

export default function SecretariaEstudiantesPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<{ id: number; label: string }[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [assignStatus, setAssignStatus] = useState<Record<number, AssignStatus>>({});
  const [currentGroup, setCurrentGroup] = useState<Record<number, CurrentGroupInfo>>({});
  const [selectedStudents, setSelectedStudents] = useState<Record<number, boolean>>({});
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [bulkStatus, setBulkStatus] = useState<{ loading: boolean; message?: string; tone?: "ok" | "error" }>({ loading: false });

  useEffect(() => {
    usersApi.list("ESTUDIANTE").then(setUsers);
    academicApi.listGroups().then((gs) => setGroups(gs.map((g) => ({ id: g.id, label: `${g.grade?.nombre ?? g.gradeId}-${g.nombre}` }))));
  }, []);

  useEffect(() => {
    if (users.length === 0 || groups.length === 0) return;
    (async () => {
      const map: Record<number, CurrentGroupInfo> = {};
      const groupResults = await Promise.allSettled(
        groups.map(async (g) => {
          const students = await academicApi.listGroupStudents(g.id);
          return { group: g, students };
        }),
      );

      for (const result of groupResults) {
        if (result.status !== "fulfilled") continue;
        for (const student of result.value.students) {
          map[student.id] = { id: result.value.group.id, label: result.value.group.label };
        }
      }

      for (const u of users) {
        if (!(u.id in map)) map[u.id] = null;
      }

      setCurrentGroup(map);
    })();
  }, [users, groups]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [users, query]);

  const selectedVisibleIds = useMemo(
    () => visible.filter((u) => selectedStudents[u.id]).map((u) => u.id),
    [visible, selectedStudents],
  );

  async function assignOrChangeStudentGroup(studentId: number, groupId: number) {
    const current = currentGroup[studentId];
    if (current?.id) {
      await academicApi.deleteStudentGroup(studentId);
    }
    await academicApi.assignStudentToGroup(studentId, groupId);
  }

  async function runBulkStudentAssignment() {
    const groupId = Number(bulkGroupId);
    if (!groupId || selectedVisibleIds.length === 0) return;

    const groupLabel = groups.find((g) => g.id === groupId)?.label ?? String(groupId);
    let assigned = 0;
    let skipped = 0;
    let failed = 0;
    const groupUpdates: Record<number, CurrentGroupInfo> = {};

    setBulkStatus({ loading: true });
    setAssignStatus((prev) => {
      const next = { ...prev };
      for (const id of selectedVisibleIds) next[id] = "loading";
      return next;
    });

    for (const id of selectedVisibleIds) {
      const current = currentGroup[id];
      if (current?.id === groupId) {
        skipped += 1;
        setAssignStatus((prev) => ({ ...prev, [id]: "ok" }));
        continue;
      }

      try {
        await assignOrChangeStudentGroup(id, groupId);
        assigned += 1;
        groupUpdates[id] = { id: groupId, label: groupLabel };
        setAssignStatus((prev) => ({ ...prev, [id]: "ok" }));
      } catch {
        failed += 1;
        setAssignStatus((prev) => ({ ...prev, [id]: "error" }));
      }
    }

    setCurrentGroup((prev) => ({ ...prev, ...groupUpdates }));
    setAssignments((prev) => {
      const next = { ...prev };
      for (const id of selectedVisibleIds) next[id] = "";
      return next;
    });
    setSelectedStudents({});
    setBulkStatus({
      loading: false,
      tone: failed > 0 ? "error" : "ok",
      message: `Asignados: ${assigned}. Omitidos: ${skipped}. Fallidos: ${failed}.`,
    });
  }

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Gestión de Estudiantes</h2>
          <p className="sec-subtitle">Administra estudiantes, asigna grupos de forma individual o masiva y controla cambios con feedback inmediato.</p>
        </div>
        <span className="sec-chip">Operación académica</span>
      </div>

      <div className="sec-toolbar">
        <div className="sec-toolbar-group">
          <Link href="/secretaria/usuarios/create?role=ESTUDIANTE" prefetch={false}>
            <Button>Crear usuario</Button>
          </Link>
        </div>
        <span className="sec-muted">Alta rapida y gestion de grupos por estudiante</span>
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
          <span className="text-xs text-rec-text-muted">{selectedVisibleIds.length} seleccionados en esta vista</span>
        </div>
        <div className="sec-action-cluster">
          <div className="min-w-[220px]">
            <Select
              label="Grupo destino"
              options={[{ label: "Seleccione grupo", value: "" }, ...groups.map((g) => ({ label: g.label, value: String(g.id) }))]}
              value={bulkGroupId}
              onChange={(e) => setBulkGroupId(e.target.value)}
              disabled={bulkStatus.loading}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedStudents((prev) => {
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
            onClick={() => setSelectedStudents({})}
            disabled={selectedVisibleIds.length === 0 || bulkStatus.loading}
          >Limpiar seleccion</Button>
          <Button
            size="sm"
            disabled={!bulkGroupId || selectedVisibleIds.length === 0 || bulkStatus.loading}
            onClick={runBulkStudentAssignment}
          >{bulkStatus.loading ? "Asignando..." : "Asignar grupo"}</Button>
        </div>
        {bulkStatus.message && (
          <p className={`text-xs ${bulkStatus.tone === "error" ? "text-rec-danger-text" : "text-rec-success-text"}`}>{bulkStatus.message}</p>
        )}
      </div>

      <div className="overflow-x-auto sec-table">
        <table className="min-w-full text-sm">
          <thead className="bg-rec-bg-muted">
            <tr>
              <th className="p-2 text-left">Sel.</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Correo</th>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Asignar a Grupo</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-t border-rec-border-default">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedStudents[u.id])}
                    onChange={(e) => setSelectedStudents((prev) => ({ ...prev, [u.id]: e.target.checked }))}
                  />
                </td>
                <td className="p-2">{u.nombres} {u.apellidos}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.codigo}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Select
                      options={[{ label: "Seleccione grupo", value: "" }, ...groups.map((g) => ({ label: g.label, value: String(g.id) }))]}
                      value={assignments[u.id] || ""}
                      onChange={(e) => setAssignments((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      disabled={assignStatus[u.id] === "loading"}
                    />
                    <Button
                      size="sm"
                      disabled={
                        !assignments[u.id]
                        || assignStatus[u.id] === "loading"
                        || currentGroup[u.id]?.id === Number(assignments[u.id])
                      }
                      onClick={async () => {
                        const gid = Number(assignments[u.id]);
                        if (!gid) return;
                        try {
                          setAssignStatus((s) => ({ ...s, [u.id]: "loading" }));
                          await assignOrChangeStudentGroup(Number(u.id), gid);
                          setAssignStatus((s) => ({ ...s, [u.id]: "ok" }));
                          const grpLabel = groups.find((g) => g.id === gid)?.label || "";
                          setCurrentGroup((m) => ({ ...m, [u.id]: { id: gid, label: grpLabel } }));
                          setAssignments((prev) => ({ ...prev, [u.id]: "" }));
                        } catch {
                          setAssignStatus((s) => ({ ...s, [u.id]: "error" }));
                        }
                      }}
                    >{currentGroup[u.id] ? "Cambiar" : "Asignar"}</Button>
                    {assignStatus[u.id] === "ok" && <span className="text-xs text-rec-success-text">Asignado</span>}
                    {assignStatus[u.id] === "error" && <span className="text-xs text-rec-danger-text">Error</span>}
                    {currentGroup[u.id]?.id === Number(assignments[u.id]) && assignments[u.id] && (
                      <span className="text-xs text-rec-warning-text">Ya esta en ese grupo</span>
                    )}
                    {currentGroup[u.id] && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-rec-text-secondary">Grupo actual: {currentGroup[u.id]?.label}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            try {
                              setAssignStatus((s) => ({ ...s, [u.id]: "loading" }));
                              await academicApi.deleteStudentGroup(Number(u.id));
                              setCurrentGroup((m) => ({ ...m, [u.id]: null }));
                              setAssignStatus((s) => ({ ...s, [u.id]: "ok" }));
                            } catch {
                              setAssignStatus((s) => ({ ...s, [u.id]: "error" }));
                            }
                          }}
                        >Quitar asignación</Button>
                      </div>
                    )}
                  </div>
                </td>
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
                <td className="p-3 text-center" colSpan={6}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}