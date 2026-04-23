import type { ManualChapter, ManualFaq } from "./manualTypes";

export const DOCENTE_MANUAL: ManualChapter[] = [
  {
    id: "doc-acceso",
    title: "Acceso, panel y primeros pasos",
    subtitle: "Orientación general del área docente",
    route: "/docente",
    blocks: [
      {
        type: "p",
        text: "Tras iniciar sesión con tu correo institucional, el panel docente concentra un resumen de tus grupos, publicaciones, recuperaciones y agenda. Es el punto de partida antes de entrar a cada módulo del menú lateral.",
      },
      {
        type: "list",
        items: [
          "Usa **Panel** en el menú para volver siempre al tablero principal.",
          "La barra **Guía docente** (si la activaste en el panel) muestra el progreso por sección y permite repetir el tour interactivo en cada pantalla.",
          "Desde el pie del panel tienes atajos a materiales, temarios, gestión académica y recuperaciones.",
        ],
      },
      {
        type: "tip",
        title: "Buena práctica",
        text: "Dedica unos minutos a completar el tour la primera vez que entres a cada sección: ancla conceptos y localiza botones clave sin adivinar.",
      },
    ],
  },
  {
    id: "doc-materiales",
    title: "Materiales de estudio",
    subtitle: "Publicar y organizar recursos para tus grupos",
    route: "/docente/materiales",
    blocks: [
      {
        type: "p",
        text: "En **Materiales** subes o enlazas recursos (PDF, video, enlaces, documentos) y los asocias a grupo y materia. Tus estudiantes los ven según la visibilidad que definas (grupo o grado).",
      },
      {
        type: "list",
        items: [
          "**Crear material** abre el formulario guiado: título, tipo, archivo o URL, miniatura opcional y asignación.",
          "**Editar** conserva la misma estructura con los datos cargados; útil para corregir enlaces o actualizar la vista previa.",
          "Filtra por grupo, materia, tipo y texto para localizar rápido un recurso entre muchos.",
          "Lista y cuadrícula te permiten revisar muchas tarjetas o enfocarte en detalle.",
        ],
      },
      {
        type: "note",
        text: "Si subes una imagen de portada muy pesada, el sistema puede avisarte antes de confirmarla: conviene optimizar imágenes para que carguen bien en móvil.",
      },
    ],
  },
  {
    id: "doc-horarios",
    title: "Horarios y agenda",
    subtitle: "Planificación semanal del grupo",
    route: "/docente/horarios",
    blocks: [
      {
        type: "p",
        text: "**Horarios** organiza la semana por días y franjas: entradas recurrentes de clase, eventos puntuales y notas. Si tu rol incluye dirección de grupo, también podrás crear o editar bloques.",
      },
      {
        type: "list",
        items: [
          "Selecciona el **grupo** activo para cargar su calendario.",
          "Las tarjetas resumen clases, horas semanales, eventos y notas del grupo.",
          "Alterna entre vista de **grilla** y **lista** según cómo prefieras revisar la semana.",
        ],
      },
      {
        type: "tip",
        title: "Coherencia con el aula",
        text: "Mantén el horario al día: el panel y los estudiantes consultan estos datos para ubicarse en tiempo y lugar.",
      },
    ],
  },
  {
    id: "doc-temarios",
    title: "Temarios",
    subtitle: "Planificación por periodo y materia",
    route: "/docente/temarios",
    blocks: [
      {
        type: "p",
        text: "Los **temarios** estructuran objetivos, contenidos, actividades y evaluación por grupo y materia. Puedes trabajar en borrador, activar el que deben seguir los estudiantes o archivar versiones anteriores.",
      },
      {
        type: "list",
        items: [
          "Usa filtros por grupo, materia, periodo y estado para no perder el hilo entre varios planes.",
          "El **detalle** del temario muestra lectura clara; la edición se hace desde el flujo de creación o edición en el listado.",
          "Contenido con encabezados «## Objetivos», «## Contenidos», etc., se muestra por bloques tanto para ti como para el estudiante.",
        ],
      },
    ],
  },
  {
    id: "doc-feedback",
    title: "Feedback a estudiantes",
    subtitle: "Retroalimentación y seguimiento",
    route: "/docente/feedback",
    blocks: [
      {
        type: "p",
        text: "El módulo de **feedback** concentra mensajes tipificados (positivo, informativo, seguimiento, etc.) y el estado de cada observación. Ayuda a dejar constancia del acompañamiento sin depender solo del aula.",
      },
      {
        type: "list",
        items: [
          "Asocia el mensaje al estudiante y contexto que defina tu institución.",
          "Revisa filtros por tipo y estado para dar seguimiento a pendientes.",
        ],
      },
    ],
  },
  {
    id: "doc-gestion",
    title: "Gestión académica",
    subtitle: "Notas, cortes e inasistencias",
    route: "/docente/gestion-academica",
    blocks: [
      {
        type: "p",
        text: "Aquí registras el **seguimiento académico** por estudiante y materia: evaluaciones por corte, promedios cuando aplica la escala del colegio e **inasistencias**. Es el núcleo operativo junto a lo que ven estudiantes y secretaría en sus vistas.",
      },
      {
        type: "list",
        items: [
          "Selecciona **grupo** y **materia** antes de abrir la tabla de estudiantes.",
          "Respeta los **cortes** o periodos que secretaría haya configurado.",
          "Guarda cambios de forma incremental para no perder trabajo en sesiones largas.",
        ],
      },
      {
        type: "note",
        text: "Si algo no cuadra con el periodo activo o las materias asignadas, coordina con secretaría: ellos ajustan estructura y asignaciones.",
      },
    ],
  },
  {
    id: "doc-recuperaciones",
    title: "Recuperaciones",
    subtitle: "Solicitudes y actividades de refuerzo",
    route: "/docente/recuperaciones",
    blocks: [
      {
        type: "p",
        text: "Atiendes las **solicitudes** que envían los estudiantes cuando el periodo de recuperación está abierto: aceptar o rechazar, dejar comentarios, publicar **actividades** con fecha límite y registrar resultados.",
      },
      {
        type: "list",
        items: [
          "El **periodo** lo controla secretaría: si está cerrado, solo podrás consultar histórico.",
          "Usa la pestaña de **mensajes** para aclarar dudas sin salir del expediente de la solicitud.",
          "Prioriza solicitudes pendientes: el panel suele resaltar el volumen de respuestas pendientes.",
        ],
      },
    ],
  },
  {
    id: "doc-ligas",
    title: "Ligas y métricas de grupo",
    subtitle: "Lectura comparativa del desempeño",
    route: "/docente/ligas",
    blocks: [
      {
        type: "p",
        text: "**Ligas** agrega indicadores calculados a partir de gestión académica y módulos relacionados: posición relativa, puntajes y desgloses cuando el sistema los expone. Sirve para conversar con directivos o con el grupo sobre metas.",
      },
      {
        type: "tip",
        title: "Uso pedagógico",
        text: "Presenta las métricas como retroalimentación grupal, no como ranking punitivo: el objetivo es mejorar hábitos y resultados.",
      },
    ],
  },
  {
    id: "doc-cuenta",
    title: "Perfil, contraseña y tema",
    subtitle: "Cuenta y apariencia",
    route: "/docente/perfil",
    blocks: [
      {
        type: "p",
        text: "Desde el pie del **menú lateral** cambias entre tema claro y oscuro, abres tu **perfil** y cierras sesión. La contraseña se actualiza en la pantalla dedicada **Cambiar contraseña**, enlazada desde el perfil.",
      },
      {
        type: "list",
        items: [
          "Si tus datos no coinciden con la nómina, pide corrección a secretaría.",
          "Tras cambiar la clave, evita reutilizar contraseñas de otros servicios.",
        ],
      },
    ],
  },
];

export const SECRETARIA_MANUAL: ManualChapter[] = [
  {
    id: "sec-panel",
    title: "Panel y navegación",
    subtitle: "Panorama del área administrativa",
    route: "/secretaria",
    blocks: [
      {
        type: "p",
        text: "El panel de **secretaría** orienta la operación diaria: accesos a estudiantes, docentes, estructura académica, usuarios y procesos masivos. Cada ítem del menú lateral corresponde a un flujo de negocio claro.",
      },
      {
        type: "list",
        items: [
          "Mantén **coherencia** entre grados, grupos y asignaciones antes de dar de alta usuarios en masa.",
          "Si usas varios módulos en una sesión, trabaja en este orden sugerido: estructura académica → asignaciones → usuarios → operación curso (recuperaciones, promociones).",
        ],
      },
    ],
  },
  {
    id: "sec-estudiantes",
    title: "Estudiantes",
    subtitle: "Altas, bajas y datos de matrícula",
    route: "/secretaria/estudiantes",
    blocks: [
      {
        type: "p",
        text: "Gestiona el **padrón de estudiantes**: creación de cuentas, asignación a **grado y grupo**, actualización de datos y estados. Sin grupo correcto, el estudiante no verá materiales ni horarios alineados a su curso.",
      },
      {
        type: "list",
        items: [
          "Verifica duplicados por documento o correo antes de crear una cuenta nueva.",
          "Tras mover de grupo, avisa al estudiante para que refresque el panel.",
        ],
      },
    ],
  },
  {
    id: "sec-docentes",
    title: "Docentes",
    subtitle: "Registro y vínculo con la planta",
    route: "/secretaria/docentes",
    blocks: [
      {
        type: "p",
        text: "Administra la **planta docente**: altas, datos de contacto y relación con las **asignaciones** que luego verán en su panel. Un docente sin materias/grupos asignados tendrá el panel vacío o incompleto.",
      },
      {
        type: "tip",
        title: "Flujo recomendado",
        text: "Crea o actualiza docentes aquí y completa las asignaciones en **Académico** o en las pantallas que tu colegio use para materia–grupo.",
      },
    ],
  },
  {
    id: "sec-academico",
    title: "Académico",
    subtitle: "Grados, grupos, materias y asignaciones",
    route: "/secretaria/academico",
    blocks: [
      {
        type: "p",
        text: "**Académico** es el esqueleto del año: **grados**, **grupos**, **materias** y cómo se **asignan** a docentes y estudiantes. Un error aquí se propaga a horarios, materiales, temarios y notas.",
      },
      {
        type: "list",
        items: [
          "Define primero la jerarquía grado → grupo → materias del plan.",
          "Revisa que cada grupo tenga al menos las materias que el colegio espera enseñar.",
          "Tras cambios estructurales, valida una cuenta de docente y una de estudiante de prueba.",
        ],
      },
      {
        type: "note",
        text: "Los periodos y reglas de cortes suelen ligarse a esta capa: si no ves opciones esperadas, confirma que el ciclo activo esté configurado.",
      },
    ],
  },
  {
    id: "sec-usuarios",
    title: "Usuarios y roles",
    subtitle: "Vista transversal por cuenta",
    route: "/secretaria/usuarios",
    blocks: [
      {
        type: "p",
        text: "La sección **Usuarios** permite revisar cuentas por **rol**, resetear accesos cuando la política del colegio lo permita y mantener trazabilidad de quién puede entrar al sistema.",
      },
      {
        type: "list",
        items: [
          "Prioriza **desactivar** antes de borrar si necesitas conservar histórico.",
          "Documenta internamente cada restablecimiento de contraseña por seguridad.",
        ],
      },
    ],
  },
  {
    id: "sec-registro-masivo",
    title: "Registro masivo",
    subtitle: "Importación por archivo",
    route: "/secretaria/registro-masivo",
    blocks: [
      {
        type: "p",
        text: "**Registro masivo** acelera la carga de muchos estudiantes o docentes mediante plantillas. Es imprescindible seguir el formato indicado y validar una muestra pequeña antes de procesar todo el archivo.",
      },
      {
        type: "tip",
        title: "Calidad de datos",
        text: "Normaliza acentos, correos únicos y códigos de grupo exactamente como figuran en Académico para evitar rechazos en lote.",
      },
    ],
  },
  {
    id: "sec-recuperaciones",
    title: "Recuperaciones institucionales",
    subtitle: "Periodo, horario y reglas",
    route: "/secretaria/recuperaciones",
    blocks: [
      {
        type: "p",
        text: "Secretaría define **cuándo** los estudiantes pueden solicitar recuperaciones y bajo qué **ventanas de tiempo**. Docentes y estudiantes ven el estado en tiempo real según esa configuración.",
      },
      {
        type: "list",
        items: [
          "Antes de abrir el periodo, comunica fechas a la planta docente.",
          "Revisa subpáginas de **configuración** u **horario oficial** si tu despliegue las incluye para ajustar detalle.",
        ],
      },
    ],
  },
  {
    id: "sec-promociones",
    title: "Promociones",
    subtitle: "Avance de grado y simulaciones",
    route: "/secretaria/promociones",
    blocks: [
      {
        type: "p",
        text: "**Promociones** apoya el cierre o simulación de **cambio de grado** según las reglas del colegio. Úsalo con datos cerrados y respaldo previo.",
      },
      {
        type: "note",
        text: "Ejecuta primero una simulación o revisión en entorno de pruebas si tu institución la tiene; los movimientos masivos impactan a muchos estudiantes a la vez.",
      },
    ],
  },
  {
    id: "sec-secretaria-interna",
    title: "Módulo Secretaría",
    subtitle: "Operaciones internas del área",
    route: "/secretaria/secretaria",
    blocks: [
      {
        type: "p",
        text: "La pantalla **Secretaría** concentra flujos propios del equipo administrativo según la configuración de tu institución (trámites, registros internos o vistas resumidas). Consulta con tu coordinador qué campos son obligatorios en tu caso.",
      },
    ],
  },
  {
    id: "sec-notificaciones",
    title: "Notificaciones",
    subtitle: "Alertas y mensajes",
    route: "/secretaria/notificaciones",
    blocks: [
      {
        type: "p",
        text: "Centraliza **avisos** relevantes para secretaría: vencimientos, solicitudes o eventos del sistema. Revisa periódicamente para no bloquear procesos que dependan de una acción tuya.",
      },
    ],
  },
];

export const ESTUDIANTE_MANUAL: ManualChapter[] = [
  {
    id: "est-acceso",
    title: "Acceso, panel y guía interactiva",
    subtitle: "Tu espacio de estudiante en Recedu",
    route: "/estudiante",
    blocks: [
      {
        type: "p",
        text: "Al iniciar sesión llegas al **panel estudiante**: saludo, promedio cuando hay datos, métricas de materias y recuperaciones, actividad reciente, progreso por materia, radar académico, agenda y accesos rápidos.",
      },
      {
        type: "list",
        items: [
          "**Panel** en el menú lateral te devuelve siempre al resumen.",
          "La barra **Guía estudiante** (activable al final del panel) muestra el progreso por sección y dispara el tour la primera vez que entras a cada módulo.",
          "Desde el pie del panel puedes silenciar la voz del tour o repetir la guía de la pantalla actual.",
        ],
      },
      {
        type: "tip",
        title: "Combinar formatos",
        text: "Usa este manual de lectura para entender el «por qué» de cada área y el tour dentro de la app para ubicar botones y campos sin perder tiempo.",
      },
    ],
  },
  {
    id: "est-materiales",
    title: "Materiales de estudio",
    subtitle: "Recursos que publican tus docentes",
    route: "/estudiante/materiales",
    blocks: [
      {
        type: "p",
        text: "Aquí ves **PDF, videos, enlaces y documentos** asociados a tu grupo o grado. El listado respeta lo que cada profesor configure como visible para ti.",
      },
      {
        type: "list",
        items: [
          "Filtra por **materia**, tipo, visibilidad y texto de búsqueda.",
          "Alterna vista **lista** o **cuadrícula** según prefieras leer títulos o ver miniaturas.",
          "Usa la **paginación** si hay muchos archivos.",
        ],
      },
      {
        type: "note",
        text: "Si no ves materiales, puede faltar asignación de grupo en secretaría o aún no hay publicaciones para tu curso.",
      },
    ],
  },
  {
    id: "est-temarios",
    title: "Temarios",
    subtitle: "Planes de clase por materia",
    route: "/estudiante/temarios",
    blocks: [
      {
        type: "p",
        text: "Consulta los **temarios** de tus materias: periodo, estado, extracto del contenido y enlace al **detalle completo** cuando necesites leer objetivos y evaluación.",
      },
      {
        type: "list",
        items: [
          "Filtra por materia, estado, periodo, contenido y orden.",
          "**Ver temario** o **Ver detalle** abre la lectura completa (solo consulta; el docente edita el plan).",
        ],
      },
    ],
  },
  {
    id: "est-ligas",
    title: "Ligas",
    subtitle: "Rendimiento y comparativo de tu grupo",
    route: "/estudiante/ligas",
    blocks: [
      {
        type: "p",
        text: "**Ligas** muestra cómo va tu grupo frente a otros en indicadores agregados (posición, puntaje, métricas de desempeño y asistencia) cuando el colegio tiene datos cargados.",
      },
      {
        type: "tip",
        title: "Enfoque",
        text: "Úsalo como retroalimentación grupal y motivación; las decisiones académicas individuales siguen en gestión académica y con tus docentes.",
      },
    ],
  },
  {
    id: "est-horario",
    title: "Horario",
    subtitle: "Tu semana de clases y eventos",
    route: "/estudiante/horario",
    blocks: [
      {
        type: "p",
        text: "Visualiza el **horario del grupo** en **grilla** por días y horas o en **lista**. Verás también **eventos** próximos y **notas** que el colegio publique para el grupo.",
      },
      {
        type: "list",
        items: [
          "Las tarjetas superiores resumen clases, horas a la semana, eventos y notas.",
          "Si no tienes grupo asignado, contacta a **secretaría**.",
        ],
      },
    ],
  },
  {
    id: "est-feedback",
    title: "Feedback",
    subtitle: "Observaciones de tus docentes",
    route: "/estudiante/feedback",
    blocks: [
      {
        type: "p",
        text: "Lee los **mensajes** que dejan tus profesores: tipo (positiva, informativa, seguimiento…), estado y detalle ampliado en el modal **Ver detalle**.",
      },
      {
        type: "list",
        items: [
          "Filtra por tipo y estado cuando la lista crece.",
          "Los chips de resumen por tipo aparecen cuando ya tienes observaciones registradas.",
        ],
      },
    ],
  },
  {
    id: "est-gestion",
    title: "Gestión académica",
    subtitle: "Tus notas y seguimiento por materia",
    route: "/estudiante/gestion-academica",
    blocks: [
      {
        type: "p",
        text: "Aquí consultas **notas por corte** o la vista global, **promedios**, **inasistencias** y el detalle por materia. Es de **solo lectura** para ti: el registro lo hacen los docentes.",
      },
      {
        type: "list",
        items: [
          "Cambia el **corte** para ver el promedio y la cobertura de ese periodo.",
          "Si aparece alerta académica, habla con tu **director de grupo** o tutor.",
        ],
      },
    ],
  },
  {
    id: "est-recuperaciones",
    title: "Recuperaciones",
    subtitle: "Solicitudes, actividades y mensajes",
    route: "/estudiante/recuperaciones",
    blocks: [
      {
        type: "p",
        text: "Cuando el **periodo de recuperación** está **activo**, puedes crear **solicitudes** (recuperación o refuerzo), ver su estado, cumplir **actividades** con fecha límite y escribir a tu docente en **Mensajes**.",
      },
      {
        type: "list",
        items: [
          "Si el periodo está **cerrado**, normalmente solo podrás **consultar** histórico.",
          "Revisa avisos de **plazo** (24 h, 3 días) para no perder la ventana.",
        ],
      },
    ],
  },
  {
    id: "est-perfil",
    title: "Perfil",
    subtitle: "Datos y acceso a tu cuenta",
    route: "/estudiante/perfil",
    blocks: [
      {
        type: "p",
        text: "La pantalla de **perfil** usa el diseño público con barra de navegación. Desde ahí revisas tu identidad y suele haber enlace para **cambiar contraseña** según configure tu colegio.",
      },
      {
        type: "note",
        text: "El menú lateral del dashboard lleva a «Ver perfil»; si algo no coincide con tus datos reales, pide corrección en secretaría.",
      },
    ],
  },
  {
    id: "est-password",
    title: "Cambiar contraseña",
    subtitle: "Seguridad de tu cuenta",
    route: "/estudiante/cambiar-contrasena",
    blocks: [
      {
        type: "p",
        text: "Formulario dentro del área estudiante: **contraseña actual**, **nueva** y **confirmación**. Debes cumplir la longitud mínima (por ejemplo 6 caracteres) y las dos últimas deben coincidir.",
      },
      {
        type: "tip",
        title: "Seguridad",
        text: "No reutilices la misma clave de otros sitios. Si cambias la contraseña por una sospecha de acceso, avisa a secretaría.",
      },
    ],
  },
];

export const MANUAL_FAQS: ManualFaq[] = [
  {
    id: "faq-pass",
    question: "¿Cómo recupero mi contraseña?",
    answer:
      "Los usuarios deben solicitarlo a secretaría. Quienes tengan permiso pueden usar flujos de restablecimiento desde el área administrativa o la pantalla de acceso, según lo que haya habilitado tu institución.",
  },
  {
    id: "faq-mobile",
    question: "¿Puedo usar Recedu desde el celular?",
    answer:
      "Sí. La interfaz es responsiva: puedes revisar panel, listados y formularios desde navegador en teléfono o tableta; para tareas largas (carga masiva o gestión fina de notas) conviene escritorio.",
  },
  {
    id: "faq-files",
    question: "¿Qué archivos admite el módulo de materiales?",
    answer:
      "Lo habitual incluye PDF, imágenes (PNG, JPG) y documentos de Office (DOCX, XLSX, PPTX), además de enlaces a video u otros recursos. El límite de tamaño depende de la configuración del servidor.",
  },
  {
    id: "faq-privacy",
    question: "¿La información es privada?",
    answer:
      "El contenido está pensado para la comunidad educativa de tu institución. El acceso está restringido por autenticación y roles; no es un sitio público.",
  },
  {
    id: "faq-support",
    question: "¿Dónde reporto un error o pido ayuda?",
    answer:
      "Usa la página de **Contacto** o el canal que tu colegio defina. Si eres administrador técnico, conserva capturas y la hora aproximada del incidente.",
  },
];
