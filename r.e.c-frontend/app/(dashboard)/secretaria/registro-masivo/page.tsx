"use client";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type CreateUserDto, type BulkCreateResult } from "@/lib/usersApi";
import { getErrorMessage } from "@/lib/errors";
import api from "@/lib/axios";

type PreviewItem = CreateUserDto & { _row?: number; _error?: string; _selected?: boolean };
type ValidationIssue = { field: string; message: string; severity: "error" | "warning" };
type RowValidation = { row: number; issues: ValidationIssue[]; isValid: boolean };
type SupportedRole = NonNullable<CreateUserDto["role"]>;

type EditingRow = { rowIndex: number; field: keyof Omit<CreateUserDto, "role">; value: string };

function parseRole(value: string): SupportedRole | undefined {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "ESTUDIANTE" ||
    normalized === "PROFESOR" ||
    normalized === "SECRETARIA"
  ) {
    return normalized;
  }
  return undefined;
}

function parseCSV(text: string): PreviewItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const iNombres = idx("nombres");
  const iApellidos = idx("apellidos");
  const iEmail = idx("email");
  const iRole = idx("role");
  const iPassword = idx("password");
  const items: PreviewItem[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(",").map((c) => c.trim());
    if (cols.every((c) => c === "")) continue;
    const roleVal = iRole >= 0 ? (cols[iRole] || "").toUpperCase() : "";
    const item: PreviewItem = {
      nombres: iNombres >= 0 ? cols[iNombres] : "",
      apellidos: iApellidos >= 0 ? cols[iApellidos] : "",
      email: iEmail >= 0 ? cols[iEmail] : "",
      role: parseRole(roleVal),
      password: iPassword >= 0 ? (cols[iPassword] || undefined) : undefined,
      _row: r,
    };
    items.push(item);
  }
  return items;
}

async function buildXlsxBlob(
  rows: (string | number)[][],
  sheetName = "Sheet1",
): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  rows.forEach((r) => ws.addRow(r));
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function parseXLSX(file: File): Promise<PreviewItem[]> {
  const buf = await file.arrayBuffer();
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const headerRow = ws.getRow(1);
  const maxCol = Math.max(headerRow.actualCellCount, 1);
  const headers: string[] = [];
  for (let c = 1; c <= maxCol; c++) {
    headers.push(headerRow.getCell(c).text.trim());
  }
  const dataRows: Record<string, string>[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    for (let c = 1; c <= maxCol; c++) {
      const h = headers[c - 1];
      if (!h) continue;
      obj[h] = row.getCell(c).text.trim();
    }
    dataRows.push(obj);
  });
  return dataRows.map((row, idx) => {
    const get = (k: string) => {
      const key = Object.keys(row).find((x) => x.toLowerCase() === k.toLowerCase());
      return key ? row[key] : "";
    };
    const roleVal = (get("role") || "").toUpperCase();
    return {
      nombres: get("nombres"),
      apellidos: get("apellidos"),
      email: get("email"),
      role: parseRole(roleVal),
      password: get("password") || undefined,
      _row: idx + 1,
    } as PreviewItem;
  });
}

export default function RegistroMasivoPage() {
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateXlsxUrl, setTemplateXlsxUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<RowValidation[]>([]);
  const [registerOnlyValid, setRegisterOnlyValid] = useState(true);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [instDomain, setInstDomain] = useState<string | null>(null);

  // Obtener dominio de la institución del usuario actual
  useEffect(() => {
    api.get("/users/me").then((res) => {
      const dominio = res.data?.institution?.dominio;
      if (dominio) setInstDomain(dominio);
    }).catch(() => {});
  }, []);

  // Mejoras estructurales
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith(".csv")) {
        const parsed = parseCSV(text);
        setItems(parsed);
      } else if (file.name.toLowerCase().endsWith(".json")) {
        const data: unknown = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("El JSON debe ser un arreglo de usuarios");
        const normalized: PreviewItem[] = data.map((value, idx: number) => {
          const x = (typeof value === "object" && value !== null
            ? value
            : {}) as Record<string, unknown>;
          return {
            nombres: typeof x.nombres === "string" ? x.nombres : "",
            apellidos: typeof x.apellidos === "string" ? x.apellidos : "",
            email: typeof x.email === "string" ? x.email : "",
            role: parseRole(typeof x.role === "string" ? x.role : ""),
            password: typeof x.password === "string" ? x.password : undefined,
            _row: idx + 1,
          };
        });
        setItems(normalized);
      } else if (file.name.toLowerCase().endsWith(".xlsx")) {
        const parsed = await parseXLSX(file);
        setItems(parsed);
      } else {
        throw new Error("Formato no soportado. Usa CSV o JSON.");
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error leyendo archivo"));
      setItems([]);
    }
  }, []);

  const onSubmit = useCallback(async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUploadProgress(null);
    try {
      // Si hay filas seleccionadas explícitamente, usar solo esas; si no, usar lógica anterior
      let source: PreviewItem[] = [];
      if (selectedRows.size > 0) {
        source = items.filter((_, idx) => selectedRows.has(idx));
      } else if (registerOnlyValid) {
        source = items.filter((_, idx) => validation[idx]?.isValid);
      } else {
        source = items;
      }
      
      if (source.length === 0) {
        setError("No hay filas válidas o seleccionadas para registrar");
        setLoading(false);
        return;
      }

      const payload: CreateUserDto[] = source.map((item) => ({
        nombres: item.nombres,
        apellidos: item.apellidos,
        email: item.email,
        password: item.password,
        role: item.role,
      }));

      // Simular progreso durante la carga
      setUploadProgress({ current: 0, total: payload.length });
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (!prev) return null;
          return { ...prev, current: Math.min(prev.current + 1, prev.total - 1) };
        });
      }, 100);

      const res = await usersApi.bulkCreate(payload);
      clearInterval(progressInterval);
      setUploadProgress({ current: payload.length, total: payload.length });
      setResult(res);
      setSelectedRows(new Set());
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al registrar"));
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(null), 1000);
    }
  }, [items, registerOnlyValid, validation, selectedRows]);

  const templateCSV = useMemo(() => {
    const rows = [
      "nombres,apellidos,email,role",
      "Ana,Romero,ana.romero@colegio.edu.co,ESTUDIANTE",
      "Carlos,Lopez,carlos.lopez@colegio.edu.co,PROFESOR",
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    return URL.createObjectURL(blob);
  }, []);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    const headers = ["nombres", "apellidos", "email", "role"];
    const data = [
      ["Ana", "Romero", "ana.romero@colegio.edu.co", "ESTUDIANTE"],
      ["Carlos", "Lopez", "carlos.lopez@colegio.edu.co", "PROFESOR"],
    ];
    (async () => {
      try {
        const blob = await buildXlsxBlob([headers, ...data], "usuarios");
        const url = URL.createObjectURL(blob);
        if (!alive) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setTemplateXlsxUrl(url);
      } catch {
        if (alive) setTemplateXlsxUrl(null);
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  // Validación
  useEffect(() => {
    const isEmailValid = (v: string) => {
      if (!v || !v.includes("@")) return false;
      if (!instDomain) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const escaped = instDomain.replace(/\./g, "\\.");
      return new RegExp(`^[^\\s@]+@${escaped}$`, "i").test(v);
    };
    const domainLabel = instDomain ? `@${instDomain}` : "";
    const isRoleValid = (v?: string) => !v || ["ESTUDIANTE", "PROFESOR", "SECRETARIA"].includes(v.toUpperCase());

    // Duplicados en el archivo
    const emailCounts = new Map<string, number>();
    items.forEach((it) => {
      const e = (it.email || "").trim().toLowerCase();
      if (e) emailCounts.set(e, (emailCounts.get(e) || 0) + 1);
    });

    const rows: RowValidation[] = items.map((it, i) => {
      const issues: ValidationIssue[] = [];
      const role = (it.role || "ESTUDIANTE").toString().toUpperCase();
      if (!it.nombres?.trim()) issues.push({ field: "nombres", message: "Nombres es requerido", severity: "error" });
      if (!it.apellidos?.trim()) issues.push({ field: "apellidos", message: "Apellidos es requerido", severity: "error" });
      if (!it.email?.trim() || !isEmailValid(it.email)) {
        issues.push({ field: "email", message: instDomain ? `Correo inválido (debe terminar en ${domainLabel})` : "Correo inválido", severity: "error" });
      }
      if (!isRoleValid(it.role))
        issues.push({ field: "role", message: "Rol desconocido", severity: "error" });
      // Contraseña requerida solo para SECRETARIA
      if (role === "SECRETARIA" && !it.password?.trim()) {
        issues.push({ field: "password", message: "Contraseña requerida para Secretaría", severity: "error" });
      }

      // Duplicados: en archivo
      const eKey = (it.email || "").trim().toLowerCase();
      if (eKey && (emailCounts.get(eKey) || 0) > 1) {
        issues.push({ field: "email", message: "Correo duplicado en el archivo", severity: "error" });
      }

      // Duplicados: existentes en sistema
      if (eKey && existingEmails.has(eKey)) {
        issues.push({ field: "email", message: "Correo ya existe en el sistema", severity: "error" });
      }
      const isValid = issues.every((x) => x.severity !== "error");
      return { row: it._row || i + 1, issues, isValid };
    });
    setValidation(rows);
  }, [items, existingEmails, instDomain]);

  // Cargar usuarios existentes para validar duplicados (emails)
  useEffect(() => {
    let cancelled = false;
    async function loadExisting() {
      if (items.length === 0) {
        setExistingEmails(new Set());
        return;
      }
      try {
        const list = await usersApi.list();
        const eSet = new Set<string>();
        list.forEach((u) => {
          if (u.email) eSet.add(u.email.trim().toLowerCase());
        });
        if (!cancelled) {
          setExistingEmails(eSet);
        }
      } catch {
        if (!cancelled) {
          setExistingEmails(new Set());
        }
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  const invalidCount = validation.filter((v) => !v.isValid).length;
  const validCount = items.length - invalidCount;

  // Mejoras: filas a mostrar (normal o solo errores)
  const displayedItems = useMemo(() => {
    if (!showErrorsOnly) return items.slice(0, 20);
    return items.filter((_, idx) => !validation[idx]?.isValid).slice(0, 20);
  }, [items, validation, showErrorsOnly]);

  // Función para alternar selección de una fila
  function toggleRowSelection(idx: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  // Seleccionar todas las filas mostradas
  function selectAllDisplayed() {
    const next = new Set(selectedRows);
    displayedItems.forEach((_, idx) => {
      const actualIdx = items.indexOf(displayedItems[idx]);
      if (actualIdx >= 0) next.add(actualIdx);
    });
    setSelectedRows(next);
  }

  // Deseleccionar todas
  function clearSelection() {
    setSelectedRows(new Set());
  }

  // Editar campo de una fila
  function updateItemField(idx: number, field: keyof Omit<CreateUserDto, "role">, value: string) {
    setItems((prev) => [
      ...prev.slice(0, idx),
      { ...prev[idx], [field]: value || undefined },
      ...prev.slice(idx + 1),
    ]);
    setEditingRow(null);
  }

  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h1 className="sec-title">Registro Masivo de Usuarios</h1>
          <p className="sec-subtitle">Importa archivos, corrige en línea y registra cuentas con validación previa y trazabilidad de resultados.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href={templateCSV} download="plantilla-usuarios.csv" className="underline text-sm">Descargar plantilla CSV</a>
          {templateXlsxUrl && (
            <a href={templateXlsxUrl} download="plantilla-usuarios.xlsx" className="underline text-sm">Descargar plantilla Excel</a>
          )}
        </div>
      </div>

      <div className="sec-toolbar">
        <div className="sec-flow-nav">
          <span className="sec-flow-link">1. Subir archivo</span>
          <span className="sec-flow-link">2. Validar filas</span>
          <span className="sec-flow-link">3. Corregir en línea</span>
          <span className="sec-flow-link">4. Registrar</span>
        </div>
        <span className="sec-muted">Trabaja con selección por filas para un control más seguro en lotes grandes</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sec-card p-4 space-y-3">
          <h2 className="font-medium">Subir archivo</h2>
          <Input type="file" accept=".csv,.json,.xlsx" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }} />
          <p className="text-xs text-rec-text-muted">Formatos soportados: CSV con encabezados, Excel (.xlsx) o JSON (arreglo).</p>
          {error ? <p className="text-xs text-rec-danger-text">{error}</p> : null}
          <div className="sec-action-cluster">
            <label className="text-xs flex items-center gap-2">
              <input type="checkbox" checked={registerOnlyValid} onChange={(e) => setRegisterOnlyValid(e.target.checked)} /> Registrar sólo filas válidas
            </label>
            <Button 
              onClick={onSubmit} 
              disabled={(items.length === 0) || loading || (registerOnlyValid && invalidCount > 0 && selectedRows.size === 0)}
            >
              {loading ? "Procesando..." : (() => {
                const count = selectedRows.size > 0 ? selectedRows.size : (registerOnlyValid ? validCount : items.length);
                return `Registrar (${count} filas)`;
              })()}
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 sec-card p-4">
          <h2 className="font-medium mb-3">Vista previa ({items.length} filas)</h2>
          {items.length === 0 ? (
            <p className="text-xs text-rec-text-muted">Sube un archivo para ver la vista previa.</p>
          ) : (
            <div className="space-y-3">
              <div className="sec-toolbar">
                <label className="text-xs flex items-center gap-2">
                  <input type="checkbox" checked={showErrorsOnly} onChange={(e) => setShowErrorsOnly(e.target.checked)} /> 
                  Solo mostrar filas con errores ({invalidCount})
                </label>
                <div className="sec-toolbar-group">
                  <Button variant="secondary" size="sm" onClick={selectAllDisplayed} disabled={displayedItems.length === 0}>{selectedRows.size > 0 ? "Más filas" : "Seleccionar mostradas"}</Button>
                  <Button variant="secondary" size="sm" onClick={clearSelection} disabled={selectedRows.size === 0}>Limpiar selección ({selectedRows.size})</Button>
                </div>
              </div>

              {uploadProgress && (
                <div className="border rounded p-2 bg-rec-success-bg">
                  <div className="text-xs font-medium mb-1">Registrando: {uploadProgress.current}/{uploadProgress.total}</div>
                  <div className="w-full border rounded overflow-hidden" style={{ height: "4px" }}>
                    <div className="bg-rec-primary" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, height: "100%", transition: "width 0.3s" }} />
                  </div>
                </div>
              )}

              <div className="overflow-x-auto sec-table">
                <table className="min-w-full text-xs">
                  <thead className="bg-rec-bg-muted">
                    <tr>
                      <th className="p-2 text-left" style={{ width: "32px" }}>Sel.</th>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Nombres</th>
                      <th className="p-2 text-left">Apellidos</th>
                      <th className="p-2 text-left">Correo</th>
                      <th className="p-2 text-left">Rol</th>
                      <th className="p-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((it, displayIdx) => {
                      const actualIdx = items.indexOf(it);
                      const v = validation[actualIdx] || { issues: [], isValid: true };
                      const errText = v.issues
                        .filter((x) => x.severity === "error")
                        .map((x) => x.message)
                        .join("; ");
                      const isEditing = editingRow?.rowIndex === actualIdx;
                      const rowClass = v.isValid ? "bg-rec-bg-elevated" : "bg-rec-danger-bg";
                      
                      return (
                        <tr key={displayIdx} className={`border-t border-rec-border-default ${rowClass}`}>
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(actualIdx)}
                              onChange={() => toggleRowSelection(actualIdx)}
                            />
                          </td>
                          <td className="p-2">{it._row ?? actualIdx + 1}</td>
                          <td className="p-2">
                            {isEditing && editingRow.field === "nombres" ? (
                              <input
                                autoFocus
                                className="border rounded px-1 py-0 w-full"
                                value={editingRow.value}
                                onChange={(e) => setEditingRow({ ...editingRow, value: e.target.value })}
                                onBlur={() => updateItemField(actualIdx, "nombres", editingRow.value)}
                                onKeyDown={(e) => e.key === "Enter" && updateItemField(actualIdx, "nombres", editingRow.value)}
                              />
                            ) : (
                              <span onClick={() => setEditingRow({ rowIndex: actualIdx, field: "nombres", value: it.nombres })}>
                                {it.nombres}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing && editingRow.field === "apellidos" ? (
                              <input
                                autoFocus
                                className="border rounded px-1 py-0 w-full"
                                value={editingRow.value}
                                onChange={(e) => setEditingRow({ ...editingRow, value: e.target.value })}
                                onBlur={() => updateItemField(actualIdx, "apellidos", editingRow.value)}
                                onKeyDown={(e) => e.key === "Enter" && updateItemField(actualIdx, "apellidos", editingRow.value)}
                              />
                            ) : (
                              <span onClick={() => setEditingRow({ rowIndex: actualIdx, field: "apellidos", value: it.apellidos })}>
                                {it.apellidos}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing && editingRow.field === "email" ? (
                              <input
                                autoFocus
                                className="border rounded px-1 py-0 w-full"
                                value={editingRow.value}
                                onChange={(e) => setEditingRow({ ...editingRow, value: e.target.value })}
                                onBlur={() => updateItemField(actualIdx, "email", editingRow.value)}
                                onKeyDown={(e) => e.key === "Enter" && updateItemField(actualIdx, "email", editingRow.value)}
                              />
                            ) : (
                              <span onClick={() => setEditingRow({ rowIndex: actualIdx, field: "email", value: it.email })}>
                                {it.email}
                              </span>
                            )}
                          </td>
                          <td className="p-2">{it.role || "ESTUDIANTE"}</td>
                          <td className="p-2">
                            {errText ? <div className="text-rec-danger-text text-xs">{errText}</div> : <span className="text-rec-success-text text-xs">✓</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-rec-text-secondary">
            Válidas: {validCount} · Inválidas: {invalidCount}
            {selectedRows.size > 0 && ` · Seleccionadas: ${selectedRows.size}`}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Button variant="secondary" onClick={() => {
              // Exportar errores a CSV
              const rows = validation.flatMap((v) => v.issues.filter((i) => i.severity === "error").map((i) => [v.row, i.field, i.severity, i.message]));
              const header = "row,field,severity,message";
              const csv = [header, ...rows.map((r) => r.map((c) => String(c).replace(/,/g, " ")).join(","))].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "errores-registro-masivo.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}>Descargar errores CSV</Button>
            <Button variant="secondary" onClick={() => {
              void (async () => {
                const header = ["row", "field", "severity", "message"];
                const rows = validation.flatMap((v) =>
                  v.issues
                    .filter((i) => i.severity === "error")
                    .map((i) => [v.row, i.field, i.severity, i.message] as (string | number)[]),
                );
                const blob = await buildXlsxBlob([header, ...rows], "errores");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "errores-registro-masivo.xlsx";
                a.click();
                URL.revokeObjectURL(url);
              })();
            }}>Descargar errores Excel</Button>
          </div>
        </div>
      </div>

      <div className="sec-card p-4">
        <h2 className="font-medium mb-2">Resultado</h2>
        {!result ? (
          <p className="text-xs text-rec-text-muted">Se mostrará el resumen después de registrar.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">Creados: {result.created} · Fallidos: {result.failed}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-rec-border-default text-xs">
                <thead className="bg-rec-bg-muted">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, idx) => (
                    <tr key={idx} className="border-t border-rec-border-default">
                      <td className="p-2">{r.index + 1}</td>
                      <td className="p-2">{r.id ? "OK" : "ERROR"}</td>
                      <td className="p-2 font-mono">{r.codigo ?? "—"}</td>
                      <td className="p-2">{r.id ? `ID ${r.id}` : (r.error || "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.created > 0 && (
              <p className="mt-2 text-xs text-rec-warning-text bg-rec-warning-bg border border-rec-warning-border rounded-lg p-3">
                <strong>Importante:</strong> El código de cada usuario es su contraseña inicial. Comparta los códigos con los usuarios para que puedan acceder a la plataforma.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}