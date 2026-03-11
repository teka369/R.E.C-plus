import api from "@/lib/axios";
import { UserRole } from "@/types/user";

export type UserDTO = {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string | null;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserDto = {
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono?: string;
  password?: string;
  role?: UserRole;
};

export type UpdateUserDto = Partial<CreateUserDto>;
export type ChangePasswordDto = {
  currentPassword?: string;
  newPassword: string;
};
export type BulkCreateResult = {
  created: number;
  failed: number;
  results: { index: number; id?: number; error?: string }[];
};

export const usersApi = {
  async list(role?: UserRole): Promise<UserDTO[]> {
    const res = await api.get<UserDTO[]>("/users", { params: role ? { role } : undefined });
    return res.data;
  },
  async get(id: number): Promise<UserDTO> {
    const res = await api.get<UserDTO | null>(`/users/${id}`);
    if (!res.data) throw new Error("User not found");
    return res.data;
  },
  async create(dto: CreateUserDto): Promise<UserDTO> {
    const res = await api.post<UserDTO>("/users", dto);
    return res.data;
  },
  async update(id: number, dto: UpdateUserDto): Promise<UserDTO> {
    const res = await api.patch<UserDTO>(`/users/${id}`, dto);
    return res.data;
  },
  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    await api.patch(`/users/${id}/password`, dto);
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
  async bulkCreate(items: CreateUserDto[]): Promise<BulkCreateResult> {
    const res = await api.post<BulkCreateResult>("/users/bulk", items);
    return res.data;
  },
};