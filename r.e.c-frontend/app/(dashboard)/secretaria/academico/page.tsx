"use client";
import React, { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { academicApi, type Grade, type Group, type Subject } from "@/lib/academicApi";
import { usersApi, type UserDTO } from "@/lib/usersApi";

type GroupSubjectsState = {
  loaded: boolean;
  loading: boolean;
  items: { id: number; subject: Subject }[];
};

type BulkOperationStatus = {
  loading: boolean;
  message?: string;
  tone?: "ok" | "error";
};

export default function SecretariaAcademicoPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<(Group & { grade?: Grade })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserDTO[]>([]);

  const [gradeName, setGradeName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupGradeId, setGroupGradeId] = useState<string>("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  const [assignDirectorGroupId, setAssignDirectorGroupId] = useState<string>("");
  const [assignDirectorId, setAssignDirectorId] = useState<string>("");

  const [assignGroupId, setAssignGroupId] = useState<string>("");
  const [assignSubjectId, setAssignSubjectId] = useState<string>("");

  // Estado de edición/eliminación en Resumen
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [editingGradeName, setEditingGradeName] = useState<string>("");
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>("");
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState<string>("");
  const [editingSubjectCode, setEditingSubjectCode] = useState<string>("");
  const [groupSubjectsByGroup, setGroupSubjectsByGroup] = useState<Record<number, GroupSubjectsState>>({});
  const [groupsQuery, setGroupsQuery] = useState("");
  const [editingDirectorGroupId, setEditingDirectorGroupId] = useState<number | null>(null);
  const [editingDirectorId, setEditingDirectorId] = useState<string>("");

  // Asignación masiva de materias a grupos
  const [selectedGroupIds, setSelectedGroupIds] = useState<Record<number, boolean>>({});
  const [bulkMateriasGroupId, setBulkMateriasGroupId] = useState<string>("");
  const [bulkMateriasSubjectId, setBulkMateriasSubjectId] = useState<string>("");
  const [bulkMateriasStatus, setBulkMateriasStatus] = useState<BulkOperationStatus>({ loading: false });

  // Asignación masiva de directores a grupos
  const [selectedGroupIdsDirector, setSelectedGroupIdsDirector] = useState<Record<number, boolean>>({});
  const [bulkDirectorId, setBulkDirectorId] = useState<string>("");
  const [bulkDirectorStatus, setBulkDirectorStatus] = useState<BulkOperationStatus>({ loading: false });

  useEffect(() => {
    academicApi.listGrades().then((gs) => setGrades(gs.map((g) => ({ id: g.id, nombre: g.nombre }))));
    academicApi.listGroups().then((gs) => setGroups(gs));
    academicApi.listSubjects().then(setSubjects);
    usersApi.list("PROFESOR").then(setTeachers);
  }, []);

  async function loadGroupSubjects(groupId: number): Promise<void> {
    const cached = groupSubjectsByGroup[groupId];
    if (cached?.loaded || cached?.loading) return;

    setGroupSubjectsByGroup((prev) => ({
      ...prev,
      [groupId]: { loaded: false, loading: true, items: prev[groupId]?.items ?? [] },
    }));

    try {
      const items = await academicApi.listGroupSubjects(groupId);
      setGroupSubjectsByGroup((prev) => ({
        ...prev,
        [groupId]: { loaded: true, loading: false, items },
      }));
    } catch {
      setGroupSubjectsByGroup((prev) => ({
        ...prev,
        [groupId]: { loaded: false, loading: false, items: prev[groupId]?.items ?? [] },
      }));
    }
  }

  async function runBulkAssignSubjectsToGroups(): Promise<void> {
    const subjectId = Number(bulkMateriasSubjectId);
    const selectedIds = Object.entries(selectedGroupIds)
      .filter(([, checked]) => checked)
      .map(([id]) => Number(id));

    if (!subjectId || selectedIds.length === 0) return;

    let assigned = 0;
    let skipped = 0;
    let failed = 0;

    setBulkMateriasStatus({ loading: true });

    for (const groupId of selectedIds) {
      try {
        const existing = groupSubjectsByGroup[groupId]?.items ?? [];
        const alreadyAssigned = existing.some((item) => item.subject.id === subjectId);

        if (alreadyAssigned) {
          skipped += 1;
          continue;
        }

        const newItem = await academicApi.assignSubjectToGroup(groupId, subjectId);
        assigned += 1;

        setGroupSubjectsByGroup((prev) => {
          const current = prev[groupId] || { loaded: false, loading: false, items: [] };
          return {
            ...prev,
            [groupId]: {
              ...current,
              items: [...current.items, { id: newItem.id, subject: { id: subjectId, nombre: subjects.find((s) => s.id === subjectId)?.nombre ?? "" } }],
            },
          };
        });
      } catch {
        failed += 1;
      }
    }

    setSelectedGroupIds({});
    setBulkMateriasGroupId("");
    setBulkMateriasSubjectId("");
    setBulkMateriasStatus({
      loading: false,
      tone: failed > 0 ? "error" : "ok",
      message: `Asignados: ${assigned}. Omitidos: ${skipped}. Fallidos: ${failed}.`,
    });
  }

  async function runBulkAssignDirectors(): Promise<void> {
    const directorId = Number(bulkDirectorId);
    const selectedIds = Object.entries(selectedGroupIdsDirector)
      .filter(([, checked]) => checked)
      .map(([id]) => Number(id));

    if (!directorId || selectedIds.length === 0) return;

    let assigned = 0;
    let failed = 0;

    setBulkDirectorStatus({ loading: true });

    for (const groupId of selectedIds) {
      try {
        const updated = await academicApi.assignGroupDirector(groupId, directorId);
        assigned += 1;
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, directorId: updated.directorId } : g)));
      } catch {
        failed += 1;
      }
    }

    setSelectedGroupIdsDirector({});
    setBulkDirectorId("");
    setBulkDirectorStatus({
      loading: false,
      tone: failed > 0 ? "error" : "ok",
      message: `Asignados: ${assigned}. Fallidos: ${failed}.`,
    });
  }

  const gradeOptions = useMemo(() => grades.map((g) => ({ label: g.nombre, value: String(g.id) })), [grades]);
  const groupOptions = useMemo(() => groups.map((g) => {
    const gradeLabel = g.grade?.nombre ?? grades.find((x) => x.id === g.gradeId)?.nombre ?? String(g.gradeId);
    return { label: `${gradeLabel}-${g.nombre}`, value: String(g.id) };
  }), [groups, grades]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: s.nombre, value: String(s.id) })), [subjects]);
  const teacherOptions = useMemo(() => teachers.map((t) => ({ label: `${t.nombres} ${t.apellidos}`, value: String(t.id) })), [teachers]);

  const groupsByGradeCount = useMemo(() => {
    const map: Record<number, number> = {};
    for (const gr of groups) {
      const gid = gr.grade?.id ?? gr.gradeId;
      map[gid] = (map[gid] ?? 0) + 1;
    }
    return map;
  }, [groups]);

  const visibleGroups = useMemo(() => {
    const q = groupsQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((gr) => {
      const gradeLabel = gr.grade?.nombre ?? String(gr.gradeId);
      return `${gradeLabel}-${gr.nombre}`.toLowerCase().includes(q);
    });
  }, [groups, groupsQuery]);

  async function onCreateGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!gradeName.trim()) return;
    const created = await academicApi.createGrade(gradeName.trim());
    setGrades((prev) => [...prev, created]);
    setGradeName("");
  }

  async function onCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const gid = Number(groupGradeId);
    if (!groupName.trim() || !gid) return;
    const created = await academicApi.createGroup(groupName.trim(), gid);
    const gradeObj = grades.find((x) => x.id === gid);
    setGroups((prev) => [...prev, gradeObj ? { ...created, grade: gradeObj } : created]);
    setGroupName("");
    setGroupGradeId("");
  }

  async function onCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectName.trim()) return;
    const created = await academicApi.createSubject(subjectName.trim(), subjectCode.trim() || undefined);
    setSubjects((prev) => [...prev, created]);
    setSubjectName("");
    setSubjectCode("");
  }

  async function onAssignDirector(e: React.FormEvent) {
    e.preventDefault();
    const gid = Number(assignDirectorGroupId);
    const tid = Number(assignDirectorId);
    if (!gid || !tid) return;
    const updated = await academicApi.assignGroupDirector(gid, tid);
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, directorId: updated.directorId } : g)));
    setAssignDirectorGroupId("");
    setAssignDirectorId("");
  }

  async function onAssignSubjectToGroup(e: React.FormEvent) {
    e.preventDefault();
    const gid = Number(assignGroupId);
    const sid = Number(assignSubjectId);
    if (!gid || !sid) return;
    await academicApi.assignSubjectToGroup(gid, sid);
    setAssignGroupId("");
    setAssignSubjectId("");
  }

  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Gestión Académica</h2>
          <p className="sec-subtitle">Configura grados, grupos, materias y directores con operaciones individuales y masivas.</p>
        </div>
        <span className="sec-chip">Estructura curricular</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={onCreateGrade} className="sec-card p-4 space-y-3">
          <h3 className="font-medium">Crear Grado</h3>
          <Input label="Nombre del grado" value={gradeName} onChange={(e) => setGradeName(e.target.value)} />
          <Button type="submit">Crear</Button>
        </form>

        <form onSubmit={onCreateGroup} className="sec-card p-4 space-y-3">
          <h3 className="font-medium">Crear Grupo</h3>
          <Input label="Nombre del grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <Select label="Grado" options={[{ label: "Seleccione grado", value: "" }, ...gradeOptions]} value={groupGradeId} onChange={(e) => setGroupGradeId(e.target.value)} />
          <Button type="submit">Crear</Button>
        </form>

        <form onSubmit={onCreateSubject} className="sec-card p-4 space-y-3">
          <h3 className="font-medium">Crear Materia</h3>
          <Input label="Nombre de la materia" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          <Input label="Código (opcional)" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
          <Button type="submit">Crear</Button>
        </form>

        <form onSubmit={onAssignDirector} className="sec-card p-4 space-y-3">
          <h3 className="font-medium">Asignar Director de Grupo</h3>
          <Select label="Grupo" options={[{ label: "Seleccione grupo", value: "" }, ...groupOptions]} value={assignDirectorGroupId} onChange={(e) => setAssignDirectorGroupId(e.target.value)} />
          <Select label="Docente" options={[{ label: "Seleccione docente", value: "" }, ...teacherOptions]} value={assignDirectorId} onChange={(e) => setAssignDirectorId(e.target.value)} />
          <Button type="submit" disabled={!assignDirectorGroupId || !assignDirectorId}>Asignar</Button>
        </form>

      <div className="sec-card p-4 space-y-3">
        <h3 className="font-medium">Asignación masiva de directores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Select label="Docente" options={[{ label: "Seleccione docente", value: "" }, ...teacherOptions]} value={bulkDirectorId} onChange={(e) => setBulkDirectorId(e.target.value)} disabled={bulkDirectorStatus.loading} />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setSelectedGroupIdsDirector((prev) => { const next = { ...prev }; for (const g of groups) next[g.id] = true; return next; }); }} disabled={groups.length === 0 || bulkDirectorStatus.loading}>Seleccionar todos</Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedGroupIdsDirector({})} disabled={Object.values(selectedGroupIdsDirector).every((v) => !v) || bulkDirectorStatus.loading}>Limpiar</Button>
            <Button size="sm" onClick={runBulkAssignDirectors} disabled={!bulkDirectorId || Object.values(selectedGroupIdsDirector).every((v) => !v) || bulkDirectorStatus.loading}>{bulkDirectorStatus.loading ? "Asignando..." : "Asignar directores"}</Button>
          </div>
        </div>
        {bulkDirectorStatus.message && <p className={`text-xs ${bulkDirectorStatus.tone === "error" ? "text-red-600" : "text-green-700"}`}>{bulkDirectorStatus.message}</p>}
        <div className="text-xs text-gray-600 max-h-40 overflow-y-auto border rounded p-2">
          <p className="font-medium mb-2">{Object.values(selectedGroupIdsDirector).filter(Boolean).length} grupos seleccionados:</p>
          {groups.filter((g) => selectedGroupIdsDirector[g.id]).map((g) => (
            <div key={g.id} className="flex items-center gap-2 py-1">
              <input type="checkbox" checked={Boolean(selectedGroupIdsDirector[g.id])} onChange={(e) => setSelectedGroupIdsDirector((prev) => ({ ...prev, [g.id]: e.target.checked }))} />
              <span>{g.grade?.nombre ?? g.gradeId}-{g.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <form onSubmit={onAssignSubjectToGroup} className="sec-card p-4 space-y-3">
      <h3 className="font-medium">Asignar Materia a Grupo (individual)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select label="Grupo" options={[{ label: "Seleccione grupo", value: "" }, ...groupOptions]} value={assignGroupId} onChange={(e) => setAssignGroupId(e.target.value)} />
        <Select label="Materia" options={[{ label: "Seleccione materia", value: "" }, ...subjectOptions]} value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)} />
        <div className="flex items-end"><Button type="submit" disabled={!assignGroupId || !assignSubjectId}>Asignar</Button></div>
      </div>
    </form>

    <div className="sec-card p-4 space-y-3">
      <h3 className="font-medium">Asignación masiva de materias</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Select label="Materia" options={[{ label: "Seleccione materia", value: "" }, ...subjectOptions]} value={bulkMateriasSubjectId} onChange={(e) => setBulkMateriasSubjectId(e.target.value)} disabled={bulkMateriasStatus.loading} />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSelectedGroupIds((prev) => { const next = { ...prev }; for (const g of visibleGroups) next[g.id] = true; return next; }); }} disabled={visibleGroups.length === 0 || bulkMateriasStatus.loading}>Seleccionar visibles</Button>
          <Button variant="secondary" size="sm" onClick={() => setSelectedGroupIds({})} disabled={Object.values(selectedGroupIds).every((v) => !v) || bulkMateriasStatus.loading}>Limpiar</Button>
          <Button size="sm" onClick={runBulkAssignSubjectsToGroups} disabled={!bulkMateriasSubjectId || Object.values(selectedGroupIds).every((v) => !v) || bulkMateriasStatus.loading}>{bulkMateriasStatus.loading ? "Asignando..." : "Asignar materia"}</Button>
        </div>
      </div>
      {bulkMateriasStatus.message && <p className={`text-xs ${bulkMateriasStatus.tone === "error" ? "text-red-600" : "text-green-700"}`}>{bulkMateriasStatus.message}</p>}
      <div className="text-xs text-gray-600 max-h-40 overflow-y-auto border rounded p-2">
        <p className="font-medium mb-2">{Object.values(selectedGroupIds).filter(Boolean).length} de {visibleGroups.length} grupos seleccionados:</p>
        {visibleGroups.map((g) => (
          <div key={g.id} className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={Boolean(selectedGroupIds[g.id])} onChange={(e) => setSelectedGroupIds((prev) => ({ ...prev, [g.id]: e.target.checked }))} />
            <span>{g.grade?.nombre ?? g.gradeId}-{g.nombre}</span>
          </div>
        ))}
      </div>
    </div>

      <div className="space-y-2">
      <h3 className="font-medium">Resumen</h3>
      <div className="sec-grid-cards">
        <div className="sec-stat">
          <p className="text-xs text-gray-600">Grados</p>
          <p className="value">{grades.length}</p>
        </div>
        <div className="sec-stat">
          <p className="text-xs text-gray-600">Grupos</p>
          <p className="value">{groups.length}</p>
        </div>
        <div className="sec-stat">
          <p className="text-xs text-gray-600">Materias</p>
          <p className="value">{subjects.length}</p>
        </div>
      </div>

      {/* Tabla de Grados */}
      <div className="sec-card p-4 mt-3">
          <h4 className="font-medium mb-2">Grados</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nombre</th>
                <th className="py-2"># Grupos</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id} className="border-b">
                  <td className="py-2">
                    {editingGradeId === g.id ? (
                      <input className="border rounded px-2 py-1 w-full" value={editingGradeName} onChange={(e) => setEditingGradeName(e.target.value)} />
                    ) : (
                      g.nombre
                    )}
                  </td>
                  <td className="py-2">{groupsByGradeCount[g.id] ?? 0}</td>
                  <td className="py-2 space-x-2">
                    {editingGradeId === g.id ? (
                      <>
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={async () => {
                            if (!editingGradeName.trim()) return;
                            const updated = await academicApi.updateGrade(g.id, editingGradeName.trim());
                            setGrades((prev) => prev.map((x) => (x.id === g.id ? updated : x)));
                            setEditingGradeId(null);
                            setEditingGradeName("");
                          }}
                        >Guardar</button>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingGradeId(null); setEditingGradeName(""); }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingGradeId(g.id); setEditingGradeName(g.nombre); }}>Editar</button>
                        <button
                          className="px-2 py-1 border rounded text-red-600"
                          onClick={async () => {
                            await academicApi.deleteGrade(g.id);
                            setGrades((prev) => prev.filter((x) => x.id !== g.id));
                            // También actualizar grupos vinculados
                            setGroups((prev) => prev.filter((gr) => gr.grade?.id !== g.id));
                          }}
                        >Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla de Grupos */}
        <div className="sec-card p-4 mt-6">
          <h4 className="font-medium mb-2">Grupos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Buscar grupo" placeholder="Ej: 10-1-A" value={groupsQuery} onChange={(e) => setGroupsQuery(e.target.value)} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Sel.</th>
                <th className="py-2">Grupo</th>
                <th className="py-2">Director</th>
                <th className="py-2">Materias</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleGroups.map((gr) => (
                <tr key={gr.id} className="border-b align-top">
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedGroupIds[gr.id])}
                      onChange={(e) => setSelectedGroupIds((prev) => ({ ...prev, [gr.id]: e.target.checked }))}
                    />
                  </td>
                  <td className="py-2">
                    {editingGroupId === gr.id ? (
                      <input className="border rounded px-2 py-1 w-full" value={editingGroupName} onChange={(e) => setEditingGroupName(e.target.value)} />
                    ) : (
                      `${gr.grade?.nombre ?? gr.gradeId}-${gr.nombre}`
                    )}
                  </td>
                  <td className="py-2">
                    {editingDirectorGroupId === gr.id ? (
                      <div className="flex items-center gap-2">
                        <Select label="" options={[{ label: "Seleccione docente", value: "" }, ...teacherOptions]} value={editingDirectorId} onChange={(e) => setEditingDirectorId(e.target.value)} />
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={async () => {
                            const tid = Number(editingDirectorId);
                            if (!tid) return;
                            const updated = await academicApi.assignGroupDirector(gr.id, tid);
                            setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, directorId: updated.directorId } : g)));
                            setEditingDirectorGroupId(null);
                            setEditingDirectorId("");
                          }}
                        >Guardar</button>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingDirectorGroupId(null); setEditingDirectorId(""); }}>Cancelar</button>
                      </div>
                    ) : (
                      teachers.find((t) => t.id === gr.directorId) ? `${teachers.find((t) => t.id === gr.directorId)?.nombres} ${teachers.find((t) => t.id === gr.directorId)?.apellidos}` : "—"
                    )}
                  </td>
                  <td className="py-2">{groupSubjectsByGroup[gr.id]?.items?.length ?? 0}</td>
                  <td className="py-2 space-x-2">
                    {editingGroupId === gr.id ? (
                      <>
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={async () => {
                            if (!editingGroupName.trim()) return;
                            const updated = await academicApi.updateGroup(gr.id, { nombre: editingGroupName.trim() });
                            setGroups((prev) => prev.map((x) => (x.id === gr.id ? { ...x, nombre: updated.nombre } : x)));
                            setEditingGroupId(null);
                            setEditingGroupName("");
                          }}
                        >Guardar</button>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingGroupId(null); setEditingGroupName(""); }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingGroupId(gr.id); setEditingGroupName(gr.nombre); }}>Editar</button>
                        <button
                          className="px-2 py-1 border rounded text-red-600"
                          onClick={async () => {
                            await academicApi.deleteGroup(gr.id);
                            setGroups((prev) => prev.filter((x) => x.id !== gr.id));
                          }}
                        >Eliminar</button>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingDirectorGroupId(gr.id); setEditingDirectorId(""); }}>Cambiar director</button>
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={async () => {
                            const state = groupSubjectsByGroup[gr.id];
                            if (state?.loaded) {
                              setGroupSubjectsByGroup((prev) => ({ ...prev, [gr.id]: { ...prev[gr.id], loaded: !prev[gr.id].loaded } }));
                              return;
                            }
                            await loadGroupSubjects(gr.id);
                          }}
                        >{groupSubjectsByGroup[gr.id]?.loaded ? "Ocultar materias" : "Ver materias"}</button>
                      </>
                    )}

                    {/* Materias del grupo (expandible) */}
                    {groupSubjectsByGroup[gr.id]?.loaded && (
                      <div className="mt-3">
                        <ul className="list-disc pl-4">
                          {groupSubjectsByGroup[gr.id].items.map((gs) => (
                            <li key={gs.id} className="flex items-center justify-between">
                              <span>{gs.subject.nombre}</span>
                              <button
                                className="px-2 py-1 border rounded text-red-600"
                                onClick={async () => {
                                  await academicApi.deleteGroupSubject(gs.id);
                                  setGroupSubjectsByGroup((prev) => ({
                                    ...prev,
                                    [gr.id]: { ...prev[gr.id], items: prev[gr.id].items.filter((x) => x.id !== gs.id) }
                                  }));
                                }}
                              >Quitar</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla de Materias */}
        <div className="sec-card p-4 mt-6">
          <h4 className="font-medium mb-2">Materias</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nombre</th>
                <th className="py-2">Código</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">
                    {editingSubjectId === s.id ? (
                      <input className="border rounded px-2 py-1 w-full" value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)} />
                    ) : (
                      s.nombre
                    )}
                  </td>
                  <td className="py-2">
                    {editingSubjectId === s.id ? (
                      <input className="border rounded px-2 py-1 w-full" value={editingSubjectCode} onChange={(e) => setEditingSubjectCode(e.target.value)} />
                    ) : (
                      s.codigo ?? "—"
                    )}
                  </td>
                  <td className="py-2 space-x-2">
                    {editingSubjectId === s.id ? (
                      <>
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={async () => {
                            const updated = await academicApi.updateSubject(s.id, { nombre: editingSubjectName.trim() || undefined, codigo: editingSubjectCode || undefined });
                            setSubjects((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
                            setEditingSubjectId(null);
                            setEditingSubjectName("");
                            setEditingSubjectCode("");
                          }}
                        >Guardar</button>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingSubjectId(null); setEditingSubjectName(""); setEditingSubjectCode(""); }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEditingSubjectId(s.id); setEditingSubjectName(s.nombre); setEditingSubjectCode(s.codigo ?? ""); }}>Editar</button>
                        <button
                          className="px-2 py-1 border rounded text-red-600"
                          onClick={async () => {
                            await academicApi.deleteSubject(s.id);
                            setSubjects((prev) => prev.filter((x) => x.id !== s.id));
                          }}
                        >Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}