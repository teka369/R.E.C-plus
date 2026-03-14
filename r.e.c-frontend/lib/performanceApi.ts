import api from "@/lib/axios";

// ── Shared ───────────────────────────────────────────────────────────────────

export type GradeEntry = {
  label: string;
  value: number | null;
  period?: number;
  inasistenciasJustificadas?: number;
  inasistenciasInjustificadas?: number;
};

// ── Grade Performance (group-level stats) ────────────────────────────────────

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

// ── Student Academic Record ───────────────────────────────────────────────────

export type StudentAcademicRecord = {
  id: number;
  subjectId: number;
  subject: { id: number; nombre: string };
  parcial1: number | null;
  parcial2: number | null;
  parcial3: number | null;
  parcial4: number | null;
  gradesJson: string | null;
  notaFinal: number | null;
  promedioMateria: number | null;
  progresoMateria: number | null;
  inasistenciasJustificadas: number;
  inasistenciasInjustificadas: number;
  totalInasistencias?: number;
  observaciones: string | null;
  updatedAt: string;
};

export type UpsertStudentAcademicInput = {
  parcial1?: number;
  parcial2?: number;
  parcial3?: number;
  parcial4?: number;
  gradesJson?: string;
  notaFinal?: number;
  progresoMateria?: number;
  inasistenciasJustificadas?: number;
  inasistenciasInjustificadas?: number;
  observaciones?: string;
};

// ── Student Academic Response (single student) ───────────────────────────────

export type StudentAcademicResponse = {
  student: { id: number; nombres: string; apellidos: string; email: string };
  group: { id: number; nombre: string; grade: { id: number; nombre: string } };
  summary: {
    promedioGeneral: number | null;
    materiasConRegistro: number;
    inasistenciasJustificadas: number;
    inasistenciasInjustificadas: number;
    totalInasistencias: number;
  };
  records: StudentAcademicRecord[];
};

// ── Group Academic Overview ───────────────────────────────────────────────────

export type GroupStudentEntry = {
  student: { id: number; nombres: string; apellidos: string; email: string };
  promedioGeneral: number | null;
  records: StudentAcademicRecord[];
};

export type GroupAcademicOverview = {
  group: { id: number; nombre: string; grade: { id: number; nombre: string } };
  subjects: Array<{ id: number; nombre: string }>;
  students: GroupStudentEntry[];
};

// ── API ───────────────────────────────────────────────────────────────────────

export const performanceApi = {
  async getByGrade(grade: string): Promise<GradePerformance | null> {
    const res = await api.get<GradePerformance | null>(
      `/performance/grades/${encodeURIComponent(grade)}`,
    );
    return res.data;
  },

  async getByGroup(groupId: number): Promise<GradePerformance | null> {
    const res = await api.get<GradePerformance | null>(`/performance/groups/${groupId}`);
    return res.data;
  },

  async upsertByGrade(
    grade: string,
    payload: UpsertGradePerformanceInput,
  ): Promise<GradePerformance | null> {
    const res = await api.post<GradePerformance | null>(
      `/performance/grades/${encodeURIComponent(grade)}`,
      payload,
    );
    return res.data;
  },

  async upsertGradePerformance(
    gradeId: number,
    payload: UpsertGradePerformanceInput,
  ): Promise<GradePerformance> {
    const res = await api.post<GradePerformance>(`/performance/grades/${gradeId}`, payload);
    return res.data;
  },

  async getStudentAcademic(studentId: number): Promise<StudentAcademicResponse> {
    const res = await api.get<StudentAcademicResponse>(
      `/performance/students/${studentId}/academic`,
    );
    return res.data;
  },

  async getGroupAcademicOverview(groupId: number): Promise<GroupAcademicOverview> {
    const res = await api.get<GroupAcademicOverview>(
      `/performance/groups/${groupId}/students-academic`,
    );
    return res.data;
  },

  async upsertStudentAcademic(
    groupId: number,
    studentId: number,
    subjectId: number,
    payload: UpsertStudentAcademicInput,
  ): Promise<StudentAcademicRecord> {
    const res = await api.post<StudentAcademicRecord>(
      `/performance/groups/${groupId}/students/${studentId}/subjects/${subjectId}/academic`,
      payload,
    );
    return res.data;
  },
};
