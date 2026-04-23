import api from "@/lib/axios";

export type RecoveryConfig = {
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

export type RecoveryScheduleMeta = {
  id: number;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
};

export const recoverySettingsApi = {
  async getConfig(): Promise<RecoveryConfig> {
    const res = await api.get<RecoveryConfig>("/recovery/config");
    return res.data;
  },

  async setConfig(payload: { startAt: string; endAt: string }): Promise<RecoveryConfig> {
    const res = await api.post<RecoveryConfig>("/recovery/config", payload);
    return res.data;
  },

  async getScheduleBlob(): Promise<Blob> {
    const res = await api.get("/recovery/schedule", { responseType: "blob" });
    return res.data as Blob;
  },

  async uploadSchedule(file: File): Promise<RecoveryScheduleMeta> {
    const formData = new FormData();
    formData.append("horario", file);
    const res = await api.post<RecoveryScheduleMeta>("/recovery/schedule", formData);
    return res.data;
  },
};
