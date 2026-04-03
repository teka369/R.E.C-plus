import api from "@/lib/axios";
import { UserRole } from "@/types/user";

export type UserDTO = {
  id: number;
  publicId: string;
  nombres: string;
  apellidos: string;
  email: string;
  codigo: string;
  role: UserRole;
  institutionId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserDto = {
  nombres: string;
  apellidos: string;
  email: string;
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
  results: { index: number; id?: number; codigo?: string; error?: string }[];
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export const usersApi = {
  async me(): Promise<UserDTO> {
    const res = await api.get<UserDTO>("/users/me");
    if (!res.data) throw new Error("User not found");
    return res.data;
  },
  async list(role?: UserRole): Promise<UserDTO[]> {
    const res = await api.get<PaginatedResult<UserDTO>>("/users", { params: role ? { role } : undefined });
    return res.data.data;
  },
  async listPaginated(page = 1, limit = 20, role?: UserRole): Promise<PaginatedResult<UserDTO>> {
    const res = await api.get<PaginatedResult<UserDTO>>("/users", {
      params: { page, limit, ...(role ? { role } : {}) },
    });
    return res.data;
  },
  async get(publicId: string): Promise<UserDTO> {
    const res = await api.get<UserDTO | null>(`/users/${publicId}`);
    if (!res.data) throw new Error("User not found");
    return res.data;
  },
  async create(dto: CreateUserDto): Promise<UserDTO> {
    const res = await api.post<UserDTO>("/users", dto);
    return res.data;
  },
  async update(publicId: string, dto: UpdateUserDto): Promise<UserDTO> {
    const res = await api.patch<UserDTO>(`/users/${publicId}`, dto);
    return res.data;
  },
  async changePassword(publicId: string, dto: ChangePasswordDto): Promise<void> {
    await api.patch(`/users/${publicId}/password`, dto);
  },
  async changeMyPassword(dto: ChangePasswordDto): Promise<void> {
    const me = await api.get<UserDTO>("/users/me");
    await api.patch(`/users/${me.data.publicId}/password`, dto);
  },
  async remove(publicId: string): Promise<void> {
    await api.delete(`/users/${publicId}`);
  },
  async bulkCreate(items: CreateUserDto[]): Promise<BulkCreateResult> {
    const res = await api.post<BulkCreateResult>("/users/bulk", items);
    return res.data;
  },
};