import type { TourStepDef } from "./types";

export const MATERIALES_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Materiales",
      description:
        "Aquí ves todo lo que publicaste como docente: PDFs, enlaces, videos y más. Filtra por grupo, materia y visibilidad, y cambia entre lista y cuadrícula.",
      side: "over",
      align: "center",
    },
    voice:
      "Bienvenido a la guía de Materiales. Este listado reúne lo que publicas para tus estudiantes. Puedes filtrar por grupo y materia y ver en lista o en cuadrícula.",
  },
  {
    selector: "#tour-mat-header",
    popover: {
      title: "Resumen de la sección",
      description:
        "El encabezado muestra cuántos materiales tienes y el estado del filtrado actual. Siempre sabes si estás viendo un subconjunto o el total.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado resume cuántos materiales tienes y qué parte estás viendo según los filtros.",
  },
  {
    selector: "#tour-mat-crear",
    popover: {
      title: "Crear material",
      description:
        "Abre el formulario para subir o enlazar un nuevo recurso y asignarlo a grupo y materia. Es el flujo principal para alimentar a tus clases.",
      side: "left",
      align: "start",
    },
    voice:
      "Con Crear material abres el formulario para publicar un recurso nuevo y asignarlo a tus grupos.",
  },
  {
    selector: "#tour-mat-filtros",
    popover: {
      title: "Filtros y búsqueda",
      description:
        "Reduce la lista por grupo, tipo, visibilidad, materia o texto. Puedes limpiar todo con un clic cuando quieras volver a la vista completa.",
      side: "top",
      align: "start",
    },
    voice:
      "Los filtros te ayudan a encontrar rápido un material entre muchos. Puedes combinar grupo, tipo, materia y búsqueda por texto.",
  },
  {
    selector: "#tour-mat-list",
    popover: {
      title: "Listado y paginación",
      description:
        "Cada tarjeta o fila es un material: abrir vista pública, **Editar** para ajustar recurso y miniatura, o eliminar si aplica. La paginación evita cargar listas enormes de golpe.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí recorres cada material: puedes abrirlo, editar contenido y miniatura, o borrarlo si tienes permiso. Usa la paginación si la lista es larga.",
  },
  {
    popover: {
      title: "Crear, editar y miniaturas",
      description:
        "**Crear material** abre el formulario completo por pasos. **Editar** te lleva a la misma estructura con datos cargados. Si subes una imagen local entre 1 y 2 MB puede aparecer un modal preguntando si quieres usarla igualmente.",
      side: "over",
      align: "center",
    },
    voice:
      "Para publicar algo nuevo usa Crear material. Para ajustar algo existente, Editar en la fila. Si la miniatura pesa entre uno y dos megas, el sistema puede preguntarte si la usas igual.",
  },
  {
    popover: {
      title: "Materiales listos",
      description:
        "Cuando subas contenido, tus estudiantes lo verán según la visibilidad que elijas. Puedes repetir esta guía cuando quieras desde la barra «Guía docente» (si la tienes visible en el panel) o desde «Ver guía otra vez».",
      side: "over",
      align: "center",
    },
    voice:
      "Has terminado la guía de Materiales. Puedes volver a verla desde la barra de guía docente si la activaste en el panel.",
  },
];

export const HORARIOS_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Horarios",
      description:
        "Organiza la semana de tus grupos: grilla por días, entradas recurrentes, eventos puntuales y notas. Si eres director de grupo, también creas y editas bloques.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Horarios: aquí organizas la semana de clase, ves la grilla por días y, si te corresponde, administras entradas y eventos.",
  },
  {
    selector: "#tour-hor-header",
    popover: {
      title: "Contexto del horario",
      description:
        "Indica si estás en modo gestión o solo consulta según tu rol en el grupo. El subtítulo resume para qué sirve la pantalla.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado indica si puedes editar el horario o solo consultarlo, según tu rol.",
  },
  {
    selector: "#tour-hor-grupos",
    popover: {
      title: "Selector de grupo",
      description:
        "Cambia de grupo para ver otro calendario. Cada grupo tiene su propio conjunto de clases, eventos y notas.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Elige el grupo para cargar el horario que corresponde a esa clase.",
  },
  {
    selector: "#tour-hor-stats",
    popover: {
      title: "Indicadores rápidos",
      description:
        "Clases registradas, horas a la semana, eventos y notas del grupo seleccionado. Son números de referencia antes de entrar al detalle.",
      side: "bottom",
      align: "center",
    },
    voice:
      "Estas tarjetas resumen clases, horas semanales, eventos y notas del grupo activo.",
  },
  {
    selector: "#tour-hor-tabs",
    popover: {
      title: "Horario, entradas y eventos",
      description:
        "La pestaña Horario muestra la grilla semanal. Si tienes permisos, Entrada, Evento y Nota permiten planificar bloques y recordatorios.",
      side: "top",
      align: "start",
    },
    voice:
      "Usa las pestañas para ver la grilla o, si aplica, crear entradas recurrentes, eventos y notas.",
  },
  {
    popover: {
      title: "Horarios bajo control",
      description:
        "Mantén la grilla al día para que el panel docente y tus estudiantes reflejen la realidad del aula. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Horarios. Puedes repetirla desde la barra de guía docente.",
  },
];

export const TEMARIOS_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Temarios",
      description:
        "Crea y administra temarios por grupo y materia: estados borrador, activo o archivado, filtros ricos y edición de contenidos por secciones.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Temarios: aquí planeas el contenido por grupo y materia y activas el temario que siguen tus estudiantes.",
  },
  {
    selector: "#tour-tem-header",
    popover: {
      title: "Qué es esta pantalla",
      description:
        "Listado centralizado de temarios con búsqueda y filtros por grupo, materia, periodo y estado.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado sitúa la pantalla: gestión completa de temarios con filtros avanzados.",
  },
  {
    selector: "#tour-tem-toolbar",
    popover: {
      title: "Filtros del listado",
      description:
        "Despliega u oculta filtros por grupo, materia, periodo y estado. Limpia criterios cuando quieras volver a ver todos los temarios.",
      side: "top",
      align: "start",
    },
    voice:
      "Este bloque concentra los filtros: puedes mostrarlos u ocultarlos y limpiar para ver la lista completa.",
  },
  {
    selector: "#tour-tem-btn-crear",
    popover: {
      title: "Crear temario",
      description:
        "Abre un **modal** con título, grupo, materia, periodo, duración, estado y el contenido (objetivos, contenidos, actividades, etc.). Al guardar, el temario aparece en la lista y puedes abrir su detalle.",
      side: "left",
      align: "start",
    },
    voice:
      "Crear temario abre una ventana donde completas datos y secciones del plan. Al guardar, el ítem queda en la lista.",
  },
  {
    selector: "#tour-tem-lista",
    popover: {
      title: "Lista de temarios",
      description:
        "Cada fila o tarjeta enlaza al detalle: objetivos, contenidos, actividades y estado. Activa solo un temario por contexto cuando toque.",
      side: "top",
      align: "start",
    },
    voice:
      "Recorre la lista para abrir cada temario, revisar secciones y cambiar el estado a activo cuando esté listo.",
  },
  {
    popover: {
      title: "Temarios alineados",
      description:
        "Un temario activo ayuda a que materiales y clase vayan en la misma dirección. Vuelve a la guía desde la barra si lo necesitas.",
      side: "over",
      align: "center",
    },
    voice:
      "Has terminado la guía de Temarios. Puedes repetirla cuando quieras desde la barra de guía docente.",
  },
];

export const FEEDBACK_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Feedback",
      description:
        "Registra retroalimentación para estudiantes: tipos positiva, negativa, informativa o seguimiento, y estado pendiente o atendida.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Feedback: aquí documentas observaciones y seguimiento para tus estudiantes.",
  },
  {
    selector: "#tour-fb-header",
    popover: {
      title: "Encabezado",
      description:
        "Resumen de la sección y acceso rápido a «Nuevo feedback» cuando ya elegiste un grupo.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado resume la sección y te lleva a crear feedback cuando hay grupo seleccionado.",
  },
  {
    selector: "#tour-fb-grupo",
    popover: {
      title: "Grupo y métricas",
      description:
        "Elige el grupo activo y revisa totales, pendientes y atendidas antes de filtrar la lista inferior.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Selecciona el grupo y mira el resumen de feedbacks totales, pendientes y atendidos.",
  },
  {
    selector: "#tour-fb-filtros",
    popover: {
      title: "Filtros",
      description:
        "Filtra por tipo, estudiante, estado o texto para acotar la lista antes de abrir un caso.",
      side: "top",
      align: "start",
    },
    voice:
      "Usa los filtros para encontrar rápido un feedback por tipo, estudiante o estado.",
  },
  {
    selector: "#tour-fb-lista",
    popover: {
      title: "Lista de feedback",
      description:
        "Cada tarjeta es un registro: ver detalle, editar o eliminar. Mantén el estado al día para saber qué falta por atender.",
      side: "top",
      align: "start",
    },
    voice:
      "En la lista abres cada feedback, ves el detalle o lo editas. Actualiza el estado cuando lo hayas atendido.",
  },
  {
    popover: {
      title: "Formulario en modal",
      description:
        "Tras elegir grupo, **Nuevo feedback** abre un modal: estudiante, tipo (positiva, negativa, informativa, seguimiento), título, fortalezas, áreas de mejora y estado. Lo mismo aplica al **editar** un registro existente.",
      side: "over",
      align: "center",
    },
    voice:
      "Cuando ya tienes un grupo, Nuevo feedback abre un formulario en ventana emergente con estudiante, tipo y texto. Editar reutiliza el mismo tipo de formulario.",
  },
  {
    popover: {
      title: "Feedback registrado",
      description:
        "Mantener feedback claro ayuda a coordinación y familias. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Feedback. Puedes repetirla desde la barra de guía docente.",
  },
];

export const GESTION_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Gestión académica",
      description:
        "Registra notas por corte, inasistencias y observaciones por estudiante y materia. Es la vista más detallada del rendimiento en tus grupos.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Gestión académica: aquí registras notas, ausencias y observaciones por estudiante y materia.",
  },
  {
    selector: "#tour-ges-header",
    popover: {
      title: "Ciclo y contexto",
      description:
        "Muestra el ciclo académico activo y el estado del periodo. Si está cerrado, revisa con secretaría antes de editar.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado muestra el ciclo académico y si el periodo permite edición.",
  },
  {
    selector: "#tour-ges-controls",
    popover: {
      title: "Grupo y corte",
      description:
        "Selecciona grupo y filtra por corte para ver solo las evaluaciones de ese periodo. Así reduces ruido al calificar.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Elige grupo y corte para filtrar las notas y ausencias que vas a revisar.",
  },
  {
    selector: "#tour-ges-kpis",
    popover: {
      title: "Indicadores del grupo",
      description:
        "Promedio, aprobación, cobertura de notas y estudiantes en riesgo según el filtro actual. Úsalos para priorizar a quién atender primero.",
      side: "top",
      align: "start",
    },
    voice:
      "Los indicadores resumen el grupo: promedio, aprobación, cobertura y alertas de riesgo.",
  },
  {
    selector: "#tour-ges-estudiantes",
    popover: {
      title: "Lista de estudiantes",
      description:
        "Selecciona un alumno y a la derecha se despliegan sus materias. En cada materia añades evaluaciones, pesos y notas, y guardas por bloque.",
      side: "right",
      align: "start",
    },
    voice:
      "Elige un estudiante en la lista y edita cada materia: evaluaciones, notas y ausencias. No olvides guardar los cambios.",
  },
  {
    selector: "#tour-ges-detalle",
    popover: {
      title: "Panel del estudiante",
      description:
        "Aquí ves resumen, promedio y **cada materia** con cortes, notas, inasistencias y observaciones. Los cambios suelen guardarse por sección: revisa mensajes de confirmación antes de cambiar de alumno.",
      side: "left",
      align: "start",
    },
    voice:
      "A la derecha está el detalle del estudiante elegido: materias, notas y asistencia. Guarda por bloque para no perder cambios.",
  },
  {
    popover: {
      title: "Gestión al día",
      description:
        "Registrar a tiempo mantiene coherentes ligas, recuperaciones y reportes. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Gestión académica. Puedes repetirla desde la barra de guía docente.",
  },
];

export const RECUPERACIONES_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Recuperaciones",
      description:
        "Atiende solicitudes de estudiantes, cambia estados, asigna actividades y conversa por mensajes según las reglas del colegio.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Recuperaciones: aquí gestionas solicitudes, actividades y mensajes con tus estudiantes.",
  },
  {
    selector: "#tour-rec-header",
    popover: {
      title: "Periodo de recuperación",
      description:
        "Comprueba si el periodo está activo y cuánto falta para el cierre. Fuera de periodo puede ser solo lectura.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El encabezado muestra si el periodo de recuperaciones está abierto y el tiempo restante.",
  },
  {
    selector: "#tour-rec-periodo",
    popover: {
      title: "Alertas y avisos",
      description:
        "Mensajes sobre el estado del periodo y recordatorios cuando queda poco tiempo. Revisa esta caja al entrar.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Esta zona concentra alertas del periodo y avisos importantes.",
  },
  {
    selector: "#tour-rec-panel",
    popover: {
      title: "Grupo y contadores",
      description:
        "Elige el grupo y revisa totales por estado: pendientes, aceptadas, completadas y rechazadas.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Selecciona grupo y mira los contadores de solicitudes por estado.",
  },
  {
    selector: "#tour-rec-layout",
    popover: {
      title: "Solicitudes y detalle",
      description:
        "A la izquierda la lista filtrable; al elegir una solicitud ves el detalle, actividades y mensajes. Responde y actualiza el estado según el flujo del colegio.",
      side: "top",
      align: "start",
    },
    voice:
      "A la izquierda están las solicitudes; al seleccionar una ves el detalle, actividades y mensajes para dar seguimiento.",
  },
  {
    selector: "#tour-rec-detalle",
    popover: {
      title: "Detalle, actividades y mensajes",
      description:
        "En el panel derecho aparecen pestañas: **Detalle** del caso, **Actividades** propuestas o acordadas y **Mensajes** con el estudiante. Si no hay nada seleccionado, verás un mensaje para elegir una solicitud de la lista.",
      side: "left",
      align: "start",
    },
    voice:
      "El panel de la derecha muestra detalle, actividades y mensajes cuando eliges una solicitud de la izquierda.",
  },
  {
    popover: {
      title: "Recuperaciones atendidas",
      description:
        "Responder a tiempo mejora la confianza del estudiante. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Recuperaciones. Puedes repetirla desde la barra de guía docente.",
  },
];

export const LIGAS_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: Ligas",
      description:
        "Consulta métricas automáticas por grupo y comparativas en el grado: rendimiento, asistencia y ranking. Los valores se calculan con datos reales del sistema.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de Ligas: aquí ves métricas automáticas de desempeño por grupo y comparativas en el grado.",
  },
  {
    selector: "#tour-lig-header",
    popover: {
      title: "Propósito",
      description:
        "Ligas no se edita a mano: resume lo que ocurre en gestión académica, asistencia y recuperaciones. Usa «Actualizar» para refrescar cifras.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Ligas resume datos del sistema; usa Actualizar para refrescar las métricas.",
  },
  {
    selector: "#tour-lig-selector",
    popover: {
      title: "Grupo y ranking",
      description:
        "Selecciona el grupo para cargar su puntaje, posición en el grado y brecha con el líder.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Elige el grupo para ver posición en el grado, puntaje y comparativa.",
  },
  {
    selector: "#tour-lig-metricas",
    popover: {
      title: "Tarjetas de desempeño",
      description:
        "Promedio, asistencia, aprobación y desglose de componentes. Úsalas para conversar con coordinación o planificar refuerzos.",
      side: "top",
      align: "start",
    },
    voice:
      "Estas tarjetas detallan rendimiento, asistencia y otros indicadores del grupo seleccionado.",
  },
  {
    popover: {
      title: "Ligas como espejo",
      description:
        "Si mejoras notas y asistencia en gestión académica, Ligas lo reflejará. Repite la guía desde la barra cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de Ligas. Puedes repetirla desde la barra de guía docente.",
  },
];

/** Formulario /docente/materiales/crear */
export const MATERIALES_CREAR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: crear material",
      description:
        "Vas a publicar un recurso nuevo: primero asignación (grupo y materia), luego título y tipo de contenido, miniatura opcional y visibilidad. Puedes volver al listado con «Volver».",
      side: "over",
      align: "center",
    },
    voice:
      "Guía para crear material: asignas grupo y materia, luego título, enlace o archivo, miniatura y visibilidad.",
  },
  {
    selector: "#tour-mat-cr-header",
    popover: {
      title: "Título y navegación",
      description:
        "«Volver» te regresa al listado sin perder el contexto de la sección Materiales.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Arriba está el título de la pantalla y el enlace para volver a la lista de materiales.",
  },
  {
    selector: "#tour-mat-cr-resumen",
    popover: {
      title: "Resumen en vivo",
      description:
        "Mientras eliges grupo, materia, tipo y visibilidad, esta franja resume lo seleccionado para que verifiques antes de guardar.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El resumen muestra de un vistazo grupo, materia, tipo y visibilidad que vas eligiendo.",
  },
  {
    selector: "#tour-mat-cr-asig",
    popover: {
      title: "Asignación académica",
      description:
        "Grupo y materia definen **quién** verá el material. Solo aparecen combinaciones de tus asignaciones docentes.",
      side: "top",
      align: "start",
    },
    voice:
      "Elige grupo y materia según tus asignaciones; así el material queda ligado a la clase correcta.",
  },
  {
    selector: "#tour-mat-cr-contenido",
    popover: {
      title: "Contenido del material",
      description:
        "Título obligatorio, tipo (PDF, video, enlace…), descripción opcional, URL del recurso y **archivo local** si prefieres subir en lugar de enlazar.",
      side: "top",
      align: "start",
    },
    voice:
      "Completa título y tipo, añade descripción si quieres, y usa URL o archivo local para el recurso principal.",
  },
  {
    selector: "#tour-mat-cr-media",
    popover: {
      title: "Miniatura y visibilidad",
      description:
        "Miniatura local o URL de imagen para la tarjeta. **Visibilidad**: solo el grupo o todo el grado. Si la imagen local pesa más de 1 MB puede abrirse un modal de confirmación.",
      side: "top",
      align: "start",
    },
    voice:
      "Configura miniatura y si el material es visible solo para el grupo o para todo el grado. Imágenes pesadas pueden pedir confirmación.",
  },
  {
    selector: "#tour-mat-cr-actions",
    popover: {
      title: "Publicar",
      description:
        "«Crear material» envía el formulario cuando título, grupo, materia, tipo y visibilidad están completos.",
      side: "top",
      align: "end",
    },
    voice:
      "Pulsa Crear material cuando todo obligatorio esté listo.",
  },
  {
    popover: {
      title: "Listo",
      description:
        "Tras crear, puedes seguir publicando o volver al listado. La guía de Materiales en el panel marca este módulo como visto cuando terminas el último paso.",
      side: "over",
      align: "center",
    },
    voice:
      "Has recorrido el formulario de creación. Puedes repetir esta guía desde el panel si activaste la barra de guía docente.",
  },
];

/** Formulario /docente/materiales/editar/[id] */
export const MATERIALES_EDITAR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: editar material",
      description:
        "Actualizas título, descripción, recurso, miniatura y visibilidad. Grupo y materia suelen ser fijos en esta vista para no romper la asignación.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía de edición de material: ajustas texto, enlace o archivo, miniatura y visibilidad.",
  },
  {
    selector: "#tour-mat-ed-header",
    popover: {
      title: "Ver público y volver",
      description:
        "«Ver» abre la vista del estudiante. «Volver» regresa al listado docente.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Puedes previsualizar cómo se ve el material o volver a la lista.",
  },
  {
    selector: "#tour-mat-ed-resumen",
    popover: {
      title: "Resumen del ítem",
      description:
        "Confirma materia, grupo, tipo, visibilidad y si hay archivo o enlace antes de cambiar campos sensibles.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El resumen te recuerda a qué grupo y materia pertenece este material.",
  },
  {
    selector: "#tour-mat-ed-asig",
    popover: {
      title: "Asignación (solo lectura)",
      description:
        "Grupo y materia se muestran bloqueados para mantener coherencia con la publicación original.",
      side: "top",
      align: "start",
    },
    voice:
      "Grupo y materia no se cambian aquí; es una medida de seguridad de datos.",
  },
  {
    selector: "#tour-mat-ed-contenido",
    popover: {
      title: "Contenido y archivos",
      description:
        "Edita título, tipo, descripción, URL o sube un archivo nuevo. Puedes quitar la miniatura local o el archivo guardado con los botones indicados.",
      side: "top",
      align: "start",
    },
    voice:
      "Modifica el contenido principal y la miniatura; puedes reemplazar o quitar archivos.",
  },
  {
    selector: "#tour-mat-ed-actions",
    popover: {
      title: "Guardar o eliminar",
      description:
        "**Guardar cambios** persiste todo. **Eliminar** pide confirmación: es irreversible para el material.",
      side: "top",
      align: "end",
    },
    voice:
      "Guarda cuando termines o usa Eliminar con cuidado tras confirmar.",
  },
  {
    popover: {
      title: "Edición lista",
      description:
        "Los mismos avisos de miniatura pesada que en crear pueden aparecer al subir imagen local. Repite la guía cuando quieras desde el panel.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de edición de material.",
  },
];

/** Vista solo lectura /docente/temarios/[id] */
export const TEMARIO_DETALLE_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: detalle del temario",
      description:
        "Vista de solo lectura del plan: metadatos, fechas y contenido por secciones (o texto único si no usaste encabezados ##). Desde aquí comprendes qué ven los estudiantes cuando el temario está activo.",
      side: "over",
      align: "center",
    },
    voice:
      "Esta pantalla muestra el temario completo: datos generales y contenido organizado por secciones.",
  },
  {
    selector: "#tour-tem-det-header",
    popover: {
      title: "Título y retorno",
      description:
        "«Volver» te lleva al listado de temarios para seguir editando o filtrando.",
      side: "bottom",
      align: "start",
    },
    voice:
      "El título del temario y el botón Volver están arriba.",
  },
  {
    selector: "#tour-tem-det-meta",
    popover: {
      title: "Materia, grupo y estado",
      description:
        "Periodo, duración y estado (borrador, activo, archivado). Un solo temario **activo** por contexto suele ser la referencia para estudiantes.",
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
        "Fechas de creación y última actualización para saber cuándo se revisó el plan.",
      side: "top",
      align: "start",
    },
    voice:
      "Las fechas ayudan a saber cuándo se creó o actualizó el documento.",
  },
  {
    selector: "#tour-tem-det-contenido",
    popover: {
      title: "Cuerpo del temario",
      description:
        "Si el contenido usa títulos ## Objetivos, ## Contenidos, etc., verás tarjetas por bloque; si no, un solo campo con todo el texto.",
      side: "top",
      align: "start",
    },
    voice:
      "El contenido se muestra por secciones o en un solo bloque según cómo lo escribiste.",
  },
  {
    popover: {
      title: "Temario revisado",
      description:
        "Para cambiar el contenido o el estado debes ir al listado y abrir la edición desde allí. Repite esta guía desde el panel cuando la necesites.",
      side: "over",
      align: "center",
    },
    voice:
      "Has terminado la guía del detalle del temario.",
  },
];

export const PERFIL_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: tu perfil",
      description:
        "Aquí ves tus datos de docente, resumen de asignaciones y atajos a secciones frecuentes. La contraseña se cambia en la pantalla dedicada.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía del perfil docente: datos, resumen de grupos y materias, y enlaces rápidos.",
  },
  {
    selector: "#tour-perfil-header",
    popover: {
      title: "Identidad y acceso",
      description:
        "Nombre, rol y correo. **Cambiar contraseña** abre el formulario seguro sin salir del área docente.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Arriba está tu identidad y el botón para cambiar contraseña.",
  },
  {
    selector: "#tour-perfil-datos",
    popover: {
      title: "Datos personales",
      description:
        "Nombre completo, correo institucional y código interno si el colegio lo usa.",
      side: "top",
      align: "start",
    },
    voice:
      "Esta tarjeta resume tus datos personales visibles.",
  },
  {
    selector: "#tour-perfil-resumen",
    popover: {
      title: "Resumen numérico",
      description:
        "Cantidad de materias distintas, grupos y asignaciones totales derivadas de tu carga.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí ves conteos rápidos de materias, grupos y asignaciones.",
  },
  {
    selector: "#tour-perfil-materias",
    popover: {
      title: "Materias",
      description:
        "Listado de las materias que impartes según las asignaciones cargadas en el sistema.",
      side: "top",
      align: "start",
    },
    voice:
      "La lista muestra cada materia que tienes asignada.",
  },
  {
    selector: "#tour-perfil-grupos",
    popover: {
      title: "Grupos",
      description:
        "Grados y grupos concretos donde apareces como docente.",
      side: "top",
      align: "start",
    },
    voice:
      "Estos son los grupos en los que figuras como profesor.",
  },
  {
    selector: "#tour-perfil-atajos",
    popover: {
      title: "Atajos",
      description:
        "Salto rápido a temarios, materiales, recuperaciones y feedback.",
      side: "top",
      align: "start",
    },
    voice:
      "Los accesos directos te llevan a las secciones del día a día.",
  },
  {
    popover: {
      title: "Perfil listo",
      description:
        "Mantén tus datos al día con secretaría si algo no coincide. Repite la guía desde la barra inferior cuando quieras.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía del perfil.",
  },
];

export const PASSWORD_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: cambiar contraseña",
      description:
        "Debes conocer la contraseña actual. La nueva debe coincidir en los dos últimos campos y cumplir la longitud mínima del colegio.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía para cambiar contraseña: contraseña actual, nueva y confirmación.",
  },
  {
    selector: "#tour-pw-header",
    popover: {
      title: "Antes de empezar",
      description:
        "Cierra otras sesiones si sospechas acceso indebido y elige una clave que no reutilices en otros sitios.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Lee el contexto y asegúrate de recordar tu contraseña actual.",
  },
  {
    selector: "#tour-pw-form",
    popover: {
      title: "Formulario",
      description:
        "**Actual**, luego **nueva** y **confirmar**. Tras guardar verás un mensaje de éxito o un error si la actual no coincide.",
      side: "top",
      align: "start",
    },
    voice:
      "Completa los tres campos y envía el formulario.",
  },
  {
    popover: {
      title: "Listo",
      description:
        "Vuelve al perfil o al panel cuando termines. Repite esta guía desde la barra si la necesitas.",
      side: "over",
      align: "center",
    },
    voice:
      "Fin de la guía de cambio de contraseña.",
  },
];

/** Modal «Crear temario» en /docente/temarios (no marca progreso del módulo). */
export const TEMARIO_MODAL_CREAR_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: crear temario (modal)",
      description:
        "Define grupo, materia, título y metadatos; luego el contenido por secciones o en un solo campo. Cancelar cierra sin guardar.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía del modal de crear temario: datos básicos y contenido.",
  },
  {
    selector: "#tour-tem-modal-crear-asig",
    popover: {
      title: "Grupo y materia",
      description:
        "Son obligatorios para ubicar el temario en tu carga docente.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Elige grupo y materia primero.",
  },
  {
    selector: "#tour-tem-modal-crear-meta",
    popover: {
      title: "Título y periodo",
      description:
        "Título visible, periodo, estado (borrador o activo) y duración orientativa.",
      side: "top",
      align: "start",
    },
    voice:
      "Completa título, periodo, estado y duración.",
  },
  {
    selector: "#tour-tem-modal-crear-modo",
    popover: {
      title: "Modo de contenido",
      description:
        "**Separado** usa campos por objetivos, contenidos, etc. **Campo único** guarda todo el texto tal cual.",
      side: "top",
      align: "start",
    },
    voice:
      "Alterna entre secciones o un solo bloque de texto.",
  },
  {
    selector: "#tour-tem-modal-crear-cuerpo",
    popover: {
      title: "Contenido",
      description:
        "Rellena las áreas según el modo. Puedes volver a «Separado» sin perder texto si ya compusiste secciones.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí va el contenido pedagógico del temario.",
  },
  {
    selector: "#tour-tem-modal-crear-actions",
    popover: {
      title: "Guardar o salir",
      description:
        "**Crear temario** valida campos mínimos. **Cancelar** descarta si no guardaste.",
      side: "top",
      align: "end",
    },
    voice:
      "Confirma con Crear temario o cierra con Cancelar.",
  },
];

export const TEMARIO_MODAL_EDITAR_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: editar temario",
      description:
        "Ajustas título, periodo, estado, duración y el cuerpo con el mismo criterio de modo separado o único que al crear.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía del modal de edición de temario.",
  },
  {
    selector: "#tour-tem-modal-edit-meta",
    popover: {
      title: "Metadatos",
      description:
        "Título, duración, periodo y estado. Activo implica que los estudiantes pueden tomarlo como referencia según reglas del colegio.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Actualiza los datos generales del plan.",
  },
  {
    selector: "#tour-tem-modal-edit-modo",
    popover: {
      title: "Estructura del texto",
      description:
        "Mismo conmutador Separado o Campo único que en la creación.",
      side: "top",
      align: "start",
    },
    voice:
      "Elige cómo editar el contenido.",
  },
  {
    selector: "#tour-tem-modal-edit-cuerpo",
    popover: {
      title: "Contenido",
      description:
        "Edita secciones o el bloque único. **Guardar cambios** aplica al temario seleccionado.",
      side: "top",
      align: "start",
    },
    voice:
      "Modifica el contenido y guarda al final.",
  },
  {
    selector: "#tour-tem-modal-edit-actions",
    popover: {
      title: "Cerrar o guardar",
      description:
        "**Cancelar** cierra el modal; **Guardar cambios** persiste.",
      side: "top",
      align: "end",
    },
    voice:
      "Guarda o cancela según corresponda.",
  },
];

export const TEMARIO_MODAL_ELIMINAR_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: eliminar temario",
      description:
        "Confirmación irreversible: el temario deja de estar disponible para estudiantes y listados. Verifica el título mostrado.",
      side: "over",
      align: "center",
    },
    voice:
      "Estás por eliminar un temario de forma permanente.",
  },
  {
    selector: "#tour-tem-modal-del-titulo",
    popover: {
      title: "Qué se borra",
      description:
        "Comprueba que el nombre coincide con el ítem que quieres quitar.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Revisa el título del temario antes de confirmar.",
  },
  {
    selector: "#tour-tem-modal-del-actions",
    popover: {
      title: "Decisión",
      description:
        "**Cancelar** mantiene todo. **Eliminar** ejecuta el borrado.",
      side: "top",
      align: "end",
    },
    voice:
      "Cancelar para volver atrás o Eliminar para confirmar.",
  },
];

export const FEEDBACK_MODAL_FORM_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: formulario de feedback",
      description:
        "Al **crear**, eliges estudiante y materia arriba. Al **editar**, esos campos suelen estar fijos. Luego tipo, estado, título y texto obligatorio.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía del formulario de feedback en el modal.",
  },
  {
    selector: "#tour-fb-modal-header",
    popover: {
      title: "Cabecera",
      description:
        "Indica si es nuevo o edición. La X cierra sin guardar.",
      side: "bottom",
      align: "start",
    },
    voice:
      "La cabecera muestra el modo del formulario.",
  },
  {
    popover: {
      title: "Estudiante y materia (solo al crear)",
      description:
        "Si el modal es **Nuevo feedback**, arriba del formulario verás estudiante obligatorio y materia opcional. En **Editar** ese bloque no aparece porque el caso ya está ligado.",
      side: "over",
      align: "center",
    },
    voice:
      "Al crear feedback eliges estudiante y materia en la parte superior del formulario. Al editar, ese bloque no se muestra.",
  },
  {
    selector: "#tour-fb-modal-clasificacion",
    popover: {
      title: "Tipo y estado",
      description:
        "Positiva, negativa, informativa o seguimiento; y pendiente o atendida para tu control interno.",
      side: "top",
      align: "start",
    },
    voice:
      "Clasifica el feedback y marca si ya lo atendiste.",
  },
  {
    selector: "#tour-fb-modal-texto",
    popover: {
      title: "Título y contenido",
      description:
        "Resumen corto y cuerpo principal de la retroalimentación.",
      side: "top",
      align: "start",
    },
    voice:
      "Escribe título y contenido obligatorios.",
  },
  {
    selector: "#tour-fb-modal-extras",
    popover: {
      title: "Fortalezas y mejoras",
      description:
        "Opcionales: una idea por línea; se muestran ordenadas en el detalle del feedback.",
      side: "top",
      align: "start",
    },
    voice:
      "Puedes listar fortalezas y áreas de mejora en líneas separadas.",
  },
  {
    selector: "#tour-fb-modal-actions",
    popover: {
      title: "Enviar",
      description:
        "**Crear feedback** o **Actualizar** según el caso. Cancelar descarta cambios no guardados.",
      side: "top",
      align: "end",
    },
    voice:
      "Confirma con el botón principal o cancela.",
  },
];

export const FEEDBACK_MODAL_DELETE_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: eliminar feedback",
      description:
        "Se borra el registro de observación. Asegúrate de que ya no lo necesitas para seguimiento o auditoría.",
      side: "over",
      align: "center",
    },
    voice:
      "Confirmación para eliminar un feedback.",
  },
  {
    selector: "#tour-fb-modal-del-body",
    popover: {
      title: "Qué se elimina",
      description:
        "Revisa el título o referencia mostrada en el cuadro de confirmación.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Verifica qué feedback vas a borrar.",
  },
  {
    selector: "#tour-fb-modal-del-actions",
    popover: {
      title: "Confirmar",
      description:
        "**Cancelar** cierra. **Eliminar** borra de forma permanente.",
      side: "top",
      align: "end",
    },
    voice:
      "Cancelar o Eliminar según tu decisión.",
  },
];

export const FEEDBACK_MODAL_DETALLE_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Guía: detalle de feedback",
      description:
        "Vista de solo lectura con tipo, estado, texto y listas de fortalezas y mejoras si existen.",
      side: "over",
      align: "center",
    },
    voice:
      "Guía del modal de detalle de feedback.",
  },
  {
    selector: "#tour-fb-modal-det-header",
    popover: {
      title: "Contexto",
      description:
        "Chips de tipo y estado y el título del caso.",
      side: "bottom",
      align: "start",
    },
    voice:
      "Arriba ves tipo, estado y título.",
  },
  {
    selector: "#tour-fb-modal-det-cuerpo",
    popover: {
      title: "Contenido",
      description:
        "Texto completo y bloques resaltados para fortalezas y áreas de mejora.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí está el detalle legible del feedback.",
  },
  {
    selector: "#tour-fb-modal-det-actions",
    popover: {
      title: "Cerrar",
      description:
        "Vuelves a la lista sin cambios.",
      side: "top",
      align: "end",
    },
    voice:
      "Cierra cuando termines de leer.",
  },
];
