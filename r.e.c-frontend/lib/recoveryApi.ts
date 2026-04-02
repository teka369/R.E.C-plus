import api from "@/lib/axios";
import { API_BASE_URL } from "@/lib/constants";

export type RecoveryRequestType = "RECOVERY" | "REINFORCEMENT";
export type RecoveryRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type RecoveryActivityType = "HOMEWORK" | "EXAM" | "PROJECT" | "PRACTICE";
export type RecoveryActivityStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "EVALUATED";

export type RecoveryRequest = {
  id: number;
  studentId: number;
  teacherId: number;
  groupId: number;
  subjectId: number;
  type: RecoveryRequestType;
  status: RecoveryRequestStatus;
  reason: string;
  teacherComment?: string | null;
  dueDate?: string | null;
  finalScore?: number | null;
  requestedAt: string;
  respondedAt?: string | null;
  completedAt?: string | null;
  student?: { id: number; nombres: string; apellidos: string; email?: string };
  teacher?: { id: number; nombres: string; apellidos: string; email?: string };
  subject?: { id: number; nombre: string };
  group?: { id: number; nombre: string };
};

export type RecoveryActivity = {
  id: number;
  requestId: number;
  teacherId: number;
  title: string;
  description: string;
  activityType: RecoveryActivityType;
  status: RecoveryActivityStatus;
  startAt?: string | null;
  dueAt: string;
  score?: number | null;
  attachmentUrl?: string | null;
  hasAttachment?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecoveryMessage = {
  id: number;
  requestId: number;
  authorId: number;
  body: string;
  createdAt: string;
  author?: { id: number; nombres: string; apellidos: string; role: "SECRETARIA" | "PROFESOR" | "ESTUDIANTE" };
};

export type CreateRecoveryRequestInput = {
  subjectId: number;
  type: RecoveryRequestType;
  reason: string;
};

export type UpdateRecoveryRequestStatusInput = {
  status: RecoveryRequestStatus;
  teacherComment?: string;
  dueDate?: string;
  finalScore?: number;
};

export type CreateRecoveryActivityInput = {
  title: string;
  description: string;
  activityType: RecoveryActivityType;
  startAt?: string;
  dueAt: string;
  attachmentUrl?: string;
};

export type UpdateRecoveryActivityInput = {
  status?: RecoveryActivityStatus;
  score?: number;
  dueAt?: string;
  attachmentUrl?: string;
};

export type CreateRecoveryMessageInput = {
  body: string;
};

export type RecoveryGroupStats = {
  groupId: number;
  total: number;
  statusBreakdown: Record<string, number>;
  approvalRate: number;
};

export type RecoveryStudentStats = {
  studentId: number;
  total: number;
  statusBreakdown: Record<string, number>;
  avgFinalScore: number | null;
};

export const recoveryApi = {
  async createRequest(payload: CreateRecoveryRequestInput): Promise<RecoveryRequest> {
    const res = await api.post<RecoveryRequest>("/recovery/requests", payload);
    return res.data;
  },
  async listMyRequests(): Promise<RecoveryRequest[]> {
    const res = await api.get<{ data: RecoveryRequest[]; meta: unknown }>("/recovery/requests/my");
    return res.data.data;
  },
  async listGroupRequests(groupId: number): Promise<RecoveryRequest[]> {
    const res = await api.get<{ data: RecoveryRequest[]; meta: unknown }>(`/recovery/groups/${groupId}/requests`);
    return res.data.data;
  },
  async updateRequestStatus(id: number, payload: UpdateRecoveryRequestStatusInput): Promise<RecoveryRequest> {
    const res = await api.patch<RecoveryRequest>(`/recovery/requests/${id}/status`, payload);
    return res.data;
  },
  async deleteRequest(id: number): Promise<{ id: number; deleted: boolean }> {
    const res = await api.delete<{ id: number; deleted: boolean }>(`/recovery/requests/${id}`);
    return res.data;
  },
  async listActivities(requestId: number): Promise<RecoveryActivity[]> {
    const res = await api.get<RecoveryActivity[]>(`/recovery/requests/${requestId}/activities`);
    return res.data;
  },
  async createActivity(requestId: number, payload: CreateRecoveryActivityInput): Promise<RecoveryActivity> {
    const res = await api.post<RecoveryActivity>(`/recovery/requests/${requestId}/activities`, payload);
    return res.data;
  },
  async updateActivity(id: number, payload: UpdateRecoveryActivityInput): Promise<RecoveryActivity> {
    const res = await api.patch<RecoveryActivity>(`/recovery/activities/${id}`, payload);
    return res.data;
  },
  async deleteActivity(id: number): Promise<{ id: number; deleted: boolean }> {
    const res = await api.delete<{ id: number; deleted: boolean }>(`/recovery/activities/${id}`);
    return res.data;
  },
  async uploadActivityAttachment(activityId: number, file: File): Promise<{ activityId: number; originalName: string; mimeType: string; uploadedAt: string }> {
    const formData = new FormData();
    formData.append("archivo", file);
    const res = await api.post<{ activityId: number; originalName: string; mimeType: string; uploadedAt: string }>(
      `/recovery/activities/${activityId}/attachment`,
      formData,
    );
    return res.data;
  },
  async getActivityAttachmentBlob(activityId: number): Promise<Blob> {
    const res = await api.get(`/recovery/activities/${activityId}/attachment`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
  getActivityAttachmentUrl(activityId: number): string {
    return `${API_BASE_URL}/recovery/activities/${activityId}/attachment`;
  },
  async listMessages(requestId: number): Promise<RecoveryMessage[]> {
    const res = await api.get<RecoveryMessage[]>(`/recovery/requests/${requestId}/messages`);
    return res.data;
  },
  async createMessage(requestId: number, payload: CreateRecoveryMessageInput): Promise<RecoveryMessage> {
    const res = await api.post<RecoveryMessage>(`/recovery/requests/${requestId}/messages`, payload);
    return res.data;
  },
  async statsByGroup(groupId: number): Promise<RecoveryGroupStats> {
    const res = await api.get<RecoveryGroupStats>(`/recovery/stats/groups/${groupId}`);
    return res.data;
  },
  async statsByStudent(studentId: number): Promise<RecoveryStudentStats> {
    const res = await api.get<RecoveryStudentStats>(`/recovery/stats/students/${studentId}`);
    return res.data;
  },
};
