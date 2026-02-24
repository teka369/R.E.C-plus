// Tipos y catálogos centralizados para Reportes

export type TipoReporte = 'academico' | 'asistencia' | 'comportamiento' | 'evaluacion';
export type EstadoReporte = 'pendiente' | 'generado' | 'archivado';
export type FormatoReporte = 'pdf' | 'excel' | 'csv';

export interface Reporte {
  id: number;
  titulo: string;
  tipo: TipoReporte;
  periodo: string;
  curso: string;
  fecha: string;
  descripcion: string;
  estado: EstadoReporte;
  formato: FormatoReporte;
}

export const TIPOS_REPORTE = [
  { value: 'academico', label: 'Académico' },
  { value: 'asistencia', label: 'Asistencia' },
  { value: 'comportamiento', label: 'Comportamiento' },
  { value: 'evaluacion', label: 'Evaluación' }
];

export const ESTADOS_REPORTE = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'generado', label: 'Generado' },
  { value: 'archivado', label: 'Archivado' }
];

export const FORMATOS_REPORTE = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' }
]; 