"use client";
import { UserRole, User } from "@/types/user";

// Almacenamiento en memoria (seguro para SSR y sin localStorage)
let usersCache: User[] | null = null;

function seed(): User[] {
  return [
    { id: "u-1", name: "María López", email: "maria@rec.com", role: "ESTUDIANTE" },
    { id: "u-2", name: "Carlos Pérez", email: "carlos@rec.com", role: "PROFESOR" },
    { id: "u-3", name: "Ana Torres", email: "ana@rec.com", role: "ESTUDIANTE" },
  ];
}

function read(): User[] {
  if (!usersCache) {
    usersCache = seed();
  }
  return usersCache;
}

function write(users: User[]) {
  usersCache = users;
}

export function getUsers(): Promise<User[]> {
  return Promise.resolve(read());
}

export function getUserById(id: string): Promise<User | null> {
  const users = read();
  return Promise.resolve(users.find((u) => u.id === id) ?? null);
}

export function createUser(data: Omit<User, "id">): Promise<User> {
  const users = read();
  const newUser: User = { id: `u-${Date.now()}`, ...data };
  users.push(newUser);
  write(users);
  return Promise.resolve(newUser);
}

export function updateUser(id: string, patch: Partial<Omit<User, "id">>): Promise<User | null> {
  const users = read();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return Promise.resolve(null);
  users[idx] = { ...users[idx], ...patch };
  write(users);
  return Promise.resolve(users[idx]);
}

export function deleteUser(id: string): Promise<boolean> {
  const users = read();
  const next = users.filter((u) => u.id !== id);
  const deleted = next.length !== users.length;
  write(next);
  return Promise.resolve(deleted);
}

export function filterUsers(list: User[], query: string, role: UserRole | "ALL"): User[] {
  const q = query.trim().toLowerCase();
  return list.filter((u) => {
    const matchesQuery = !q || `${u.name} ${u.email}`.toLowerCase().includes(q);
    const matchesRole = role === "ALL" || u.role === role;
    return matchesQuery && matchesRole;
  });
}