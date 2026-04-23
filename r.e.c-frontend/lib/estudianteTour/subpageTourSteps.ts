import type { TourStepDef } from "./types";

export const EST_MATERIALES_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Materiales",
      description:
        "Aquí ves los recursos que tus docentes comparten contigo según tu grupo y grado. Filtra por materia, tipo y visibilidad, busca por texto y alterna entre lista y cuadrícula.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Materiales: recursos de estudio filtrados para ti. Puedes buscar, filtrar por materia y cambiar la vista.",
  },
  {
    selector: "#tour-est-mat-header",
    popover: {
      title: "Encabezado",
      description:
        "Título de la sección, tu grado–grupo cuando está asignado y un resumen de cuántos materiales ves respecto al total, con la página actual.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado muestra tu grupo y cuántos materiales hay según los filtros y la paginación.",
  },
  {
    selector: "#tour-est-mat-filtros",
    popover: {
      title: "Filtros y vista",
      description:
        "Despliega u oculta filtros: búsqueda, tipo de archivo, visibilidad, materia y tamaño de página. Limpia criterios con un clic. A la derecha eliges lista o cuadrícula y ves si hay filtros activos.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí afinas la lista: búsqueda, tipo, materia, paginación y modo lista o cuadrícula.",
  },
  {
    selector: "#tour-est-mat-list",
    popover: {
      title: "Listado y paginación",
      description:
        "Cada tarjeta es un material: miniatura, título, acceso al archivo o enlace y metadatos. Usa Anterior y Siguiente para recorrer páginas largas.",
      side: "top",
      align: "start",
    },
    voice:
      "Recorre cada recurso y usa la paginación si hay muchos resultados.",
  },
  {
    popover: {
      title: "Materiales listos",
      description:
        "Si no ves nada, puede faltar asignación de grupo o aún no hay publicaciones. Repite esta guía desde la barra «Guía estudiante» cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Materiales. Puedes repetirla desde la barra inferior si la tienes visible.",
  },
];

export const EST_TEMARIOS_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Temarios",
      description:
        "Consulta los temarios de tus materias: estado, periodo, filtros avanzados y enlace al detalle de cada uno.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Temarios: planes por materia con filtros y vista de lista expandible.",
  },
  {
    selector: "#tour-est-tem-header",
    popover: {
      title: "Qué encontrarás",
      description:
        "Resumen de la sección: contenidos por curso con una vista clara y filtrable.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado sitúa la pantalla de temarios del estudiante.",
  },
  {
    selector: "#tour-est-tem-filtros",
    popover: {
      title: "Filtros",
      description:
        "Materia, estado, periodo, contenido, duración, orden y búsqueda rápida. Muestra u oculta el bloque y limpia cuando quieras ver todo otra vez.",
      side: "top",
      align: "start",
    },
    voice:
      "Combina filtros para ubicar rápido el temario que necesitas.",
  },
  {
    selector: "#tour-est-tem-list",
    popover: {
      title: "Listado",
      description:
        "Cada temario muestra título, materia, estado, periodo y un extracto del contenido. Usa «Ver detalle» o el enlace dedicado para leer el plan completo.",
      side: "top",
      align: "start",
    },
    voice:
      "Abre el detalle desde cada tarjeta para leer objetivos, contenidos y evaluación completos.",
  },
  {
    popover: {
      title: "Temarios revisados",
      description:
        "Los docentes controlan el estado; tú consultas y estudias según lo publicado. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Has terminado la guía de Temarios.",
  },
];

/** Vista de solo lectura /estudiante/temarios/[id] */
export const EST_TEMARIO_DETALLE_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: detalle del temario",
      description:
        "Lectura completa del plan: metadatos, fechas y contenido por secciones (o un solo bloque de texto si no hay títulos ##).",
      side: "over",
      align: "center",
    },
    voice:
      "Esta pantalla muestra el temario completo tal como lo elaboró tu docente.",
  },
  {
    selector: "#tour-tem-det-header",
    popover: {
      title: "Título y retorno",
      description:
        "«Volver» regresa al listado de temarios para seguir filtrando o eligiendo otra materia.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Arriba está el título de la vista y el botón Volver al listado.",
  },
  {
    selector: "#tour-tem-det-meta",
    popover: {
      title: "Periodo, duración y estado",
      description:
        "Contexto del plan académico. El estado (borrador, activo, archivado) lo define el docente; aun así puedes leer el contenido si te lo comparten.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Aquí ves periodo, duración y estado del temario.",
  },
  {
    selector: "#tour-tem-det-fechas",
    popover: {
      title: "Auditoría",
      description:
        "Fechas de creación y última actualización para saber si el plan es reciente.",
      side: "top",
      align: "start",
    },
    voice:
      "Las fechas indican cuándo se creó o actualizó el documento.",
  },
  {
    selector: "#tour-tem-det-contenido",
    popover: {
      title: "Cuerpo del temario",
      description:
        "Si usa encabezados ## Objetivos, ## Contenidos, etc., verás tarjetas por bloque; si no, un único campo con todo el texto.",
      side: "top",
      align: "start",
    },
    voice:
      "El contenido se organiza por secciones o en un solo bloque.",
  },
  {
    popover: {
      title: "Temario leído",
      description:
        "Para dudas sobre el plan, habla con tu docente o tutor. Repite esta guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía del detalle del temario.",
  },
];

export const EST_LIGAS_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Ligas",
      description:
        "Comparativo de tu grupo con otros: posición, puntaje, métricas de rendimiento y asistencia, y trazabilidad del cálculo cuando está disponible.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Ligas: ranking y métricas de tu grupo frente al resto.",
  },
  {
    selector: "#tour-est-lig-header",
    popover: {
      title: "Contexto",
      description:
        "Vista general de rendimiento, asistencia y comparativo del grupo.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado resume el propósito de la pantalla.",
  },
  {
    selector: "#tour-est-lig-grupo",
    popover: {
      title: "Tu grupo",
      description:
        "Nombre del grupo y grado asignados; base para todas las métricas que siguen.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Aquí confirmas a qué grupo pertenecen los datos mostrados.",
  },
  {
    selector: "#tour-est-lig-posicion",
    popover: {
      title: "Posición y puntaje",
      description:
        "Lugar en el ranking, puntaje global en escala 0–100 y brecha con el líder cuando hay datos.",
      side: "top",
      align: "start",
    },
    voice:
      "Estas tarjetas muestran posición, puntaje y distancia al primer grupo.",
  },
  {
    selector: "#tour-est-lig-stats",
    popover: {
      title: "Rendimiento, asistencia y comparativo",
      description:
        "Promedios, aprobación, asistencia, variaciones y tendencias calculadas automáticamente.",
      side: "top",
      align: "start",
    },
    voice:
      "Bloques de estadísticas académicas y de asistencia de tu grupo.",
  },
  {
    selector: "#tour-est-lig-trazabilidad",
    popover: {
      title: "Trazabilidad del puntaje",
      description:
        "Desglose de cómo se compone el score cuando el sistema lo expone: pesos y contribuciones.",
      side: "top",
      align: "start",
    },
    voice:
      "Si hay desglose, aquí ves cómo se armó el puntaje del grupo.",
  },
  {
    popover: {
      title: "Ligas listas",
      description:
        "Usa esta vista para motivarte y conversar con tu director de grupo si tienes dudas. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Ligas.",
  },
];

export const EST_HORARIO_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Horario",
      description:
        "Tu semana en grilla o lista: clases, eventos y notas del grupo. Consulta rápida sin editar bloques (eso lo gestionan docentes o secretaría).",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Horario: consulta tu semana de clase y eventos del grupo.",
  },
  {
    selector: "#tour-est-hr-header",
    popover: {
      title: "Encabezado",
      description:
        "Título y propósito: ubicarte en clases, eventos y avisos.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado presenta tu horario personal del grupo.",
  },
  {
    selector: "#tour-est-hr-grupo",
    popover: {
      title: "Grupo asignado",
      description:
        "Si no hay grupo, verás un aviso para contactar secretaría.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Aquí se indica el grupo cuyo calendario estás viendo.",
  },
  {
    selector: "#tour-est-hr-stats",
    popover: {
      title: "Indicadores",
      description:
        "Cantidad de clases, horas a la semana, eventos y notas registradas para tu grupo.",
      side: "bottom",
      align: "center",
    },
    voice:
      "Números de referencia antes de entrar al calendario detallado.",
  },
  {
    selector: "#tour-est-hr-vista",
    popover: {
      title: "Grilla o lista",
      description:
        "Alterna la forma de leer el mismo horario: vista semanal tipo agenda o lista ordenada.",
      side: "top",
      align: "start",
    },
    voice:
      "Elige grilla o lista según te resulte más cómodo.",
  },
  {
    selector: "#tour-est-hr-calendario",
    popover: {
      title: "Calendario principal",
      description:
        "En grilla, cada día y franja muestra la materia o actividad. En lista, verás entradas en orden. Eventos y notas suelen aparecer en secciones aparte cuando existen.",
      side: "top",
      align: "start",
    },
    voice:
      "Este es el cuerpo del horario: bloques por día o lista según el modo.",
  },
  {
    popover: {
      title: "Horario listo",
      description:
        "Ante cambios de última hora, confirma con tu grupo o docente. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Horario.",
  },
];

export const EST_FEEDBACK_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Feedback",
      description:
        "Observaciones de tus docentes: tipos, estados y detalle ampliado en un modal.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Feedback: lee comentarios y seguimientos que te dejan tus profesores.",
  },
  {
    selector: "#tour-est-fb-header",
    popover: {
      title: "Encabezado",
      description:
        "Título de la sección y, si aplica, cuántas observaciones siguen pendientes de atención.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Arriba ves el contexto y alertas de pendientes.",
  },
  {
    selector: "#tour-est-fb-resumen",
    popover: {
      title: "Resumen por tipo",
      description:
        "Cuando hay datos, puedes filtrar rápido tocando el tipo de feedback antes de usar los desplegables.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Si aparecen chips por tipo, sirven como atajo antes de los filtros detallados.",
  },
  {
    selector: "#tour-est-fb-filtros",
    popover: {
      title: "Filtros",
      description:
        "Filtra por tipo y por estado (pendiente o atendida). Si aún no hay feedback, este bloque indica que aparecerán aquí cuando existan observaciones.",
      side: "top",
      align: "start",
    },
    voice:
      "Usa los filtros para acotar la lista de mensajes.",
  },
  {
    selector: "#tour-est-fb-lista",
    popover: {
      title: "Listado y detalle",
      description:
        "Cada tarjeta resume título, tipo, estado y extracto. «Ver detalle» abre el modal con fortalezas y áreas de mejora si el docente las registró.",
      side: "top",
      align: "start",
    },
    voice:
      "Recorre las tarjetas y abre el detalle para leer el mensaje completo.",
  },
  {
    popover: {
      title: "Feedback listo",
      description:
        "Si no hay mensajes, vuelve más adelante o consulta a tus docentes. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Feedback.",
  },
];

export const EST_GESTION_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Gestión académica",
      description:
        "Tu expediente de consulta: filtro por corte, KPIs, grupo, tarjetas por materia con evaluaciones y simulador cuando el colegio lo permite.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de gestión académica del estudiante: notas, cortes y detalle por materia.",
  },
  {
    selector: "#tour-est-ges-header",
    popover: {
      title: "Encabezado",
      description:
        "Título, descripción y ciclo académico activo o cerrado cuando está cargado.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado sitúa tu gestión académica y el periodo vigente.",
  },
  {
    selector: "#tour-est-ges-controls",
    popover: {
      title: "Corte y escala",
      description:
        "Elige un corte específico o «Todos los cortes». Abajo se muestran escala numérica y nota mínima de aprobación del colegio.",
      side: "top",
      align: "start",
    },
    voice:
      "Filtra por corte y revisa la escala y el mínimo para aprobar.",
  },
  {
    selector: "#tour-est-ges-kpis",
    popover: {
      title: "Indicadores resumidos",
      description:
        "Promedio según el filtro, materias con nota en ese alcance, cobertura de registros e inasistencias con desglose justificadas e injustificadas.",
      side: "top",
      align: "center",
    },
    voice:
      "Estas tarjetas resumen tu progreso e inasistencias según el corte elegido.",
  },
  {
    selector: "#tour-est-ges-grupo",
    popover: {
      title: "Grupo asignado",
      description:
        "Grado y grupo al que pertenecen las materias listadas debajo.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Confirmas aquí el grupo de las materias que ves.",
  },
  {
    selector: "#tour-est-ges-materias",
    popover: {
      title: "Detalle por materia",
      description:
        "Cada bloque expande evaluaciones, promedios por corte, simulador opcional y alertas si el docente ya cargó datos.",
      side: "top",
      align: "start",
    },
    voice:
      "Abre cada materia para ver notas, faltas y simulaciones.",
  },
  {
    popover: {
      title: "Gestión revisada",
      description:
        "Ante dudas con notas o faltas, coordina con secretaría o director de grupo. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Gestión académica.",
  },
];

export const EST_RECUPERACIONES_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Recuperaciones",
      description:
        "Solicita recuperación o refuerzo cuando el periodo esté activo, revisa estados, actividades, mensajes con el docente y avisos de tiempo límite.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Recuperaciones: solicitudes, seguimiento y chat con el docente.",
  },
  {
    selector: "#tour-est-rec-header",
    popover: {
      title: "Estado del periodo",
      description:
        "Indica si puedes crear solicitudes o solo consultar. El botón «Nueva solicitud» abre el formulario cuando el periodo está abierto.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Arriba ves si el periodo de recuperación está activo y puedes pedir una nueva solicitud.",
  },
  {
    selector: "#tour-est-rec-avisos",
    popover: {
      title: "Avisos",
      description:
        "Mensajes de error, éxito o recordatorios cuando el cierre está cerca. Revisa siempre antes de enviar una solicitud.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Presta atención a los avisos de periodo y plazos.",
  },
  {
    selector: "#tour-est-rec-form",
    popover: {
      title: "Nueva solicitud",
      description:
        "Al expandir, eliges materia, tipo (recuperación o refuerzo) y motivo. Solo se envía si el periodo permite nuevas solicitudes.",
      side: "top",
      align: "start",
    },
    voice:
      "El formulario aparece al pulsar Nueva solicitud: materia, tipo y motivo obligatorio.",
  },
  {
    selector: "#tour-est-rec-kpis",
    popover: {
      title: "Resumen numérico",
      description:
        "Cuando ya tienes solicitudes, aparecen totales y estados en chips rápidos. Si aún no tienes ninguna, este espacio queda listo para cuando las crees.",
      side: "bottom",
      align: "center",
    },
    voice:
      "Si hay solicitudes, estos números resumen totales y estados.",
  },
  {
    selector: "#tour-est-rec-layout",
    popover: {
      title: "Lista y detalle",
      description:
        "A la izquierda, tus solicitudes con filtro por estado. A la derecha, el panel de detalle con pestañas de información, actividades y mensajes.",
      side: "top",
      align: "start",
    },
    voice:
      "Elige una solicitud a la izquierda para ver detalle, actividades y mensajes a la derecha.",
  },
  {
    popover: {
      title: "Recuperaciones listas",
      description:
        "Mantén la comunicación en la pestaña Mensajes cuando el docente lo permita. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Recuperaciones.",
  },
];

export const EST_PASSWORD_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: cambiar contraseña",
      description:
        "Debes conocer la contraseña actual. La nueva debe coincidir en confirmación y cumplir la longitud mínima (por ejemplo 6 caracteres).",
      side: "over",
      align: "center",
    },
    voice:
      "Guía para cambiar contraseña: actual, nueva y confirmación.",
  },
  {
    selector: "#tour-est-pw-header",
    popover: {
      title: "Antes de empezar",
      description:
        "Actualiza tu clave en un entorno seguro. Si sospechas acceso indebido, avisa al colegio y elige una contraseña que no reutilices en otros sitios.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Lee el contexto y asegúrate de recordar tu contraseña actual.",
  },
  {
    selector: "#tour-est-pw-form",
    popover: {
      title: "Formulario",
      description:
        "Completa actual, nueva y confirmar. Tras guardar verás éxito o error si la actual no coincide o la nueva no cumple reglas.",
      side: "top",
      align: "start",
    },
    voice:
      "Completa los tres campos y envía el formulario.",
  },
  {
    popover: {
      title: "Contraseña lista",
      description:
        "Cierra sesión en otros dispositivos si cambiaste la clave por seguridad. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de cambio de contraseña.",
  },
];
