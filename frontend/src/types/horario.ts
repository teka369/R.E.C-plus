// Tipos y interfaces para gestión de horarios

export interface Clase {
  id?: number;
  materia_id: number;
  materia_nombre?: string;
  profesor_id: number;
  profesor_nombre?: string;
  aula: string;
  hora: string;
  dia: string;
  color: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface NotaImportante {
  id: number;
  titulo: string;
  texto: string;
  tipo: 'general' | 'academica' | 'administrativa' | 'evento';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_creacion: string;
  profesor_nombre?: string;
}

export interface Materia {
  id: number;
  nombre: string;
}

export interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Grupo {
  id: number;
  nombre: string;
} 