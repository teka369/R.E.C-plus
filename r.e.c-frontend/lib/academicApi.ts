import api from "@/lib/axios";

export type Grade = { id: number; nombre: string; groups?: Group[] };
export type Group = { id: number; nombre: string; gradeId: number; directorId?: number };
export type Subject = { id: number; nombre: string; codigo?: string | null };
export type GroupStudentDTO = {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string | null;
  role: string;
};

export type TeacherAssignment = {
  id: number;
  teacherId?: number;
  groupId?: number;
  subjectId?: number;
  group: { id: number; nombre: string; gradeId?: number; grade?: { id: number; nombre: string } | null };
  subject: { id: number; nombre: string; codigo?: string | null };
};

export type StudentGroup = {
  id: number;
  studentId: number;
  group: { id: number; nombre: string; grade: { id: number; nombre: string } };
};

export type GroupSubject = { id: number; subject: { id: number; nombre: string; codigo?: string | null } };

export type PromoteGradeMapping = {
  sourceGroupId: number;
  targetGroupId: number;
  repeatStudentIds: number[];
};

export type PromoteGradePayload = {
  sourceGradeId: number;
  targetGradeId: number;
  mappings: PromoteGradeMapping[];
};

export type PromotionSummary = {
  sourceGroupId: number;
  targetGroupId: number;
  promotedCount: number;
  repeatCount: number;
  beforeCount?: number;
  afterCount?: number;
  sourceGroupName?: string;
  targetGroupName?: string;
  promotedStudentIds?: number[];
  repeatStudentIds?: number[];
};

export const academicApi = {
  // Grados
  async listGrades(): Promise<Grade[]> {
    const res = await api.get<Grade[]>("/academic/grades");
    return res.data;
  },
  async createGrade(nombre: string): Promise<Grade> {
    const res = await api.post<Grade>("/academic/grades", { nombre });
    return res.data;
  },
  async updateGrade(id: number, nombre: string): Promise<Grade> {
    const res = await api.put<Grade>(`/academic/grades/${id}`, { nombre });
    return res.data;
  },
  async deleteGrade(id: number): Promise<{ deleted: true } | Grade> {
    const res = await api.delete(`/academic/grades/${id}`);
    return res.data;
  },

  // Grupos
  async listGroups(): Promise<(Group & { grade?: Grade })[]> {
    const res = await api.get<(Group & { grade?: Grade })[]>("/academic/groups");
    return res.data;
  },
  async createGroup(nombre: string, gradeId: number): Promise<Group> {
    const res = await api.post<Group>("/academic/groups", { nombre, gradeId });
    return res.data;
  },
  async updateGroup(id: number, dto: { nombre?: string; gradeId?: number }): Promise<Group> {
    const res = await api.put<Group>(`/academic/groups/${id}`, dto);
    return res.data;
  },
  async deleteGroup(id: number): Promise<{ deleted: true } | Group> {
    const res = await api.delete(`/academic/groups/${id}`);
    return res.data;
  },
  async assignGroupDirector(groupId: number, directorId: number): Promise<Group> {
    const res = await api.put<Group>(`/academic/groups/${groupId}/director`, { directorId });
    return res.data;
  },

  // Materias
  async listSubjects(): Promise<Subject[]> {
    const res = await api.get<Subject[]>("/academic/subjects");
    return res.data;
  },
  async createSubject(nombre: string, codigo?: string): Promise<Subject> {
    const res = await api.post<Subject>("/academic/subjects", { nombre, codigo });
    return res.data;
  },
  async updateSubject(id: number, dto: { nombre?: string; codigo?: string }): Promise<Subject> {
    const res = await api.put<Subject>(`/academic/subjects/${id}`, dto);
    return res.data;
  },
  async deleteSubject(id: number): Promise<{ deleted: true } | Subject> {
    const res = await api.delete(`/academic/subjects/${id}`);
    return res.data;
  },

  async listTeacherAssignments(teacherId: number): Promise<TeacherAssignment[]> {
    const res = await api.get<TeacherAssignment[]>(`/academic/teachers/${teacherId}/assignments`);
    return res.data;
  },
  async getStudentGroup(studentId: number): Promise<StudentGroup | null> {
    const res = await api.get<StudentGroup | null>(`/academic/students/${studentId}/group`);
    return res.data;
  },
  async assignStudentToGroup(studentId: number, groupId: number): Promise<StudentGroup> {
    const res = await api.put<StudentGroup>(`/academic/students/${studentId}/group`, { groupId });
    return res.data;
  },
  async deleteStudentGroup(studentId: number): Promise<{ deleted: true } | StudentGroup> {
    const res = await api.delete(`/academic/students/${studentId}/group`);
    return res.data;
  },
  async listGroupSubjects(groupId: number): Promise<GroupSubject[]> {
    const res = await api.get<GroupSubject[]>(`/academic/groups/${groupId}/subjects`);
    return res.data;
  },
  async listStudentSubjects(studentId: number): Promise<GroupSubject[]> {
    const res = await api.get<GroupSubject[]>(`/academic/students/${studentId}/subjects`);
    return res.data;
  },
  async assignSubjectToGroup(groupId: number, subjectId: number): Promise<GroupSubject> {
    const res = await api.post<GroupSubject>(`/academic/group-subjects`, { groupId, subjectId });
    return res.data;
  },
  async deleteGroupSubject(id: number): Promise<{ deleted: true } | GroupSubject> {
    const res = await api.delete(`/academic/group-subjects/${id}`);
    return res.data;
  },
  async assignTeacher(teacherId: number, groupId: number, subjectId: number): Promise<{ id: number }> {
    const res = await api.post<{ id: number }>(`/academic/teachers/assign`, { teacherId, groupId, subjectId });
    return res.data;
  },
  async deleteTeacherAssignment(id: number): Promise<{ deleted: true } | { id: number }> {
    const res = await api.delete(`/academic/teachers/assignments/${id}`);
    return res.data;
  },
  async listGroupStudents(groupId: number): Promise<GroupStudentDTO[]> {
    const res = await api.get<GroupStudentDTO[]>(`/academic/groups/${groupId}/students`);
    return res.data;
  },
  async promoteGrade(dto: PromoteGradePayload): Promise<{ summary: PromotionSummary[] }> {
    const res = await api.post<{ summary: PromotionSummary[] }>(`/academic/promotions/grade`, dto);
    return res.data;
  },
  async promoteGradePreview(dto: PromoteGradePayload): Promise<{ summary: PromotionSummary[] }> {
    const res = await api.post<{ summary: PromotionSummary[] }>(`/academic/promotions/grade/preview`, dto);
    return res.data;
  },
};