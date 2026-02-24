// Tipos y interfaces para gestión de temarios académicos

export type EstadoTemario = 'activo' | 'borrador' | 'archivado';

export interface Unidad {
  id: number;
  titulo: string;
  descripcion: string;
  objetivos: string[];
  contenidos: string[];
  actividades: string[];
  evaluacion: string[];
  duracion: string;
  recursos: string[];
}

export interface Temario {
  id: number;
  asignatura: string;
  grupo_id: number;
  grupo_nombre?: string;
  profesor: string;
  periodo: string;
  fechaActualizacion: string;
  estado: EstadoTemario;
  unidades: Unidad[];
}

export interface Materia {
  id: number;
  nombre: string;
}

// Catálogos para selección
export const ASIGNATURAS_CATALOGO = [
  'Matemáticas', 'Español', 'Inglés', 'Ciencias Naturales', 'Historia', 'Geografía',
  'Educación Física', 'Artes', 'Formación Cívica y Ética', 'Biología', 'Física', 'Química',
  'Literatura', 'Informática', 'Educación Artística'
];

export const PERIODOS_CATALOGO = [
  '2025-1', '2025-2', '2026-1', '2026-2'
]; 