"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi } from "@/lib/academicApi";
import { materialsApi, type LeagueGroup } from "@/lib/materialsApi";
import { getErrorMessage } from "@/lib/errors";

export default function EstudianteLigasPage() {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState<string>("");
  const [leagues, setLeagues] = useState<LeagueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const studentGroup = await academicApi.getStudentGroup(studentId);
        const gradeId = studentGroup?.group.grade.id;
        setGroupName(studentGroup?.group.nombre ?? "");
        if (!gradeId) {
          setLeagues([]);
          return;
        }
        const list = await materialsApi.listLeaguesByGrade(gradeId);
        setLeagues(list);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar ligas"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  return (
    <section className="p-6 space-y-6">
      <header>
        <h2 className="text-lg font-semibold mb-1">Ligas</h2>
        <p className="text-sm text-gray-600">Enlaces útiles y recursos externos por grupo.</p>
      </header>

      {groupName ? <p className="text-xs text-slate-600">Tu grupo: {groupName}</p> : null}
      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="space-y-4">
          {leagues.map((group) => (
            <article key={group.groupId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">{group.nombre}</h3>
              {group.info.summary ? <p className="text-sm text-slate-700">{group.info.summary}</p> : null}
              {group.info.highlights?.length ? (
                <ul className="list-disc list-inside text-sm text-slate-700">
                  {group.info.highlights.map((item, index) => (
                    <li key={`${group.groupId}-highlight-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : null}

              {group.info.links?.length ? (
                <div className="space-y-2 pt-1">
                  {group.info.links.map((item, index) => (
                    <a
                      key={`${group.groupId}-${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded border border-slate-200 p-2 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-emerald-700 break-all">{item.url}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin ligas publicadas.</p>
              )}
            </article>
          ))}

          {leagues.length === 0 ? <p className="text-sm text-gray-600">No hay ligas disponibles.</p> : null}
        </div>
      ) : null}
    </section>
  );
}