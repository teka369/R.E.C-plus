import api from "@/lib/axios";

export type ScheduleEntry = {
  id: number;
  groupId: number;
  dayOfWeek: number; // 1-7
  startMinutes: number; // 0..1440
  endMinutes: number; // 1..1440
  title?: string | null;
  subjectId?: number | null;
  location?: string | null;
};

export type ScheduleEvent = {
  id: number;
  groupId: number;
  title: string;
  description?: string | null;
  startAt: string; // ISO
  endAt: string; // ISO
  location?: string | null;
};

export type ScheduleNote = {
  id: number;
  groupId: number;
  teacherId: number;
  content: string;
  createdAt?: string;
};

export type CreateEntryInput = {
  groupId: number;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  title?: string;
  subjectId?: number;
  location?: string;
};

export type UpdateEntryInput = Partial<Omit<CreateEntryInput, "groupId">>;

export type CreateEventInput = {
  groupId: number;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  location?: string;
};

export type UpdateEventInput = Partial<Omit<CreateEventInput, "groupId" | "title" | "startAt" | "endAt">> & {
  title?: string;
  startAt?: string;
  endAt?: string;
};

export type CreateNoteInput = { groupId: number; content: string };
export type UpdateNoteInput = { content?: string };

export const scheduleApi = {
  async listEntries(groupId: number): Promise<ScheduleEntry[]> {
    const res = await api.get<ScheduleEntry[]>(`/schedule/groups/${groupId}/entries`);
    return res.data;
  },
  async createEntry(payload: CreateEntryInput): Promise<ScheduleEntry> {
    const { groupId, ...body } = payload;
    const res = await api.post<ScheduleEntry>(`/schedule/groups/${groupId}/entries`, body);
    return res.data;
  },
  async updateEntry(id: number, payload: UpdateEntryInput): Promise<ScheduleEntry> {
    const res = await api.put<ScheduleEntry>(`/schedule/entries/${id}`, payload);
    return res.data;
  },
  async deleteEntry(id: number): Promise<{ deleted: true }> {
    const res = await api.delete<{ deleted: true }>(`/schedule/entries/${id}`);
    return res.data;
  },

  async listEvents(groupId: number, params?: { startAt?: string; endAt?: string }): Promise<ScheduleEvent[]> {
    const res = await api.get<ScheduleEvent[]>(`/schedule/groups/${groupId}/events`, { params });
    return res.data;
  },
  async createEvent(payload: CreateEventInput): Promise<ScheduleEvent> {
    const { groupId, ...body } = payload;
    const res = await api.post<ScheduleEvent>(`/schedule/groups/${groupId}/events`, body);
    return res.data;
  },
  async updateEvent(id: number, payload: UpdateEventInput): Promise<ScheduleEvent> {
    const res = await api.put<ScheduleEvent>(`/schedule/events/${id}`, payload);
    return res.data;
  },
  async deleteEvent(id: number): Promise<{ deleted: true }> {
    const res = await api.delete<{ deleted: true }>(`/schedule/events/${id}`);
    return res.data;
  },

  async listNotes(groupId: number): Promise<ScheduleNote[]> {
    const res = await api.get<ScheduleNote[]>(`/schedule/groups/${groupId}/notes`);
    return res.data;
  },
  async createNote(payload: CreateNoteInput): Promise<ScheduleNote> {
    const { groupId, ...body } = payload;
    const res = await api.post<ScheduleNote>(`/schedule/groups/${groupId}/notes`, body);
    return res.data;
  },
  async updateNote(id: number, payload: UpdateNoteInput): Promise<ScheduleNote> {
    const res = await api.put<ScheduleNote>(`/schedule/notes/${id}`, payload);
    return res.data;
  },
  async deleteNote(id: number): Promise<{ deleted: true }> {
    const res = await api.delete<{ deleted: true }>(`/schedule/notes/${id}`);
    return res.data;
  },
};