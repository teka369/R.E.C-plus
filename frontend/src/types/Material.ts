// Tipos y interfaces para gestión de materiales de estudio

export interface Material {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: 'libro' | 'video' | 'documento' | 'presentacion';
  materia_id: number;
  materia_nombre: string;
  autor: string;
  fecha_publicacion: string;
  descargas: number;
  vistas: number;
  imagen: string;
  enlace: string;
  profesor_id: number;
  profesor_nombre: string;
  profesor_apellido: string;
  grados: string; // Coma separada, ej: '6-1,6-2'
}

// Payload para crear/actualizar material en backend
export interface MaterialBackendPayload {
  titulo: string;
  descripcion: string;
  tipo: 'libro' | 'video' | 'documento' | 'presentacion';
  materia_id: number;
  autor: string;
  imagen: string;
  enlace: string;
  fecha_publicacion: string;
  grupos: number[];
  profesor_id?: number;
}

// Estado del formulario en el frontend
export interface MaterialFormState {
  titulo: string;
  descripcion: string;
  tipo: 'libro' | 'video' | 'documento' | 'presentacion';
  materia_id: number;
  autor: string;
  imagen: string;
  enlace: string;
  fechaPublicacion: string;
  grupos: number[];
} 