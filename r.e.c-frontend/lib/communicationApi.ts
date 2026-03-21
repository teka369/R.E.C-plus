import api from "@/lib/axios";

export type FeedbackPointList = { items: string[] };

export type FeedbackTipo = "POSITIVA" | "NEGATIVA" | "INFORMATIVA" | "SEGUIMIENTO";
export type FeedbackEstado = "PENDIENTE" | "ATENDIDA";

export type FeedbackDTO = {
  id: number;
  teacherId: number;
  studentId: number;
  groupId: number;
  subjectId?: number | null;
  title: string;
  content: string;
  tipo: FeedbackTipo;
  estado: FeedbackEstado;
  strengths?: FeedbackPointList | null;
  improvements?: FeedbackPointList | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateFeedbackInput = {
  studentId: number;
  groupId: number;
  subjectId?: number;
  title: string;
  content: string;
  tipo?: FeedbackTipo;
  estado?: FeedbackEstado;
  strengths?: FeedbackPointList;
  improvements?: FeedbackPointList;
};

export type UpdateFeedbackInput = {
  title?: string;
  content?: string;
  tipo?: FeedbackTipo;
  estado?: FeedbackEstado;
  strengths?: FeedbackPointList;
  improvements?: FeedbackPointList;
};

export const communicationApi = {
  async createFeedback(payload: CreateFeedbackInput): Promise<FeedbackDTO> {
    const res = await api.post<FeedbackDTO>("/communication/feedback", payload);
    return res.data;
  },
  async listFeedbackByStudent(studentId: number): Promise<FeedbackDTO[]> {
    const res = await api.get<FeedbackDTO[]>(`/communication/feedback/student/${studentId}`);
    return res.data;
  },
  async listFeedbackByGroup(groupId: number): Promise<FeedbackDTO[]> {
    const res = await api.get<FeedbackDTO[]>(`/communication/feedback/group/${groupId}`);
    return res.data;
  },
  async updateFeedback(id: number, payload: UpdateFeedbackInput): Promise<FeedbackDTO> {
    const res = await api.patch<FeedbackDTO>(`/communication/feedback/${id}`, payload);
    return res.data;
  },
  async deleteFeedback(id: number): Promise<void> {
    await api.delete(`/communication/feedback/${id}`);
  },
};