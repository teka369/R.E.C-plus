"use client";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usersApi, type CreateUserDto, type BulkCreateResult } from "@/lib/usersApi";
import * as XLSX from "xlsx";
import { getErrorMessage } from "@/lib/errors";

type PreviewItem = CreateUserDto & { _row?: number; _error?: string };
type ValidationIssue = { field: string; message: string; severity: "error" | "warning" };
type RowValidation = { row: number; issues: ValidationIssue[]; isValid: boolean };
type SupportedRole = NonNullable<CreateUserDto["role"]>;

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
  const iDoc = idx("documento_identidad");
  const iTelefono = idx("telefono");
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
      documento_identidad: iDoc >= 0 ? cols[iDoc] : "",
      telefono: iTelefono >= 0 ? cols[iTelefono] || undefined : undefined,
      role: parseRole(roleVal),
      password: iPassword >= 0 ? (cols[iPassword] || undefined) : undefined,
      _row: r,
    };
    items.push(item);
  }
  return items;
}

async function parseXLSX(file: File): Promise<PreviewItem[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const wsName = wb.SheetNames[0];
  if (!wsName) return [];
  const ws = wb.Sheets[wsName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });
  // Normalizamos claves a minúsculas
  return rows.map((row, idx) => {
    const get = (k: string) => {
      const key = Object.keys(row).find((x) => x.toLowerCase() === k.toLowerCase());
      return key ? String(row[key]).trim() : "";
    };
    const roleVal = (get("role") || "").toUpperCase();
    return {
      nombres: get("nombres"),
      apellidos: get("apellidos"),
      email: get("email"),
      documento_identidad: get("documento_identidad"),
      telefono: get("telefono") || undefined,
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
  const [existingDocs, setExistingDocs] = useState<Set<string>>(new Set());

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
            documento_identidad:
              typeof x.documento_identidad === "string"
                ? x.documento_identidad
                : "",
            telefono: typeof x.telefono === "string" ? x.telefono : undefined,
            role: parseRole(typeof x.role === "string" ? x.role : ""),
            password: typeof x.password === "string" ? x.password : undefined,
            _row: idx + 1,
          };
        });
        setItems(normalized);
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
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
    try {
      const source: PreviewItem[] = registerOnlyValid
        ? items.filter((_, idx) => validation[idx]?.isValid)
        : items;
      const payload: CreateUserDto[] = source.map((item) => ({
        nombres: item.nombres,
        apellidos: item.apellidos,
        email: item.email,
        documento_identidad: item.documento_identidad,
        telefono: item.telefono,
        password: item.password,
        role: item.role,
      }));
      const res = await usersApi.bulkCreate(payload);
      setResult(res);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al registrar"));
    } finally {
      setLoading(false);
    }
  }, [items, registerOnlyValid, validation]);

  const templateCSV = useMemo(() => {
    const rows = [
      "nombres,apellidos,email,documento_identidad,telefono,role,password",
      "Ana,Romero,ana.romero@colegio.edu.co,12345678,3130000000,ESTUDIANTE,",
      "Carlos,Lopez,carlos.lopez@colegio.edu.co,22223333,,PROFESOR,segura2024",
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    return URL.createObjectURL(blob);
  }, []);

  useEffect(() => {
    // Generar plantilla Excel
    const headers = ["nombres", "apellidos", "email", "documento_identidad", "telefono", "role", "password"];
    const data = [
      ["Ana", "Romero", "ana.romero@colegio.edu.co", "12345678", "3130000000", "ESTUDIANTE", ""],
      ["Carlos", "Lopez", "carlos.lopez@colegio.edu.co", "22223333", "", "PROFESOR", "segura2024"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "usuarios");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    setTemplateXlsxUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  // Validación
  useEffect(() => {
    const instDomain = "@iejavieralondonobarriosevilla.edu.co";
    const isEmailValid = (v: string) => /^[^\s@]+@iejavieralondonobarriosevilla\.edu\.co$/.test(v);
    const isPhoneDigits = (v?: string) => (v ? /^[0-9]{10,15}$/.test(v) : false);
    const isRoleValid = (v?: string) => !v || ["ESTUDIANTE", "PROFESOR", "SECRETARIA"].includes(v.toUpperCase());

    // Duplicados en el archivo
    const emailCounts = new Map<string, number>();
    const docCounts = new Map<string, number>();
    items.forEach((it) => {
      const e = (it.email || "").trim().toLowerCase();
      const d = (it.documento_identidad || "").trim();
      if (e) emailCounts.set(e, (emailCounts.get(e) || 0) + 1);
      if (d) docCounts.set(d, (docCounts.get(d) || 0) + 1);
    });

    const rows: RowValidation[] = items.map((it, i) => {
      const issues: ValidationIssue[] = [];
      const role = (it.role || "ESTUDIANTE").toString().toUpperCase();
      if (!it.nombres?.trim()) issues.push({ field: "nombres", message: "Nombres es requerido", severity: "error" });
      if (!it.apellidos?.trim()) issues.push({ field: "apellidos", message: "Apellidos es requerido", severity: "error" });
      if (!it.email?.trim() || !isEmailValid(it.email)) {
        issues.push({ field: "email", message: `Correo inválido (debe terminar en ${instDomain})`, severity: "error" });
      }
      if (!it.documento_identidad?.trim()) issues.push({ field: "documento_identidad", message: "Documento es requerido", severity: "error" });
      // Teléfono: obligatorio para PROFESOR; si está, validar longitud 10-15 dígitos
      if (role === "PROFESOR") {
        if (!it.telefono?.trim()) {
          issues.push({ field: "telefono", message: "Teléfono es requerido para profesores", severity: "error" });
        } else if (!isPhoneDigits(it.telefono)) {
          issues.push({ field: "telefono", message: "Teléfono debe tener 10-15 dígitos", severity: "error" });
        }
      } else if (it.telefono && !isPhoneDigits(it.telefono)) {
        issues.push({ field: "telefono", message: "Teléfono debe tener 10-15 dígitos", severity: "warning" });
      }
      if (!isRoleValid(it.role))
        issues.push({ field: "role", message: "Rol desconocido", severity: "error" });
      // Contraseña requerida para PROFESOR y SECRETARIA; para ESTUDIANTE si falta, se usa documento
      if (["PROFESOR", "SECRETARIA"].includes(role) && !it.password?.trim()) {
        issues.push({ field: "password", message: "Contraseña requerida para este rol", severity: "error" });
      }

      // Duplicados: en archivo
      const eKey = (it.email || "").trim().toLowerCase();
      const dKey = (it.documento_identidad || "").trim();
      if (eKey && (emailCounts.get(eKey) || 0) > 1) {
        issues.push({ field: "email", message: "Correo duplicado en el archivo", severity: "error" });
      }
      if (dKey && (docCounts.get(dKey) || 0) > 1) {
        issues.push({ field: "documento_identidad", message: "Documento duplicado en el archivo", severity: "error" });
      }

      // Duplicados: existentes en sistema
      if (eKey && existingEmails.has(eKey)) {
        issues.push({ field: "email", message: "Correo ya existe en el sistema", severity: "error" });
      }
      if (dKey && existingDocs.has(dKey)) {
        issues.push({ field: "documento_identidad", message: "Documento ya existe en el sistema", severity: "error" });
      }
      const isValid = issues.every((x) => x.severity !== "error");
      return { row: it._row || i + 1, issues, isValid };
    });
    setValidation(rows);
  }, [items, existingEmails, existingDocs]);

  // Cargar usuarios existentes para validar duplicados (emails y documentos)
  useEffect(() => {
    let cancelled = false;
    async function loadExisting() {
      if (items.length === 0) {
        setExistingEmails(new Set());
        setExistingDocs(new Set());
        return;
      }
      try {
        const list = await usersApi.list();
        const eSet = new Set<string>();
        const dSet = new Set<string>();
        list.forEach((u) => {
          if (u.email) eSet.add(u.email.trim().toLowerCase());
          if (u.documento_identidad) dSet.add(u.documento_identidad.trim());
        });
        if (!cancelled) {
          setExistingEmails(eSet);
          setExistingDocs(dSet);
        }
      } catch {
        // Si falla la carga, mantener sets vacíos (no bloquea la validación básica)
        if (!cancelled) {
          setExistingEmails(new Set());
          setExistingDocs(new Set());
        }
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  const preview = items.slice(0, 20);
  const invalidCount = validation.filter((v) => !v.isValid).length;
  const validCount = items.length - invalidCount;

  return (
    <section className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Registro Masivo de Usuarios</h1>
        <div className="flex items-center gap-3">
          <a href={templateCSV} download="plantilla-usuarios.csv" className="underline text-sm">Descargar plantilla CSV</a>
          {templateXlsxUrl && (
            <a href={templateXlsxUrl} download="plantilla-usuarios.xlsx" className="underline text-sm">Descargar plantilla Excel</a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4 space-y-3">
          <h2 className="font-medium">Subir archivo</h2>
          <Input type="file" accept=".csv,.json,.xlsx,.xls" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }} />
          <p className="text-xs text-gray-600">Formatos soportados: CSV con encabezados, Excel (.xlsx/.xls) o JSON (arreglo).</p>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex items-center gap-3">
            <label className="text-xs flex items-center gap-2">
              <input type="checkbox" checked={registerOnlyValid} onChange={(e) => setRegisterOnlyValid(e.target.checked)} /> Registrar sólo filas válidas
            </label>
            <Button onClick={onSubmit} disabled={(items.length === 0) || loading || (registerOnlyValid && invalidCount > 0)}>
              {loading ? "Procesando..." : (registerOnlyValid ? `Registrar (${validCount} válidas)` : "Registrar en lote")}
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 border rounded p-4">
          <h2 className="font-medium mb-2">Vista previa ({items.length} filas)</h2>
          {items.length === 0 ? (
            <p className="text-xs text-gray-600">Sube un archivo para ver la vista previa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Nombres</th>
                    <th className="p-2 text-left">Apellidos</th>
                    <th className="p-2 text-left">Correo</th>
                    <th className="p-2 text-left">Documento</th>
                    <th className="p-2 text-left">Teléfono</th>
                    <th className="p-2 text-left">Rol</th>
                    <th className="p-2 text-left">Errores</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((it, idx) => {
                    const v = validation[idx] || { issues: [], isValid: true };
                    const errText = v.issues.filter((x) => x.severity === "error").map((x) => `${x.field}: ${x.message}`).join("; ");
                    const warnText = v.issues.filter((x) => x.severity === "warning").map((x) => `${x.field}: ${x.message}`).join("; ");
                    return (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="p-2">{it._row ?? idx + 1}</td>
                        <td className="p-2">{it.nombres}</td>
                        <td className="p-2">{it.apellidos}</td>
                        <td className="p-2">{it.email}</td>
                        <td className="p-2">{it.documento_identidad}</td>
                        <td className="p-2">{it.telefono || ""}</td>
                        <td className="p-2">{it.role || "ESTUDIANTE"}</td>
                        <td className="p-2">
                          {errText && <div className="text-red-600">{errText}</div>}
                          {warnText && <div className="text-yellow-600">{warnText}</div>}
                          {!errText && !warnText && <span className="text-green-700">OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-700">Válidas: {validCount} · Inválidas: {invalidCount}</div>
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
              // Exportar errores a Excel
              const header = ["row", "field", "severity", "message"];
              const rows = validation.flatMap((v) => v.issues.filter((i) => i.severity === "error").map((i) => [v.row, i.field, i.severity, i.message]));
              const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "errores");
              const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
              const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "errores-registro-masivo.xlsx";
              a.click();
              URL.revokeObjectURL(url);
            }}>Descargar errores Excel</Button>
          </div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-medium mb-2">Resultado</h2>
        {!result ? (
          <p className="text-xs text-gray-600">Se mostrará el resumen después de registrar.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">Creados: {result.created} · Fallidos: {result.failed}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="p-2">{r.index + 1}</td>
                      <td className="p-2">{r.id ? "OK" : "ERROR"}</td>
                      <td className="p-2">{r.id ? `ID ${r.id}` : (r.error || "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}