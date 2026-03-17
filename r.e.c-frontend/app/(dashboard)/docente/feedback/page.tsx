"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupStudentDTO, type TeacherAssignment } from "@/lib/academicApi";
import {
  communicationApi,
  type CreateFeedbackInput,
  type FeedbackDTO,
  type FeedbackEstado,
  type FeedbackTipo,
} from "@/lib/communicationApi";
import { getErrorMessage } from "@/lib/errors";
import { FiArrowRight, FiCheck, FiEdit2, FiEye, FiMessageSquare, FiPlus, FiTrash2, FiX } from "react-icons/fi";

const TIPO_OPTIONS: { value: FeedbackTipo; label: string }[] = [
  { value: "POSITIVA", label: "Positiva" },
  { value: "NEGATIVA", label: "Negativa" },
  { value: "INFORMATIVA", label: "Informativa" },
  { value: "SEGUIMIENTO", label: "Seguimiento" },
];

const ESTADO_OPTIONS: { value: FeedbackEstado; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ATENDIDA", label: "Atendida" },
];

const TIPO_STYLE: Record<FeedbackTipo, string> = {
  POSITIVA: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border border-[color:var(--rec-soft)]",
  NEGATIVA: "bg-red-100 text-red-800 border border-red-200",
  INFORMATIVA: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border border-[color:var(--rec-soft)]",
  SEGUIMIENTO: "bg-amber-100 text-amber-800 border border-amber-200",
};

const TIPO_BORDER: Record<FeedbackTipo, string> = {
  POSITIVA: "border-l-[color:var(--rec-primary)]",
  NEGATIVA: "border-l-red-400",
  INFORMATIVA: "border-l-[color:var(--rec-primary-strong)]",
  SEGUIMIENTO: "border-l-amber-400",
};

const ESTADO_STYLE: Record<FeedbackEstado, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800 border border-amber-200",
  ATENDIDA: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border border-[color:var(--rec-soft)]",
};

type DeleteConfirm = { id: number; title: string } | null;

const EMPTY_FORM = {
  studentId: "",
  subjectId: "0",
  title: "",
  content: "",
  tipo: "INFORMATIVA" as FeedbackTipo,
  estado: "PENDIENTE" as FeedbackEstado,
  strengthsText: "",
  improvementsText: "",
};

export default function DocenteFeedbackPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [students, setStudents] = useState<GroupStudentDTO[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackDTO[]>([]);

  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailFeedback, setDetailFeedback] = useState<FeedbackDTO | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [deleting, setDeleting] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        label: `${item.group.grade?.nombre ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectsInGroup = useMemo(() => {
    if (!selectedGroupId) return [] as TeacherAssignment[];
    return assignments.filter((item) => item.group.id === selectedGroupId);
  }, [assignments, selectedGroupId]);

  const filtered = useMemo(() => {
    return feedbackList.filter((fb) => {
      if (filterStudentId && String(fb.studentId) !== filterStudentId) return false;
      if (filterTipo && fb.tipo !== filterTipo) return false;
      if (filterEstado && fb.estado !== filterEstado) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (!fb.title.toLowerCase().includes(q) && !fb.content.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [feedbackList, filterStudentId, filterTipo, filterEstado, filterSearch]);

  const feedbackStats = useMemo(() => {
    return {
      total: feedbackList.length,
      pendientes: feedbackList.filter((fb) => fb.estado === "PENDIENTE").length,
      atendidas: feedbackList.filter((fb) => fb.estado === "ATENDIDA").length,
    };
  }, [feedbackList]);

  const studentMap = useMemo(() => {
    const map = new Map<number, string>();
    students.forEach((s) => map.set(s.id, `${s.nombres} ${s.apellidos}`));
    return map;
  }, [students]);

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(data);
        const firstGroup = data[0]?.group.id ?? null;
        setSelectedGroupId(firstGroup);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudieron cargar asignaciones"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroupId) {
        setStudents([]);
        setFeedbackList([]);
        setFilterStudentId("");
        return;
      }
      setError(null);
      try {
        const [groupStudents, groupFeedback] = await Promise.all([
          academicApi.listGroupStudents(selectedGroupId),
          communicationApi.listFeedbackByGroup(selectedGroupId),
        ]);
        setStudents(groupStudents);
        setFeedbackList(groupFeedback);
        setFilterStudentId("");
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar el grupo"));
      }
    };
    void run();
  }, [selectedGroupId]);

  const refreshGroup = async () => {
    if (!selectedGroupId) return;
    const list = await communicationApi.listFeedbackByGroup(selectedGroupId);
    setFeedbackList(list);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setOk(null);
    setModalOpen(true);
  };

  const openEdit = (fb: FeedbackDTO) => {
    setEditingId(fb.id);
    setForm({
      studentId: String(fb.studentId),
      subjectId: String(fb.subjectId ?? 0),
      title: fb.title,
      content: fb.content,
      tipo: fb.tipo,
      estado: fb.estado,
      strengthsText: fb.strengths?.items?.join("\n") ?? "",
      improvementsText: fb.improvements?.items?.join("\n") ?? "",
    });
    setError(null);
    setOk(null);
    setModalOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const teacherId = Number(user?.id);
    if (!teacherId || !selectedGroupId) return;

    const strengths = form.strengthsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const improvements = form.improvementsText.split("\n").map((s) => s.trim()).filter(Boolean);

    setSaving(true);
    setError(null);
    setOk(null);
    try {
      if (editingId) {
        await communicationApi.updateFeedback(editingId, {
          title: form.title.trim(),
          content: form.content.trim(),
          tipo: form.tipo,
          estado: form.estado,
          strengths: strengths.length > 0 ? { items: strengths } : undefined,
          improvements: improvements.length > 0 ? { items: improvements } : undefined,
        });
        setOk("Feedback actualizado correctamente");
      } else {
        if (!form.studentId) { setError("Selecciona un estudiante"); setSaving(false); return; }
        if (!form.title.trim() || !form.content.trim()) { setError("Completa título y contenido"); setSaving(false); return; }
        const payload: CreateFeedbackInput = {
          teacherId,
          studentId: Number(form.studentId),
          groupId: selectedGroupId,
          subjectId: Number(form.subjectId) > 0 ? Number(form.subjectId) : undefined,
          title: form.title.trim(),
          content: form.content.trim(),
          tipo: form.tipo,
          estado: form.estado,
          strengths: strengths.length > 0 ? { items: strengths } : undefined,
          improvements: improvements.length > 0 ? { items: improvements } : undefined,
        };
        await communicationApi.createFeedback(payload);
        setOk("Feedback creado correctamente");
      }
      await refreshGroup();
      setModalOpen(false);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo guardar el feedback"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await communicationApi.deleteFeedback(deleteConfirm.id);
      await refreshGroup();
      setDeleteConfirm(null);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo eliminar el feedback"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <div
          className="rounded-2xl border p-4 sm:p-6 text-white"
          style={{
            borderColor: "var(--rec-soft)",
            background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Feedback &amp; Observaciones</h1>
              <p className="text-white/90 mt-1 text-sm">
                Registra retroalimentación y observaciones para tus estudiantes.
              </p>
            </div>
            {selectedGroupId && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium shadow hover:opacity-90 transition-colors"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                <FiPlus className="w-4 h-4" />
                Nuevo feedback
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        {/* Control panel */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4" style={{ border: "1px solid var(--rec-soft)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: "var(--rec-title)" }}>Control del grupo</p>
            {!loading && (
              <span className="text-xs rounded-full px-2.5 py-1" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
                {feedbackStats.total} feedback total
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Grupo</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                value={selectedGroupId ?? ""}
                onChange={(e) => setSelectedGroupId(Number(e.target.value) || null)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border px-3 py-2 text-center bg-white" style={{ borderColor: "var(--rec-soft)" }}>
                <p className="text-[11px] text-slate-500">Total</p>
                <p className="text-sm font-bold" style={{ color: "var(--rec-title)" }}>{feedbackStats.total}</p>
              </div>
              <div className="rounded-lg border px-3 py-2 text-center bg-amber-50 border-amber-200">
                <p className="text-[11px] text-amber-700">Pend.</p>
                <p className="text-sm font-bold text-amber-700">{feedbackStats.pendientes}</p>
              </div>
              <div className="rounded-lg px-3 py-2 text-center" style={{ background: "var(--rec-soft)", border: "1px solid var(--rec-soft)" }}>
                <p className="text-[11px]" style={{ color: "var(--rec-primary-strong)" }}>Atend.</p>
                <p className="text-sm font-bold" style={{ color: "var(--rec-primary-strong)" }}>{feedbackStats.atendidas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3" style={{ border: "1px solid var(--rec-soft)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--rec-title)" }}>Filtros y segmentación</p>
          {!loading && feedbackList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["POSITIVA", "NEGATIVA", "INFORMATIVA", "SEGUIMIENTO"] as FeedbackTipo[]).map((tipo) => {
                const count = feedbackList.filter((fb) => fb.tipo === tipo).length;
                return (
                  <button
                    key={tipo}
                    onClick={() => setFilterTipo(filterTipo === tipo ? "" : tipo)}
                    className={`rounded-xl p-3 border text-left transition-all ${
                      filterTipo === tipo
                        ? TIPO_STYLE[tipo] + " ring-2 ring-offset-1 ring-current"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs">{tipo.charAt(0) + tipo.slice(1).toLowerCase()}</p>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
            >
              <option value="">Todos los estudiantes</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.nombres} {s.apellidos}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="text"
              placeholder="Buscar…"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] flex-1 min-w-[140px]"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
        </div>

        {error && !modalOpen && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}
        {ok && !modalOpen && (
          <div className="rounded-xl p-4 text-sm" style={{ background: "var(--rec-soft)", border: "1px solid var(--rec-soft)", color: "var(--rec-primary-strong)" }}>{ok}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            <FiMessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Sin feedback registrado</p>
            <p className="mt-1">Crea el primer feedback para este grupo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((fb) => {
              const studentName = studentMap.get(fb.studentId) ?? `Estudiante #${fb.studentId}`;
              return (
                <article
                  key={fb.id}
                  className={`bg-white border border-slate-200 rounded-xl shadow-sm p-4 border-l-4 ${TIPO_BORDER[fb.tipo]}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_STYLE[fb.tipo]}`}>
                        {fb.tipo.charAt(0) + fb.tipo.slice(1).toLowerCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[fb.estado]}`}>
                        {fb.estado === "PENDIENTE" ? "Pendiente" : "Atendida"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailFeedback(fb)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-[color:var(--rec-soft)] transition-colors"
                        style={{ color: "var(--rec-primary-strong)" }}
                        title="Ver detalle"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(fb)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-[color:var(--rec-soft)] transition-colors"
                        style={{ color: "var(--rec-primary-strong)" }}
                        title="Editar"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: fb.id, title: fb.title })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-2">{fb.title}</h3>
                  <p className="text-sm text-slate-500 mb-1">
                    Para: <span className="text-slate-700">{studentName}</span>
                    {fb.createdAt && (
                      <> · <span>{new Date(fb.createdAt).toLocaleDateString()}</span></>
                    )}
                  </p>
                  <p className="text-sm text-slate-700 mt-2">{fb.content}</p>
                  {(fb.strengths?.items?.length ?? 0) > 0 || (fb.improvements?.items?.length ?? 0) > 0 ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(fb.strengths?.items?.length ?? 0) > 0 && (
                        <div className="rounded-lg p-3" style={{ background: "var(--rec-soft)", border: "1px solid var(--rec-soft)" }}>
                          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--rec-primary-strong)" }}>Fortalezas</p>
                          <ul className="space-y-1">
                            {fb.strengths!.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--rec-primary-strong)" }}>
                                <FiCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(fb.improvements?.items?.length ?? 0) > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-800 mb-1.5">Áreas de mejora</p>
                          <ul className="space-y-1">
                            {fb.improvements!.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                                <FiArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                {editingId ? "Editar feedback" : "Nuevo feedback"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form id="feedback-form" className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4" onSubmit={onSubmit}>
              {!editingId && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Estudiante *</label>
                    <select
                      required
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                      style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                      value={form.studentId}
                      onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                    >
                      <option value="">Seleccionar estudiante…</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombres} {s.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Materia</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                      style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                      value={form.subjectId}
                      onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                    >
                      <option value="0">Sin materia específica</option>
                      {subjectsInGroup.map((item) => (
                        <option key={item.id} value={item.subject.id}>{item.subject.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                    style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as FeedbackTipo }))}
                  >
                    {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                    style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                    value={form.estado}
                    onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as FeedbackEstado }))}
                  >
                    {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                  style={{ borderColor: "var(--rec-soft)" }}
                  placeholder="Ej. Buen desempeño en matemáticas"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contenido *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] resize-none"
                  style={{ borderColor: "var(--rec-soft)" }}
                  placeholder="Describe la observación o retroalimentación…"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1">Fortalezas (una por línea)</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] resize-none"
                  style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}
                  placeholder={"Participación activa\nExcelente presentación"}
                  value={form.strengthsText}
                  onChange={(e) => setForm((f) => ({ ...f, strengthsText: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Áreas de mejora (una por línea)</label>
                <textarea
                  rows={3}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50 resize-none"
                  placeholder={"Mejorar presentación de ejercicios\nMayor atención en clase"}
                  value={form.improvementsText}
                  onChange={(e) => setForm((f) => ({ ...f, improvementsText: e.target.value }))}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="feedback-form"
                disabled={saving}
                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                style={{ background: "var(--rec-primary)" }}
              >
                {saving ? "Guardando…" : editingId ? "Actualizar" : "Crear feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Detalle del feedback</h2>
              <button onClick={() => setDetailFeedback(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_STYLE[detailFeedback.tipo]}`}>
                  {detailFeedback.tipo.charAt(0) + detailFeedback.tipo.slice(1).toLowerCase()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[detailFeedback.estado]}`}>
                  {detailFeedback.estado === "PENDIENTE" ? "Pendiente" : "Atendida"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{detailFeedback.title}</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{detailFeedback.content}</p>
              {(detailFeedback.strengths?.items?.length ?? 0) > 0 && (
                <div className="rounded-lg p-3" style={{ background: "var(--rec-soft)", border: "1px solid var(--rec-soft)" }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--rec-primary-strong)" }}>Fortalezas</p>
                  <ul className="space-y-1">
                    {detailFeedback.strengths!.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm" style={{ color: "var(--rec-primary-strong)" }}>
                        <FiCheck className="w-4 h-4 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(detailFeedback.improvements?.items?.length ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Áreas de mejora</p>
                  <ul className="space-y-1">
                    {detailFeedback.improvements!.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-amber-700">
                        <FiArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailFeedback(null)}
                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
                style={{ background: "var(--rec-primary)" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-2">Eliminar feedback</h2>
            <p className="text-sm text-slate-600 mb-6">
              ¿Eliminar &ldquo;{deleteConfirm.title}&rdquo;? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { void onDelete(); }}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
