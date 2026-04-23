import api from "@/lib/axios";

// ── Shared ───────────────────────────────────────────────────────────────────

export type GradeEntry = {
  label: string;
  value: number | null;
  period?: number;
  inasistenciasJustificadas?: number;
  inasistenciasInjustificadas?: number;
};

export type AcademicEvaluationGrade = {
  /** id de AcademicEvaluation en backend (overview v2 / estudiante v2) */
  evaluationId?: number;
  titulo: string;
  tipo: string;
  orden: number;
  termSlot?: number | null;
  porcentaje: number | null;
  nota: number;
  competencyCategory?: string | null;
};

/** Ítems de `evaluaciones` en GET estudiante `?v=2` */
export type StudentEvaluationV2 = {
  evaluationId?: number;
  title: string;
  type?: string;
  orden: number;
  termSlot?: number | null;
  weight?: number | null;
  grade: number;
  competencyCategory?: string | null;
  updatedAt?: string;
  updatedByTeacherId?: number | null;
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
  leagueScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  derivedSignals?: DerivedSignals;
  createdAt: string;
  updatedAt: string;
};

export type ScoreComponent = {
  raw: number;
  normalized: number;
  weight: number;
  contribution: number;
};

export type ScoreBreakdown = {
  promedio: ScoreComponent;
  asistencia: ScoreComponent;
  aprobacion: ScoreComponent;
  recuperacionAusencias: ScoreComponent;
  total: number;
};

export type DerivedSignals = {
  recoveryCompletionRate: number | null;
  resourcesPerSubject: number;
  activeSyllabusRate: number;
};

export type GradeRankingRow = {
  groupId: number;
  groupName: string;
  gradeId: number;
  gradeName: string;
  score: number;
  promedioGeneral: number | null;
  asistenciaPromedio: number | null;
  aprobacion: number | null;
  hasStats: boolean;
  scoreBreakdown: ScoreBreakdown;
  derivedSignals: DerivedSignals;
};

export type UpsertGradePerformanceInput = {
  promedioGeneral?: number;
  asistenciaPromedio?: number;
  aprobacion?: number;
  mejorAsignatura?: string;
  tendenciaGeneral?: string;
};

// ── Student Academic Record ───────────────────────────────────────────────────

export type StudentAcademicRecord = {
  /**
   * Identificador público del registro académico (UUID en backend).
   * Nota: no es incremental numérico.
   */
  id: string;
  subjectId: number;
  subject: { id: number; nombre: string };
  /**
   * Fuente canónica: v1 = AcademicEvaluationGrade; v2 estudiante = StudentEvaluationV2.
   */
  evaluaciones?: Array<AcademicEvaluationGrade | StudentEvaluationV2>;

  /** Respuestas antiguas / compat; la UI docente v2 no los usa como fuente de lectura */
  parcial1?: number | null;
  parcial2?: number | null;
  parcial3?: number | null;
  parcial4?: number | null;
  gradesJson?: string | null;

  notaFinal: number | null;
  promedioMateria: number | null;
  progresoMateria: number | null;
  inasistenciasJustificadas: number;
  inasistenciasInjustificadas: number;
  totalInasistencias?: number;
  observaciones: string | null;
  updatedAt: string;
  finalSource?: string | null;
  finalOverride?: number | null;
};

export type UpsertStudentAcademicEvaluationPayload = {
  evaluationId?: number;
  title: string;
  type?: string;
  termSlot?: number;
  weight?: number | null;
  grade?: number | null;
};

export type UpsertStudentAcademicInput = {
  /** Payload canónico v2 (recomendado en docente) */
  evaluations?: UpsertStudentAcademicEvaluationPayload[];
  finalOverride?: number | null;
  parcial1?: number;
  parcial2?: number;
  parcial3?: number;
  parcial4?: number;
  notaFinal?: number;
  progresoMateria?: number;
  inasistenciasJustificadas?: number;
  inasistenciasInjustificadas?: number;
  observaciones?: string;
};

// ── Student Academic Response (single student) ───────────────────────────────

export type StudentAcademicSimulatorInputs = {
  termSlotsAvailable?: number[];
  gradeScaleMax: number;
  passingThreshold: number;
  pendingEvaluations?: number;
  currentAverage?: number;
};

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
  /** GET ?v=2 */
  academicPeriod?: AcademicPeriodSummary | null;
  termSlotsAvailable?: number[];
  simulatorInputs?: StudentAcademicSimulatorInputs;
  /** GET ?v=2 — política institucional de calificación */
  gradingMode?: string;
  competencyWeights?: Record<string, number>;
};

// ── Group Academic Overview ───────────────────────────────────────────────────

export type AcademicPeriodSummary = {
  id: number;
  codigo: string | null;
  nombre: string;
  estado: string;
  tipo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaCierre?: string | null;
};

export type GroupStudentEntry = {
  student: { id: number; nombres: string; apellidos: string; email: string };
  promedioGeneral: number | null;
  records: StudentAcademicRecord[];
};

export type GroupAcademicOverview = {
  group: { id: number; nombre: string; grade: { id: number; nombre: string } };
  subjects: Array<{ id: number; nombre: string }>;
  students: GroupStudentEntry[];
  /** Presente con GET ?v=2 */
  academicPeriod?: AcademicPeriodSummary | null;
  /** Cortes con al menos una evaluación en el grupo (v2); si no hay, [1–4] */
  termSlotsAvailable?: number[];
  /** GET ?v=2 — política institucional de calificación */
  gradingMode?: string;
  competencyWeights?: Record<string, number>;
  stats?: {
    passingThreshold: number;
    totalStudents: number;
    coverageCount: number;
    groupAverage: number | null;
    approvedCount: number;
    approvalRate: number;
  };
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

  async getGradeRanking(gradeId: number): Promise<GradeRankingRow[]> {
    const res = await api.get<GradeRankingRow[]>(`/performance/grades/${gradeId}/ranking`);
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
      `/performance/students/${studentId}/academic?v=2`,
    );
    return res.data;
  },

  async getGroupAcademicOverview(groupId: number): Promise<GroupAcademicOverview> {
    const res = await api.get<GroupAcademicOverview>(
      `/performance/groups/${groupId}/students-academic?v=2`,
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
