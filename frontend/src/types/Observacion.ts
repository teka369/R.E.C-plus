// Tipos y interfaces para gestión de observaciones

export type TipoObservacion = 'positiva' | 'negativa' | 'informativa' | 'seguimiento';
export type EstadoObservacion = 'pendiente' | 'atendida';

export interface Observacion {
  id: number;
  estudiante: string;
  estudiante_id: number;
  curso: string;
  fecha: string;
  tipo: TipoObservacion;
  asignatura: string;
  profesor: string;
  descripcion: string;
  estado: EstadoObservacion;
}

export interface EstudianteSimple {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Materia {
  id: number;
  nombre: string;
} 