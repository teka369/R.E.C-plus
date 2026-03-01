"use client";
import React, { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { academicApi, type Grade, type Group, type Subject } from "@/lib/academicApi";
import { usersApi, type UserDTO } from "@/lib/usersApi";

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
  const [groupSubjectsByGroup, setGroupSubjectsByGroup] = useState<Record<number, { loaded: boolean; items: { id: number; subject: Subject }[] }>>({});
  const [groupsQuery, setGroupsQuery] = useState("");
  const [editingDirectorGroupId, setEditingDirectorGroupId] = useState<number | null>(null);
  const [editingDirectorId, setEditingDirectorId] = useState<string>("");

  useEffect(() => {
    academicApi.listGrades().then((gs) => setGrades(gs.map((g) => ({ id: g.id, nombre: g.nombre }))));
    academicApi.listGroups().then((gs) => setGroups(gs));
    academicApi.listSubjects().then(setSubjects);
    usersApi.list("PROFESOR").then(setTeachers);
  }, []);

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
    <section className="p-4 space-y-8">
      <h2 className="text-lg font-semibold">Gestión Académica</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={onCreateGrade} className="border rounded p-4 space-y-3">
          <h3 className="font-medium">Crear Grado</h3>
          <Input label="Nombre del grado" value={gradeName} onChange={(e) => setGradeName(e.target.value)} />
          <Button type="submit">Crear</Button>
        </form>

        <form onSubmit={onCreateGroup} className="border rounded p-4 space-y-3">
          <h3 className="font-medium">Crear Grupo</h3>
          <Input label="Nombre del grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <Select label="Grado" options={[{ label: "Seleccione grado", value: "" }, ...gradeOptions]} value={groupGradeId} onChange={(e) => setGroupGradeId(e.target.value)} />
          <Button type="submit">Crear</Button>
        </form>

        <form onSubmit={onCreateSubject} className="border rounded p-4 space-y-3">
          <h3 className="font-medium">Crear Materia</h3>
          <Input label="Nombre de la materia" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          <Input label="Código (opcional)" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
          <Button type="submit">Crear</Button>
        </form>

        <form onSubmit={onAssignDirector} className="border rounded p-4 space-y-3">
          <h3 className="font-medium">Asignar Director de Grupo</h3>
          <Select label="Grupo" options={[{ label: "Seleccione grupo", value: "" }, ...groupOptions]} value={assignDirectorGroupId} onChange={(e) => setAssignDirectorGroupId(e.target.value)} />
          <Select label="Docente" options={[{ label: "Seleccione docente", value: "" }, ...teacherOptions]} value={assignDirectorId} onChange={(e) => setAssignDirectorId(e.target.value)} />
          <Button type="submit" disabled={!assignDirectorGroupId || !assignDirectorId}>Asignar</Button>
        </form>
      </div>

      <form onSubmit={onAssignSubjectToGroup} className="border rounded p-4 space-y-3">
        <h3 className="font-medium">Asignar Materia a Grupo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select label="Grupo" options={[{ label: "Seleccione grupo", value: "" }, ...groupOptions]} value={assignGroupId} onChange={(e) => setAssignGroupId(e.target.value)} />
          <Select label="Materia" options={[{ label: "Seleccione materia", value: "" }, ...subjectOptions]} value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)} />
          <div className="flex items-end"><Button type="submit" disabled={!assignGroupId || !assignSubjectId}>Asignar</Button></div>
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-medium">Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded p-3">
            <p className="text-xs text-gray-600">Grados</p>
            <p className="text-2xl font-semibold">{grades.length}</p>
          </div>
          <div className="border rounded p-3">
            <p className="text-xs text-gray-600">Grupos</p>
            <p className="text-2xl font-semibold">{groups.length}</p>
          </div>
          <div className="border rounded p-3">
            <p className="text-xs text-gray-600">Materias</p>
            <p className="text-2xl font-semibold">{subjects.length}</p>
          </div>
        </div>

        {/* Tabla de Grados */}
        <div className="border rounded p-4 mt-3">
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
        <div className="border rounded p-4 mt-6">
          <h4 className="font-medium mb-2">Grupos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Buscar grupo" placeholder="Ej: 10-1-A" value={groupsQuery} onChange={(e) => setGroupsQuery(e.target.value)} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
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
                            if (!groupSubjectsByGroup[gr.id]?.loaded) {
                              const items = await academicApi.listGroupSubjects(gr.id);
                              setGroupSubjectsByGroup((prev) => ({ ...prev, [gr.id]: { loaded: true, items } }));
                            } else {
                              setGroupSubjectsByGroup((prev) => ({ ...prev, [gr.id]: { loaded: !prev[gr.id].loaded, items: prev[gr.id].items } }));
                            }
                          }}
                        >Ver materias</button>
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
                                    [gr.id]: { loaded: true, items: prev[gr.id].items.filter((x) => x.id !== gs.id) }
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
        <div className="border rounded p-4 mt-6">
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