import api from "@/lib/axios";
import { API_BASE_URL } from "@/lib/constants";

export type StudyMaterial = {
  id: number;
  subjectId: number;
  groupId: number;
  teacherId: number;
  title: string;
  description?: string | null;
  type: "PDF" | "VIDEO" | "LINK" | "DOC" | "OTHER";
  resourceUrl?: string | null;
  imageUrl?: string | null;
  filePath?: string | null;
  visibility: "GROUP" | "GRADE";
  views?: number;
  downloads?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UploadStudyFileResult = {
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type CreateStudyMaterialInput = {
  subjectId: number;
  groupId: number;
  title: string;
  description?: string;
  type: StudyMaterial["type"];
  resourceUrl?: string;
  imageUrl?: string;
  filePath?: string;
  visibility: StudyMaterial["visibility"];
};

export type UpdateStudyMaterialInput = {
  title?: string;
  description?: string;
  type?: StudyMaterial["type"];
  resourceUrl?: string;
  imageUrl?: string;
  filePath?: string;
  visibility?: StudyMaterial["visibility"];
};

export type Syllabus = {
  id: number;
  subjectId: number;
  groupId: number;
  teacherId: number;
  title: string;
  period?: string | null;
  status?: "BORRADOR" | "ACTIVO" | "ARCHIVADO";
  duration?: string | null;
  content?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSyllabusInput = {
  subjectId: number;
  groupId: number;
  title: string;
  status?: "BORRADOR" | "ACTIVO" | "ARCHIVADO";
  duration?: string;
  content?: string;
};

export type UpdateSyllabusInput = Partial<CreateSyllabusInput> & {
  title?: string;
  status?: "BORRADOR" | "ACTIVO" | "ARCHIVADO";
  duration?: string;
  content?: string;
};

export type GroupInfo = {
  groupId: number;
  summary: string | null;
  highlights: string[];
  metrics: Record<string, number | string>;
  links: string[];
};

export type UpdateGroupInfoInput = Partial<Omit<GroupInfo, "groupId">>;

export type LeagueGroup = { groupId: number; nombre: string; info: GroupInfo };

export const materialsApi = {
  getStudyFileUrl(id: number): string {
    return `${API_BASE_URL}/materials/study/${id}/file`;
  },

  async uploadStudyFile(file: File, groupId: number, subjectId: number): Promise<UploadStudyFileResult> {
    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("groupId", String(groupId));
    formData.append("subjectId", String(subjectId));
    const res = await api.post<UploadStudyFileResult>("/materials/study/upload", formData);
    return res.data;
  },

  async listStudy(): Promise<StudyMaterial[]> {
    const res = await api.get<StudyMaterial[]>("/materials/study");
    return res.data;
  },
  async getStudy(id: number): Promise<StudyMaterial> {
    const res = await api.get<StudyMaterial>(`/materials/study/${id}`);
    return res.data;
  },
  async trackStudyView(id: number): Promise<{ id: number; views: number; downloads: number }> {
    const res = await api.post<{ id: number; views: number; downloads: number }>(`/materials/study/${id}/view`);
    return res.data;
  },
  async trackStudyDownload(id: number): Promise<{ id: number; views: number; downloads: number }> {
    const res = await api.post<{ id: number; views: number; downloads: number }>(`/materials/study/${id}/download`);
    return res.data;
  },
  async createStudy(payload: CreateStudyMaterialInput): Promise<StudyMaterial> {
    const res = await api.post<StudyMaterial>("/materials/study", payload);
    return res.data;
  },
  async updateStudy(id: number, payload: UpdateStudyMaterialInput): Promise<StudyMaterial> {
    const res = await api.put<StudyMaterial>(`/materials/study/${id}`, payload);
    return res.data;
  },
  async deleteStudy(id: number): Promise<{ deleted: true }> {
    const res = await api.delete<{ deleted: true }>(`/materials/study/${id}`);
    return res.data;
  },

  async listSyllabi(): Promise<Syllabus[]> {
    const res = await api.get<Syllabus[]>("/materials/syllabi");
    return res.data;
  },
  async getSyllabus(id: number): Promise<Syllabus> {
    const res = await api.get<Syllabus>(`/materials/syllabi/${id}`);
    return res.data;
  },
  async createSyllabus(payload: CreateSyllabusInput): Promise<Syllabus> {
    const res = await api.post<Syllabus>("/materials/syllabi", payload);
    return res.data;
  },
  async updateSyllabus(id: number, payload: UpdateSyllabusInput): Promise<Syllabus> {
    const res = await api.put<Syllabus>(`/materials/syllabi/${id}`, payload);
    return res.data;
  },
  async deleteSyllabus(id: number): Promise<{ deleted: true }> {
    const res = await api.delete<{ deleted: true }>(`/materials/syllabi/${id}`);
    return res.data;
  },

  async getGroupInfo(groupId: number): Promise<GroupInfo> {
    const res = await api.get<GroupInfo>(`/materials/groups/${groupId}/info`);
    return res.data;
  },
  async updateGroupInfo(groupId: number, payload: UpdateGroupInfoInput): Promise<GroupInfo> {
    const res = await api.put<GroupInfo>(`/materials/groups/${groupId}/info`, payload);
    return res.data;
  },
  async listLeaguesByGrade(gradeId: number): Promise<LeagueGroup[]> {
    const res = await api.get<LeagueGroup[]>(`/materials/grades/${gradeId}/leagues`);
    return res.data;
  },
};
