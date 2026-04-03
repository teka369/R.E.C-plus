"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/errors";

type Institution = {
  publicId: string;
  nombre: string;
  slug: string;
  codigo?: string | null;
  dominio?: string | null;
  maxUsers: number;
  usersCount: number;
  activa: boolean;
};

type AcademicPeriod = {
  id: number;
  nombre: string;
  codigo: string;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
};

type SortKey = "nombre" | "slug" | "activa" | "users" | "maxUsers";
type SortDirection = "asc" | "desc";

type SecretariaForm = {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
};

type ProvisionForm = {
  institutionNombre: string;
  institutionSlug: string;
  institutionDominio: string;
  secretarias: SecretariaForm[];
};

const emptySecretaria = (): SecretariaForm => ({
  id: Math.random().toString(36).substr(2, 9),
  nombres: "",
  apellidos: "",
  email: "",
  password: "",
});

const emptyProvision: ProvisionForm = {
  institutionNombre: "",
  institutionSlug: "",
  institutionDominio: "",
  secretarias: [emptySecretaria()],
};

const slugPattern = /^[a-z0-9-]+$/;

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

export default function SuperAdminDashboardPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [provisionForm, setProvisionForm] = useState<ProvisionForm>(emptyProvision);
  const [provisionSlugTouched, setProvisionSlugTouched] = useState(false);

  const [provisioning, setProvisioning] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [savingInstitutionId, setSavingInstitutionId] = useState<string | null>(null);
  const [editingInstitutionId, setEditingInstitutionId] = useState<string | null>(null);
  const [editingInstitutionNombre, setEditingInstitutionNombre] = useState("");
  const [editingInstitutionSlug, setEditingInstitutionSlug] = useState("");
  const [editingInstitutionDominio, setEditingInstitutionDominio] = useState("");
  const [editingMaxUsersId, setEditingMaxUsersId] = useState<string | null>(null);
  const [editingMaxUsersValue, setEditingMaxUsersValue] = useState<string>("");

  const [success, setSuccess] = useState<string | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({});
  const [periods, setPeriods] = useState<Record<string, AcademicPeriod[]>>({});
  const [loadingPeriods, setLoadingPeriods] = useState<Record<string, boolean>>({});
  const [creatingPeriod, setCreatingPeriod] = useState<Record<string, boolean>>({});
  const [periodForm, setPeriodForm] = useState<Record<string, { nombre: string; codigo: string; fechaInicio: string; fechaFin: string }>>({});
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchPeriods = async (institutionId: string) => {
    setLoadingPeriods((p) => ({ ...p, [institutionId]: true }));
    try {
      const res = await api.get<AcademicPeriod[]>(`/institutions/${institutionId}/periods`);
      setPeriods((p) => ({ ...p, [institutionId]: res.data }));
    } catch {
      // silently fail
    } finally {
      setLoadingPeriods((p) => ({ ...p, [institutionId]: false }));
    }
  };

  const togglePeriods = (institutionId: string) => {
    const isExpanded = expandedPeriods[institutionId];
    setExpandedPeriods((p) => ({ ...p, [institutionId]: !isExpanded }));
    if (!isExpanded && !periods[institutionId]) {
      void fetchPeriods(institutionId);
    }
  };

  const handleCreatePeriod = async (institutionId: string) => {
    const form = periodForm[institutionId];
    if (!form?.nombre || !form?.codigo || !form?.fechaInicio || !form?.fechaFin) {
      setError("Todos los campos del periodo son requeridos");
      return;
    }
    setCreatingPeriod((p) => ({ ...p, [institutionId]: true }));
    setError(null);
    try {
      await api.post(`/institutions/${institutionId}/periods`, form);
      setSuccess("Periodo creado y activado correctamente.");
      setPeriodForm((p) => ({ ...p, [institutionId]: { nombre: "", codigo: "", fechaInicio: "", fechaFin: "" } }));
      await fetchPeriods(institutionId);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo crear el periodo"));
    } finally {
      setCreatingPeriod((p) => ({ ...p, [institutionId]: false }));
    }
  };

  const handleActivatePeriod = async (institutionId: string, periodId: number) => {
    setError(null);
    try {
      await api.patch(`/institutions/${institutionId}/periods/${periodId}/activate`);
      setSuccess("Periodo activado.");
      await fetchPeriods(institutionId);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo activar el periodo"));
    }
  };

  const handleClosePeriod = async (institutionId: string, periodId: number) => {
    setError(null);
    try {
      await api.patch(`/institutions/${institutionId}/periods/${periodId}/close`);
      setSuccess("Periodo cerrado.");
      await fetchPeriods(institutionId);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cerrar el periodo"));
    }
  };

  const handleDeleteInstitution = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/institutions/${deleteTarget.publicId}`);
      setSuccess(`Institucion "${deleteTarget.nombre}" eliminada con todos sus datos.`);
      setDeleteTarget(null);
      setDeleteConfirmText("");
      await fetchInstitutions();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo eliminar la institucion"));
    } finally {
      setDeleting(false);
    }
  };

  const fetchInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Institution[]>("/institutions");
      setInstitutions(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo cargar instituciones"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInstitutions();
  }, []);

  const activeCount = useMemo(
    () => institutions.filter((inst) => inst.activa).length,
    [institutions],
  );

  const filteredInstitutions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return institutions.filter((inst) => {
      const matchTerm =
        term.length === 0 ||
        inst.nombre.toLowerCase().includes(term) ||
        inst.slug.toLowerCase().includes(term) ||
        (inst.codigo || "").toLowerCase().includes(term);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && inst.activa) ||
        (statusFilter === "INACTIVE" && !inst.activa);

      return matchTerm && matchStatus;
    });
  }, [institutions, searchTerm, statusFilter]);

  const sortedInstitutions = useMemo(() => {
    const sorted = [...filteredInstitutions];
    sorted.sort((a, b) => {
      let left: string | number | boolean = "";
      let right: string | number | boolean = "";

      if (sortKey === "nombre") {
        left = a.nombre.toLowerCase();
        right = b.nombre.toLowerCase();
      } else if (sortKey === "slug") {
        left = a.slug.toLowerCase();
        right = b.slug.toLowerCase();
      } else if (sortKey === "activa") {
        left = a.activa;
        right = b.activa;
      } else if (sortKey === "users") {
        left = a.usersCount ?? 0;
        right = b.usersCount ?? 0;
      } else if (sortKey === "maxUsers") {
        left = a.maxUsers ?? 0;
        right = b.maxUsers ?? 0;
      }

      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredInstitutions, sortDirection, sortKey]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedInstitutions.length / pageSize));
  }, [pageSize, sortedInstitutions.length]);

  const pagedInstitutions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedInstitutions.slice(start, start + pageSize);
  }, [page, pageSize, sortedInstitutions]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortKey, sortDirection, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSort = (nextKey: SortKey) => {
    if (nextKey === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };



  const handleAddSecretaria = () => {
    setProvisionForm((p) => ({
      ...p,
      secretarias: [...p.secretarias, emptySecretaria()],
    }));
  };

  const handleRemoveSecretaria = (id: string) => {
    setProvisionForm((p) => ({
      ...p,
      secretarias: p.secretarias.filter((s) => s.id !== id),
    }));
  };

  const handleUpdateSecretaria = (id: string, field: keyof SecretariaForm, value: string) => {
    setProvisionForm((p) => ({
      ...p,
      secretarias: p.secretarias.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    setSuccess(null);
    setError(null);

    if (!slugPattern.test(provisionForm.institutionSlug)) {
      setError("El slug solo permite minusculas, numeros y guiones (ej: colegio-norte)");
      setProvisioning(false);
      return;
    }

    if (provisionForm.secretarias.length === 0) {
      setError("Debe agregar al menos una secretaria");
      setProvisioning(false);
      return;
    }

    try {
      await api.post("/institutions/provision", {
        institution: {
          nombre: provisionForm.institutionNombre,
          slug: provisionForm.institutionSlug,
          dominio: provisionForm.institutionDominio.trim() || undefined,
        },
        secretarias: provisionForm.secretarias.map((s) => ({
          nombres: s.nombres,
          apellidos: s.apellidos,
          email: s.email,
          password: s.password,
        })),
      });
      setSuccess("Institucion provisionada con secretarias.");
      setProvisionForm(emptyProvision);
      setProvisionSlugTouched(false);
      await fetchInstitutions();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo provisionar la institucion"));
    } finally {
      setProvisioning(false);
    }
  };

  const handleToggleActive = async (inst: Institution) => {
    setTogglingId(inst.publicId);
    setSuccess(null);
    setError(null);
    try {
      await api.patch(`/institutions/${inst.publicId}`, {
        activa: !inst.activa,
      });
      setSuccess(`Institucion ${inst.activa ? "inactivada" : "activada"}.`);
      await fetchInstitutions();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar el estado"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditInstitution = (inst: Institution) => {
    setEditingInstitutionId(inst.publicId);
    setEditingInstitutionNombre(inst.nombre);
    setEditingInstitutionSlug(inst.slug);
    setEditingInstitutionDominio(inst.dominio ?? "");
    setSuccess(null);
    setError(null);
  };

  const handleCancelEditInstitution = () => {
    setEditingInstitutionId(null);
    setEditingInstitutionNombre("");
    setEditingInstitutionSlug("");
    setEditingInstitutionDominio("");
  };

  const handleSaveInstitution = async (inst: Institution) => {
    const nombre = editingInstitutionNombre.trim();
    const slug = normalizeSlug(editingInstitutionSlug);

    if (nombre.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (!slugPattern.test(slug)) {
      setError("El slug solo permite minusculas, numeros y guiones (ej: colegio-norte)");
      return;
    }
    const dominio = editingInstitutionDominio.trim();
    if (nombre === inst.nombre && slug === inst.slug && dominio === (inst.dominio ?? "")) {
      handleCancelEditInstitution();
      return;
    }

    setSavingInstitutionId(inst.publicId);
    setSuccess(null);
    setError(null);
    try {
      await api.patch(`/institutions/${inst.publicId}`, {
        nombre,
        slug,
        dominio: dominio || undefined,
      });
      setSuccess("Institucion actualizada correctamente.");
      handleCancelEditInstitution();
      await fetchInstitutions();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar la institucion"));
    } finally {
      setSavingInstitutionId(null);
    }
  };

  const handleEditMaxUsers = (inst: Institution) => {
    setEditingMaxUsersId(inst.publicId);
    setEditingMaxUsersValue(String(inst.maxUsers));
  };

  const handleSaveMaxUsers = async (inst: Institution) => {
    const nextMax = parseInt(editingMaxUsersValue, 10);
    if (isNaN(nextMax) || nextMax < 1) {
      setError("El límite debe ser un número mayor a 0");
      return;
    }
    if (nextMax === inst.maxUsers) {
      setEditingMaxUsersId(null);
      return;
    }

    setSuccess(null);
    setError(null);
    try {
      await api.patch(`/institutions/${inst.publicId}`, {
        maxUsers: nextMax,
      });
      setSuccess(`Límite de usuarios actualizado a ${nextMax}.`);
      setEditingMaxUsersId(null);
      await fetchInstitutions();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar el límite"));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">SaaS Platform</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Panel Super Admin</h1>
              <p className="mt-2 text-sm text-slate-600">
                Crea, provisiona y controla el ciclo de vida de instituciones multi-tenant.
              </p>
            </div>
            <a
              href="/profile"
              className="rounded-lg bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-200"
            >
              📋 Mi Perfil
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Instituciones</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{institutions.length}</p>
            </article>
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Activas</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
            </article>
            <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-700">Inactivas</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{institutions.length - activeCount}</p>
            </article>
          </div>
        </header>

        <section className="grid gap-6">
          <form onSubmit={handleProvision} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Provisionar institución</h2>
            <p className="mt-1 text-sm text-slate-500">Crea tenant + secretarias</p>

            <div className="mt-4 grid gap-3">
              <input
                value={provisionForm.institutionNombre}
                onChange={(e) => {
                  const institutionNombre = e.target.value;
                  setProvisionForm((p) => ({
                    ...p,
                    institutionNombre,
                    institutionSlug: provisionSlugTouched
                      ? p.institutionSlug
                      : normalizeSlug(institutionNombre),
                  }));
                }}
                placeholder="Nombre institucion"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <input
                value={provisionForm.institutionSlug}
                onChange={(e) => {
                  const institutionSlug = normalizeSlug(e.target.value);
                  setProvisionForm((p) => ({ ...p, institutionSlug }));
                  setProvisionSlugTouched(institutionSlug.length > 0);
                }}
                placeholder="Slug (colegio-norte)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <input
                value={provisionForm.institutionDominio}
                onChange={(e) =>
                  setProvisionForm((p) => ({ ...p, institutionDominio: e.target.value.trim().toLowerCase().replace(/^@+/, "") }))
                }
                placeholder="Dominio de correo (ej: colegio.edu.co)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="h-px bg-slate-200" />
              <h3 className="font-semibold text-slate-700">Secretarias</h3>

              {provisionForm.secretarias.map((secretaria, idx) => (
                <div key={secretaria.id} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Secretaria {idx + 1}</span>
                    {provisionForm.secretarias.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSecretaria(secretaria.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        ✕ Remover
                      </button>
                    )}
                  </div>
                  <input
                    value={secretaria.nombres}
                    onChange={(e) => handleUpdateSecretaria(secretaria.id, "nombres", e.target.value)}
                    placeholder="Nombres"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                  <input
                    value={secretaria.apellidos}
                    onChange={(e) => handleUpdateSecretaria(secretaria.id, "apellidos", e.target.value)}
                    placeholder="Apellidos"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="email"
                    value={secretaria.email}
                    onChange={(e) => handleUpdateSecretaria(secretaria.id, "email", e.target.value)}
                    placeholder="Correo"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="password"
                    value={secretaria.password}
                    onChange={(e) => handleUpdateSecretaria(secretaria.id, "password", e.target.value)}
                    placeholder="Contraseña"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddSecretaria}
                className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                + Agregar secretaria
              </button>
            </div>

            <button
              type="submit"
              disabled={provisioning}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {provisioning ? "Provisionando..." : "Provisionar"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-slate-900">Instituciones registradas</h2>
          <p className="mt-1 text-sm text-slate-500">Gestion operativa con activacion e inactivacion.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, slug o codigo"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Solo activas</option>
              <option value="INACTIVE">Solo inactivas</option>
            </select>
          </div>

          {loading ? <p className="mt-4 text-sm text-slate-500">Cargando...</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
          {!loading && !error ? (
            <p className="mt-2 text-xs text-slate-500">
              Mostrando {sortedInstitutions.length} de {institutions.length} instituciones.
            </p>
          ) : null}

          {!loading && !error ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4">
                      <button onClick={() => handleSort("nombre")} className="font-semibold">
                        Institucion{sortIndicator("nombre")}
                      </button>
                    </th>
                    <th className="py-2 pr-4">
                      <button onClick={() => handleSort("slug")} className="font-semibold">
                        Slug{sortIndicator("slug")}
                      </button>
                    </th>
                    <th className="py-2 pr-4 font-semibold">Dominio</th>
                    <th className="py-2 pr-4">
                      <button onClick={() => handleSort("users")} className="font-semibold">
                        Usuarios{sortIndicator("users")}
                      </button>
                    </th>
                    <th className="py-2 pr-4">
                      <button onClick={() => handleSort("maxUsers")} className="font-semibold">
                        Limite{sortIndicator("maxUsers")}
                      </button>
                    </th>
                    <th className="py-2 pr-4">
                      <button onClick={() => handleSort("activa")} className="font-semibold">
                        Estado{sortIndicator("activa")}
                      </button>
                    </th>
                    <th className="py-2 pr-4 font-semibold">Periodo</th>
                    <th className="py-2 pr-4">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedInstitutions.map((inst, idx) => (
                    <tr key={inst.publicId ?? `inst-${idx}`} className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 pr-4">
                        {editingInstitutionId === inst.publicId ? (
                          <input
                            value={editingInstitutionNombre}
                            onChange={(e) => setEditingInstitutionNombre(e.target.value)}
                            className="w-52 rounded-md border border-slate-300 px-2 py-1 text-xs"
                            autoFocus
                          />
                        ) : (
                          inst.nombre
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {editingInstitutionId === inst.publicId ? (
                          <input
                            value={editingInstitutionSlug}
                            onChange={(e) => setEditingInstitutionSlug(normalizeSlug(e.target.value))}
                            className="w-52 rounded-md border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          inst.slug
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {editingInstitutionId === inst.publicId ? (
                          <input
                            value={editingInstitutionDominio}
                            onChange={(e) => setEditingInstitutionDominio(e.target.value.trim().toLowerCase().replace(/^@+/, ""))}
                            placeholder="dominio.edu.co"
                            className="w-44 rounded-md border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">{inst.dominio || "—"}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{inst.usersCount}</td>
                      <td className="py-3 pr-4">
                        {editingMaxUsersId === inst.publicId ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              value={editingMaxUsersValue}
                              onChange={(e) => setEditingMaxUsersValue(e.target.value)}
                              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => void handleSaveMaxUsers(inst)}
                              className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingMaxUsersId(null)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditMaxUsers(inst)}
                            className="text-xs font-semibold text-sky-700 hover:underline"
                          >
                            {inst.maxUsers} ↻
                          </button>
                        )}
                      </td>
                      <td className="py-3 pr-4">{inst.activa ? "Activa" : "Inactiva"}</td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => togglePeriods(inst.publicId)}
                          className="text-xs font-semibold text-sky-700 hover:underline"
                        >
                          {expandedPeriods[inst.publicId] ? "Ocultar" : "Periodos"} ▾
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        {editingInstitutionId === inst.publicId ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => void handleSaveInstitution(inst)}
                              disabled={savingInstitutionId === inst.publicId}
                              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {savingInstitutionId === inst.publicId ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                              onClick={handleCancelEditInstitution}
                              disabled={savingInstitutionId === inst.publicId}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditInstitution(inst)}
                              disabled={
                                togglingId === inst.publicId ||
                                editingMaxUsersId === inst.publicId ||
                                savingInstitutionId === inst.publicId
                              }
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => void handleToggleActive(inst)}
                              disabled={
                                togglingId === inst.publicId ||
                                editingMaxUsersId === inst.publicId ||
                                editingInstitutionId === inst.publicId ||
                                savingInstitutionId === inst.publicId
                              }
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
                            >
                              {togglingId === inst.publicId
                                ? "Actualizando..."
                                : inst.activa
                                ? "Inactivar"
                                : "Activar"}
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(inst); setDeleteConfirmText(""); }}
                              disabled={
                                editingInstitutionId === inst.publicId ||
                                savingInstitutionId === inst.publicId
                              }
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagedInstitutions.map((inst) =>
                expandedPeriods[inst.publicId] ? (
                  <div key={`periods-${inst.publicId}`} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700">Periodos academicos — {inst.nombre}</h4>

                    {loadingPeriods[inst.publicId] ? (
                      <p className="mt-2 text-xs text-slate-500">Cargando periodos...</p>
                    ) : (periods[inst.publicId] ?? []).length === 0 ? (
                      <p className="mt-2 text-xs text-amber-700">No hay periodos creados. Crea uno para poder asignar estudiantes a grupos.</p>
                    ) : (
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="py-1 pr-3 text-left">Codigo</th>
                              <th className="py-1 pr-3 text-left">Nombre</th>
                              <th className="py-1 pr-3 text-left">Estado</th>
                              <th className="py-1 pr-3 text-left">Inicio</th>
                              <th className="py-1 pr-3 text-left">Fin</th>
                              <th className="py-1 pr-3 text-left">Accion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(periods[inst.publicId] ?? []).map((p) => (
                              <tr key={p.id} className="border-b border-slate-100">
                                <td className="py-1.5 pr-3 font-mono">{p.codigo}</td>
                                <td className="py-1.5 pr-3">{p.nombre}</td>
                                <td className="py-1.5 pr-3">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    p.estado === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                                    p.estado === "CLOSED" ? "bg-slate-200 text-slate-600" :
                                    "bg-amber-100 text-amber-700"
                                  }`}>
                                    {p.estado === "ACTIVE" ? "Activo" : p.estado === "CLOSED" ? "Cerrado" : p.estado}
                                  </span>
                                </td>
                                <td className="py-1.5 pr-3">{new Date(p.fechaInicio).toLocaleDateString()}</td>
                                <td className="py-1.5 pr-3">{new Date(p.fechaFin).toLocaleDateString()}</td>
                                <td className="py-1.5 pr-3">
                                  {p.estado !== "ACTIVE" ? (
                                    <button
                                      onClick={() => void handleActivatePeriod(inst.publicId, p.id)}
                                      className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
                                    >
                                      Activar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => void handleClosePeriod(inst.publicId, p.id)}
                                      className="rounded bg-slate-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-slate-600"
                                    >
                                      Cerrar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input
                        value={periodForm[inst.publicId]?.nombre ?? ""}
                        onChange={(e) => setPeriodForm((p) => ({ ...p, [inst.publicId]: { ...(p[inst.publicId] ?? { nombre: "", codigo: "", fechaInicio: "", fechaFin: "" }), nombre: e.target.value } }))}
                        placeholder="Nombre (ej: 2026 - I)"
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        value={periodForm[inst.publicId]?.codigo ?? ""}
                        onChange={(e) => setPeriodForm((p) => ({ ...p, [inst.publicId]: { ...(p[inst.publicId] ?? { nombre: "", codigo: "", fechaInicio: "", fechaFin: "" }), codigo: e.target.value } }))}
                        placeholder="Codigo (ej: 2026-1)"
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="date"
                        value={periodForm[inst.publicId]?.fechaInicio ?? ""}
                        onChange={(e) => setPeriodForm((p) => ({ ...p, [inst.publicId]: { ...(p[inst.publicId] ?? { nombre: "", codigo: "", fechaInicio: "", fechaFin: "" }), fechaInicio: e.target.value } }))}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="date"
                        value={periodForm[inst.publicId]?.fechaFin ?? ""}
                        onChange={(e) => setPeriodForm((p) => ({ ...p, [inst.publicId]: { ...(p[inst.publicId] ?? { nombre: "", codigo: "", fechaInicio: "", fechaFin: "" }), fechaFin: e.target.value } }))}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => void handleCreatePeriod(inst.publicId)}
                      disabled={creatingPeriod[inst.publicId]}
                      className="mt-2 rounded bg-emerald-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {creatingPeriod[inst.publicId] ? "Creando..." : "Crear periodo activo"}
                    </button>
                  </div>
                ) : null,
              )}
            </div>
          ) : null}

          {!loading && !error && sortedInstitutions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No hay instituciones para los filtros aplicados.</p>
          ) : null}

          {!loading && !error && sortedInstitutions.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <span>Filas por pagina</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span>
                  Pagina {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Eliminar institucion</h3>
                <p className="text-sm text-slate-600">{deleteTarget.nombre}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">Esta accion es IRREVERSIBLE.</p>
              <p className="mt-1 text-xs text-red-700">
                Se eliminara permanentemente:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-700">
                <li>Todos los usuarios ({deleteTarget.usersCount})</li>
                <li>Grados, grupos y materias</li>
                <li>Periodos academicos y notas</li>
                <li>Materiales de estudio y horarios</li>
                <li>Mensajes, notificaciones y feedback</li>
                <li>Solicitudes de recuperacion</li>
              </ul>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Escribe <span className="font-bold text-red-700">{deleteTarget.nombre}</span> para confirmar:
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget.nombre}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                autoFocus
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDeleteInstitution()}
                disabled={deleteConfirmText !== deleteTarget.nombre || deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Eliminando..." : "Eliminar permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
