import api from "@/lib/axios";

export type FeedbackPointList = { items: string[] };

export type FeedbackDTO = {
  id: number;
  teacherId: number;
  studentId: number;
  groupId: number;
  subjectId?: number | null;
  title: string;
  content: string;
  strengths?: FeedbackPointList | null;
  improvements?: FeedbackPointList | null;
  createdAt?: string;
};

export type CreateFeedbackInput = {
  teacherId: number;
  studentId: number;
  groupId: number;
  subjectId?: number;
  title: string;
  content: string;
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
};