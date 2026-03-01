import api from "@/lib/axios";

export type GradePerformance = {
  id: number;
  groupId: number;
  promedioGeneral: number | null;
  asistenciaPromedio: number | null;
  aprobacion: number | null;
  mejorAsignatura: string | null;
  estudiantesDestacados: string | null;
  inasistenciasJustificadas: number | null;
  inasistenciasInjustificadas: number | null;
  porcentajeCursoMayorAsistencia: number | null;
  variacionPromedio: number | null;
  variacionAprobacion: number | null;
  reduccionAusencias: number | null;
  tendenciaGeneral: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertGradePerformanceInput = {
  promedioGeneral?: number;
  asistenciaPromedio?: number;
  aprobacion?: number;
  mejorAsignatura?: string;
  estudiantesDestacados?: string;
  inasistenciasJustificadas?: number;
  inasistenciasInjustificadas?: number;
  porcentajeCursoMayorAsistencia?: number;
  variacionPromedio?: number;
  variacionAprobacion?: number;
  reduccionAusencias?: number;
  tendenciaGeneral?: string;
};

export const performanceApi = {
  async getByGrade(grade: string): Promise<GradePerformance | null> {
    const res = await api.get<GradePerformance | null>(`/performance/grades/${encodeURIComponent(grade)}`);
    return res.data;
  },

  async getByGroup(groupId: number): Promise<GradePerformance | null> {
    const res = await api.get<GradePerformance | null>(`/performance/groups/${groupId}`);
    return res.data;
  },

  async upsertByGrade(grade: string, payload: UpsertGradePerformanceInput): Promise<GradePerformance | null> {
    const res = await api.post<GradePerformance | null>(`/performance/grades/${encodeURIComponent(grade)}`, payload);
    return res.data;
  },
};
