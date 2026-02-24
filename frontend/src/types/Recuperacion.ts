export interface NuevaSolicitudRecuperacion {
  estudiante_id: number;
  profesor_id: number;
  materia_id: number;
  tipo_solicitud: 'recuperacion' | 'refuerzo';
  motivo: string;
  fecha_limite?: string;
}

export interface SolicitudRecuperacion {
  id: number;
  estudiante_id: number;
  profesor_id: number;
  materia_id: number;
  tipo_solicitud: 'recuperacion' | 'refuerzo';
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'completada';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  comentario_profesor?: string;
  fecha_limite?: string;
  actividades_asignadas?: string;
  nota_final?: number;
  // Datos relacionados
  estudiante_nombre?: string;
  profesor_nombre?: string;
  materia_nombre?: string;
}

export interface ActividadRecuperacion {
  id: number;
  solicitud_id: number;
  titulo: string;
  descripcion: string;
  tipo_actividad: 'tarea' | 'examen' | 'proyecto' | 'trabajo_practico';
  fecha_inicio: string;
  fecha_limite: string;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'evaluada';
  nota_obtenida?: number;
  comentarios_estudiante?: string;
  comentarios_profesor?: string;
  archivo_adjunto?: string;
  archivo_nombre?: string;
  fecha_creacion: string;
}

export interface SeguimientoRecuperacion {
  id: number;
  solicitud_id: number;
  usuario_id: number;
  tipo_usuario: 'estudiante' | 'profesor';
  mensaje: string;
  fecha_mensaje: string;
  archivo_adjunto?: string;
  usuario_nombre?: string;
}

export interface NuevaActividadRecuperacion {
  solicitud_id: number;
  titulo: string;
  descripcion: string;
  tipo_actividad: 'tarea' | 'examen' | 'proyecto' | 'trabajo_practico';
  fecha_inicio: string;
  fecha_limite: string;
}

export interface NuevoSeguimiento {
  solicitud_id: number;
  usuario_id: number;
  tipo_usuario: 'estudiante' | 'profesor';
  mensaje: string;
  archivo_adjunto?: string;
}

export interface EstadisticasRecuperacion {
  total_solicitudes: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  completadas: number;
  promedio_notas: number | null;
}

export interface MateriaConProfesor {
  materia_id: number;
  materia_nombre: string;
  profesor_id: number;
  profesor_nombre: string;
}
