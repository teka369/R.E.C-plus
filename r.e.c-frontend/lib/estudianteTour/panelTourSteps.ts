import type { TourStepDef } from "./types";

/** Tour completo del panel principal (/estudiante) */
export const PANEL_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Bienvenido a tu espacio de estudiante",
      description:
        "Esta guía recorre tu panel, cada bloque del tablero y todas las secciones del menú lateral. Avanza con «Siguiente», vuelve con «Anterior» o cierra cuando quieras. Si el navegador lo permite, también escucharás cada paso en voz baja.",
      side: "over",
      align: "center",
    },
    voice:
      "Bienvenido. Esta guía muestra tu panel de estudiante: resumen, métricas, progreso por materia y cada opción del menú. Usa Siguiente y Anterior, o cierra cuando quieras.",
  },
  {
    selector: "#estudiante-sidebar-nav",
    popover: {
      title: "Tu menú principal",
      description:
        "Desde aquí entras a materiales, temarios, ligas, horario, feedback, gestión académica y recuperaciones. «Panel» te devuelve siempre a esta vista resumen.",
      side: "right",
      align: "start",
    },
    voice:
      "Este es tu menú principal: materiales, temarios, ligas, horario, feedback, gestión académica y recuperaciones. Panel te trae de vuelta al resumen.",
  },
  {
    selector: "#tour-est-hero",
    popover: {
      title: "Cabecera del panel",
      description:
        "Saludo con tu nombre, contexto del panel y tu promedio general cuando el colegio ya cargó notas en gestión académica.",
      side: "bottom",
      align: "start",
    },
    voice:
      "En la cabecera ves tu nombre, un mensaje de contexto y tu promedio general si ya hay datos académicos.",
  },
  {
    selector: "#tour-est-metricas",
    popover: {
      title: "Cuatro indicadores rápidos",
      description:
        "Materias asignadas y temarios activos, eventos próximos y bloques de horario semanal, solicitudes de recuperación (total y pendientes) y cobertura de plan (materiales o temarios disponibles por materia).",
      side: "bottom",
      align: "center",
    },
    voice:
      "Estas tarjetas resumen materias y temarios activos, tu agenda y horario, recuperaciones y qué tan cubierto tienes el plan con recursos o temarios.",
  },
  {
    selector: "#tour-est-actividad-semanal",
    popover: {
      title: "Actividad en las últimas semanas",
      description:
        "Compara semana a semana actualizaciones en tu expediente académico, movimientos en recuperaciones y eventos del grupo. Puedes plegar el bloque tocando la cabecera.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí ves las últimas seis semanas: cambios académicos, recuperaciones y eventos. Puedes minimizar el bloque con el título.",
  },
  {
    selector: "#tour-est-progreso-materias",
    popover: {
      title: "Progreso por materia",
      description:
        "Cada materia muestra recursos y temarios disponibles, promedio si aplica, barra de progreso según gestión académica y enlaces directos a materiales y temarios filtrados por esa materia.",
      side: "top",
      align: "start",
    },
    voice:
      "Por cada materia ves recursos, temarios, nota o riesgo, barra de progreso y enlaces para abrir materiales o temarios de esa materia.",
  },
  {
    selector: "#tour-est-radar",
    popover: {
      title: "Radar académico",
      description:
        "Indicadores visuales: avance medio, cobertura del plan, pendientes en recuperaciones y materias con registro académico. Abajo tienes promedio, materias en riesgo, inasistencias y recuperaciones aprobadas o completadas.",
      side: "left",
      align: "start",
    },
    voice:
      "El radar condensa avance, plan, pendientes y registro por materias, más un resumen de promedio, riesgo, inasistencias y recuperaciones logradas.",
  },
  {
    selector: "#tour-est-agenda",
    popover: {
      title: "Próximos eventos",
      description:
        "Lista los eventos más cercanos de tu grupo. «Ver horario» abre la vista completa con grilla, lista, notas y eventos.",
      side: "top",
      align: "start",
    },
    voice:
      "La agenda muestra tus próximos eventos. Ver horario te lleva al calendario completo del grupo.",
  },
  {
    selector: "#tour-est-acciones",
    popover: {
      title: "Acciones recomendadas",
      description:
        "Atajos a materiales, temarios, gestión académica y recuperaciones: los mismos destinos que en el menú, más a mano desde el panel.",
      side: "left",
      align: "start",
    },
    voice:
      "Las acciones recomendadas son atajos al estudio y al seguimiento: materiales, temarios, notas y recuperaciones.",
  },
  {
    selector: "#nav-estudiante-panel",
    popover: {
      title: "Volver al panel",
      description:
        "Cuando navegues por otras pantallas, «Panel» te devuelve aquí al resumen.",
      side: "right",
      align: "start",
    },
    voice:
      "El ítem Panel del menú te trae siempre de vuelta a esta pantalla.",
  },
  {
    selector: "#nav-estudiante-materiales",
    popover: {
      title: "Materiales",
      description:
        "Recursos que tus docentes publican para tu grupo o grado: archivos, enlaces y videos. Filtra por materia, tipo y vista lista o cuadrícula.",
      side: "right",
      align: "start",
    },
    voice:
      "En Materiales consultas lo que publicaron tus profesores para estudiar, con filtros y vista lista o cuadrícula.",
  },
  {
    selector: "#nav-estudiante-temarios",
    popover: {
      title: "Temarios",
      description:
        "Planes por materia: objetivos, contenidos y fechas. Filtra y abre el detalle de cada temario para leerlo completo.",
      side: "right",
      align: "start",
    },
    voice:
      "Temarios reúne los planes de cada materia; puedes filtrarlos y abrir el detalle para leer el contenido completo.",
  },
  {
    selector: "#nav-estudiante-ligas",
    popover: {
      title: "Ligas",
      description:
        "Vista de rendimiento y ranking de tu grupo respecto a otros, con métricas calculadas a partir de gestión académica y módulos relacionados.",
      side: "right",
      align: "start",
    },
    voice:
      "Ligas muestra el desempeño comparativo de tu grupo y métricas agregadas.",
  },
  {
    selector: "#nav-estudiante-horario",
    popover: {
      title: "Horario",
      description:
        "Tu semana de clases en grilla o lista, con eventos y notas del grupo. Úsalo para ubicarte en tiempo y lugar.",
      side: "right",
      align: "start",
    },
    voice:
      "Horario es tu calendario de clases y eventos del grupo, en grilla o lista.",
  },
  {
    selector: "#nav-estudiante-feedback",
    popover: {
      title: "Feedback",
      description:
        "Observaciones y retroalimentación que dejan tus docentes: fortalezas, mejoras y seguimiento.",
      side: "right",
      align: "start",
    },
    voice:
      "Feedback concentra los comentarios y observaciones de tus profesores sobre tu desempeño.",
  },
  {
    selector: "#nav-estudiante-gestion",
    popover: {
      title: "Gestión académica",
      description:
        "Tus notas por corte o vista global, simulador según la escala del colegio, inasistencias y detalle por materia. Es de consulta para ti como estudiante.",
      side: "right",
      align: "start",
    },
    voice:
      "Gestión académica es donde ves tus notas, cortes, inasistencias y simulaciones según las reglas del colegio.",
  },
  {
    selector: "#nav-estudiante-recuperaciones",
    popover: {
      title: "Recuperaciones",
      description:
        "Solicita recuperaciones o refuerzos cuando el periodo esté activo, revisa actividades, mensajes con el docente y el estado de cada solicitud.",
      side: "right",
      align: "start",
    },
    voice:
      "En Recuperaciones pides apoyo cuando aplica, sigues actividades y chateas con tu docente según el estado de la solicitud.",
  },
  {
    selector: "#estudiante-sidebar-cuenta",
    popover: {
      title: "Cuenta y apariencia",
      description:
        "Tema claro u oscuro, acceso a tu perfil y cierre de sesión. En el menú no aparece «Cambiar contraseña»; esa pantalla está en la ruta dedicada del área estudiante (también enlazada desde tu perfil si el colegio la muestra).",
      side: "right",
      align: "end",
    },
    voice:
      "Abajo cambias el tema, abres tu perfil o cierras sesión. Para cambiar contraseña usa la página Cambiar contraseña del área estudiante.",
  },
  {
    selector: "#tour-est-guia-preferencias",
    popover: {
      title: "Barra «Guía estudiante»",
      description:
        "Esta tarjeta está al final del panel. Decide si ves la barra al pie en el resto de secciones: progreso, «Ver guía otra vez» y el tour automático la primera vez en cada módulo. Si la ocultas, reactiva aquí cuando quieras.",
      side: "top",
      align: "start",
    },
    voice:
      "Puedes mostrar u ocultar la barra de guía en las demás pantallas. Si la ocultas, vuelve aquí para activarla de nuevo.",
  },
  {
    popover: {
      title: "¡Listo para estudiar con Recedu!",
      description:
        "Ya conoces el panel y el menú. Con la barra visible verás el progreso y podrás repetir guías. Cada sección tiene su tour la primera vez que entras. Si prefieres no ver la barra, desactívala en la tarjeta anterior.",
      side: "over",
      align: "center",
    },
    voice:
      "Has terminado la guía del panel. Activa la barra de guía si quieres seguir el progreso y repetir tutoriales en cada sección.",
  },
];
