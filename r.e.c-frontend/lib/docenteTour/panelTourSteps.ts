import type { TourStepDef } from "./types";

/** Tour completo del panel principal (/docente) */
export const PANEL_TOUR_STEPS: TourStepDef[] = [
  {
    popover: {
      title: "Bienvenido a Recedu",
      description:
        "Esta guía te muestra tu espacio como docente: el panel de control, cada bloque del tablero y todas las secciones del menú. Puedes avanzar con «Siguiente», volver con «Anterior» o cerrar cuando quieras. También te hablamos en voz baja si el navegador lo permite.",
      side: "over",
      align: "center",
    },
    voice:
      "Bienvenido a Recedu. Esta guía recorre tu panel de docente: el resumen, las métricas, los atajos y cada opción del menú lateral. Usa los botones Siguiente y Anterior, o cierra cuando quieras. Si tu navegador tiene voz en español, también escucharás cada paso.",
  },
  {
    selector: "#docente-sidebar-nav",
    popover: {
      title: "Tu menú principal",
      description:
        "Desde aquí entras a todo: materiales, horarios, temarios, feedback, gestión académica, recuperaciones y ligas. El ítem «Panel» siempre te trae de vuelta a esta vista resumen.",
      side: "right",
      align: "start",
    },
    voice:
      "Este es tu menú principal. Desde aquí llegas a materiales, horarios, temarios, feedback, gestión académica, recuperaciones y ligas. La opción Panel te devuelve siempre a este resumen.",
  },
  {
    selector: "#tour-docente-hero",
    popover: {
      title: "Cabecera del panel",
      description:
        "Aquí ves tu nombre y un mensaje de contexto. Es el punto de partida para revisar de un vistazo cómo van tus grupos, publicaciones y recuperaciones.",
      side: "bottom",
      align: "start",
    },
    voice:
      "En la cabecera aparece tu nombre y un resumen de lo que puedes vigilar aquí: cobertura académica, recuperaciones y ritmo de trabajo.",
  },
  {
    selector: "#resumen-periodo",
    popover: {
      title: "Cuatro indicadores clave",
      description:
        "Asignaciones: cuántas materias y grupos tienes. Materiales y temarios: lo que ya publicaste. Recuperaciones: solicitudes de tus estudiantes. Bloques semanales: carga en el horario respecto a eventos próximos.",
      side: "bottom",
      align: "center",
    },
    voice:
      "Estas cuatro tarjetas resumen tu actividad: cuántas asignaciones tienes, cuántos materiales y temarios has creado, cuántas recuperaciones hay en juego, y cómo se ve tu carga semanal en el horario.",
  },
  {
    selector: "#tour-docente-pulso",
    popover: {
      title: "Pulso de hoy",
      description:
        "Número de solicitudes de recuperación pendientes de respuesta. Es una señal rápida de qué requiere tu atención hoy.",
      side: "left",
      align: "start",
    },
    voice:
      "El pulso de hoy te dice cuántas solicitudes de recuperación siguen pendientes de tu respuesta, para que priorices lo urgente.",
  },
  {
    selector: "#btn-nueva-nota",
    popover: {
      title: "Registrar nota o seguimiento",
      description:
        "Te lleva directo a Gestión académica, donde registras notas, avances e inasistencias por estudiante y grupo.",
      side: "left",
      align: "center",
    },
    voice:
      "Con «Nueva nota» entras rápido a Gestión académica, donde registras notas, avances e inasistencias por estudiante.",
  },
  {
    selector: "#tour-actividad-semanal",
    popover: {
      title: "Ritmo en las últimas semanas",
      description:
        "Compara semana a semana cuánto publicaste (materiales o temarios) y cuánta actividad hubo en recuperaciones. Puedes plegar o desplegar el bloque con la cabecera.",
      side: "top",
      align: "start",
    },
    voice:
      "Este bloque muestra las últimas seis semanas: publicaciones frente a gestión de recuperaciones. Así ves si mantienes ritmo. Puedes minimizarlo tocando el título.",
  },
  {
    selector: "#tabla-grupos",
    popover: {
      title: "Cobertura por asignación",
      description:
        "Cada fila es una materia en un grupo concreto. Ves cuántos materiales subiste, cuántos temarios hay y si hay un temario activo. La barra resume la cobertura sugerida para esa asignación.",
      side: "top",
      align: "start",
    },
    voice:
      "Aquí ves cada asignación: grupo, materia, cantidad de materiales y temarios, y si el temario está activo. La barra indica qué tan completa está la preparación de esa asignación.",
  },
  {
    selector: "#tour-docente-indicadores",
    popover: {
      title: "Indicadores globales",
      description:
        "Cobertura promedio entre asignaciones, tasa de respuesta en recuperaciones, proporción pendiente y una lectura rápida de tu agenda respecto a los bloques programados.",
      side: "left",
      align: "start",
    },
    voice:
      "Los indicadores condensan el panorama: cobertura media, cómo respondes a recuperaciones, pendientes y una lectura rápida de tu agenda.",
  },
  {
    selector: "#tour-docente-agenda",
    popover: {
      title: "Próximos eventos",
      description:
        "Lista los eventos más cercanos de tus grupos. Desde «Ver horarios» abres el calendario completo para crear o revisar sesiones.",
      side: "top",
      align: "start",
    },
    voice:
      "La agenda próxima lista tus eventos más cercanos. Con Ver horarios pasas al calendario completo para organizar clases y sesiones.",
  },
  {
    selector: "#tour-docente-acciones",
    popover: {
      title: "Atajos del día a día",
      description:
        "Crear material, ir a temarios, gestionar recuperaciones o abrir gestión académica en un solo toque. Son los mismos destinos que tienes en el menú, pero más a mano.",
      side: "left",
      align: "start",
    },
    voice:
      "Las acciones rápidas son atajos: crear material, ajustar temarios, recuperaciones o gestión académica, sin buscar en el menú.",
  },
  {
    selector: "#nav-docente-panel",
    popover: {
      title: "Volver al panel",
      description:
        "Cuando navegues por otras pantallas, «Panel» te devuelve aquí al resumen con métricas y atajos.",
      side: "right",
      align: "start",
    },
    voice:
      "El ítem Panel del menú te trae siempre de vuelta a esta pantalla de resumen.",
  },
  {
    selector: "#nav-docente-materiales",
    popover: {
      title: "Materiales",
      description:
        "Publica y organiza recursos por grupo y materia: archivos, enlaces y contenidos que ven tus estudiantes. Desde allí también puedes crear material nuevo.",
      side: "right",
      align: "start",
    },
    voice:
      "En Materiales publicas y organizas recursos por grupo y materia: lo que tus estudiantes consultan. Desde ahí también creas contenido nuevo.",
  },
  {
    selector: "#nav-docente-horarios",
    popover: {
      title: "Horarios",
      description:
        "Consulta y administra la agenda de tus grupos: bloques, eventos y sesiones para planificar el calendario de clase.",
      side: "right",
      align: "start",
    },
    voice:
      "Horarios es tu agenda por grupos: bloques y eventos para planificar las sesiones.",
  },
  {
    selector: "#nav-docente-temarios",
    popover: {
      title: "Temarios",
      description:
        "Planifica contenidos por periodo, activa el temario que deben seguir tus estudiantes y alinea lo que enseñas con lo que publicas.",
      side: "right",
      align: "start",
    },
    voice:
      "Temarios sirve para planificar y activar el contenido por periodo, alineado con lo que enseñas y publicas.",
  },
  {
    selector: "#nav-docente-feedback",
    popover: {
      title: "Feedback",
      description:
        "Espacio de retroalimentación y seguimiento del avance de tus estudiantes según lo que el colegio configure en la plataforma.",
      side: "right",
      align: "start",
    },
    voice:
      "Feedback concentra la retroalimentación y el seguimiento del avance de tus estudiantes.",
  },
  {
    selector: "#nav-docente-gestion",
    popover: {
      title: "Gestión académica",
      description:
        "El corazón del seguimiento por alumno: notas, registros e inasistencias asociados a tus grupos y materias.",
      side: "right",
      align: "start",
    },
    voice:
      "Gestión académica es donde registras notas, avances e inasistencias por cada estudiante.",
  },
  {
    selector: "#nav-docente-recuperaciones",
    popover: {
      title: "Recuperaciones",
      description:
        "Revisa solicitudes de tus estudiantes, responde y marca actividades según las reglas del colegio. Si hay pendientes, a veces verás un aviso en el menú.",
      side: "right",
      align: "start",
    },
    voice:
      "En Recuperaciones atiendes las solicitudes de los estudiantes y das seguimiento a las actividades. El menú puede mostrarte si hay pendientes.",
  },
  {
    selector: "#nav-docente-ligas",
    popover: {
      title: "Ligas",
      description:
        "Accede a métricas y enlaces útiles por grupo para acompañar el desempeño y la comunicación con tus clases.",
      side: "right",
      align: "start",
    },
    voice:
      "Ligas reúne métricas y enlaces útiles por grupo para acompañar a tus clases.",
  },
  {
    selector: "#docente-sidebar-cuenta",
    popover: {
      title: "Cuenta y apariencia",
      description:
        "Cambia entre claro y oscuro, abre tu perfil para revisar datos y cierra sesión cuando termines. El enlace de perfil también lleva a cambiar contraseña cuando lo necesites.",
      side: "right",
      align: "end",
    },
    voice:
      "Abajo tienes el tema claro u oscuro, tu perfil y cerrar sesión. Desde el perfil también puedes actualizar tu contraseña cuando haga falta.",
  },
  {
    selector: "#tour-docente-guia-preferencias",
    popover: {
      title: "Mostrar u ocultar la barra de guía",
      description:
        "Esta tarjeta está al final del panel. Desde aquí decides si ves la barra «Guía docente» al pie en el resto de secciones. Si la ocultas, ganas espacio; vuelve aquí para activarla y usar «Ver guía otra vez» o las guías automáticas la primera vez.",
      side: "top",
      align: "start",
    },
    voice:
      "Al final del panel puedes mostrar u ocultar la barra de guía en las demás pantallas. Si la ocultas, reactívala aquí cuando quieras volver a ver los tutoriales.",
  },
  {
    popover: {
      title: "¡Listo para enseñar con Recedu!",
      description:
        "Ya conoces el panel y el menú. Con la barra visible, al pie de la pantalla verás el progreso y accesos a cada sección; cada módulo tiene su guía la primera vez. Si prefieres no verla, desactívala en la tarjeta al final de esta página.",
      side: "over",
      align: "center",
    },
    voice:
      "Has terminado la guía del panel. Activa la barra de guía si quieres seguir el progreso y repetir tutoriales en cada sección. Mucho éxito con tus grupos en Recedu.",
  },
];
