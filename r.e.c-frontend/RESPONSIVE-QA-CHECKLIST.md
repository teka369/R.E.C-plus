# Responsive QA Checklist (Dashboard)

## Objetivo
Validar que el dashboard de Docente y Estudiante sea usable, legible y funcional en movil, tablet y desktop sin desbordes, solapamientos ni bloqueos de flujo.

## Viewports objetivo
- Mobile S: 360 x 800
- Mobile L: 414 x 896
- Tablet: 768 x 1024
- Laptop: 1366 x 768
- Desktop: 1920 x 1080

## Preparacion
1. Ejecutar frontend en local.
2. Abrir DevTools y usar Device Toolbar.
3. Probar en orientacion vertical y horizontal en 360 y 768.
4. Probar zoom del navegador en 100% y 125%.

## Criterios globales de aprobacion
- No hay scroll horizontal inesperado en layout principal.
- Sidebar y navegacion movil abren/cierra correctamente (overlay, Escape, click fuera).
- No hay texto cortado en botones principales ni encabezados de tarjetas.
- Tablas largas tienen scroll interno controlado (no rompen el layout completo).
- Modales mantienen foco visual y no salen del viewport.
- Formularios pueden completarse sin que controles queden fuera de pantalla.

## Matriz de modulos criticos

### Docente
- Panel: app/(dashboard)/docente/page.tsx
- Materiales: app/(dashboard)/docente/materiales/page.tsx
- Materiales crear: app/(dashboard)/docente/materiales/crear/page.tsx
- Materiales editar: app/(dashboard)/docente/materiales/editar/[id]/page.tsx
- Horarios: app/(dashboard)/docente/horarios/page.tsx
- Temarios: app/(dashboard)/docente/temarios/page.tsx
- Temario detalle: app/(dashboard)/docente/temarios/[id]/page.tsx
- Recuperaciones: app/(dashboard)/docente/recuperaciones/page.tsx
- Feedback: app/(dashboard)/docente/feedback/page.tsx
- Ligas: app/(dashboard)/docente/ligas/page.tsx
- Gestion academica: app/(dashboard)/docente/gestion-academica/page.tsx

### Estudiante
- Panel: app/(dashboard)/estudiante/page.tsx
- Materiales: app/(dashboard)/estudiante/materiales/page.tsx
- Horario: app/(dashboard)/estudiante/horario/page.tsx
- Temarios: app/(dashboard)/estudiante/temarios/page.tsx
- Temario detalle: app/(dashboard)/estudiante/temarios/[id]/page.tsx
- Recuperaciones: app/(dashboard)/estudiante/recuperaciones/page.tsx
- Feedback: app/(dashboard)/estudiante/feedback/page.tsx
- Ligas: app/(dashboard)/estudiante/ligas/page.tsx
- Gestion academica: app/(dashboard)/estudiante/gestion-academica/page.tsx

## Casos de prueba por patron UI

### 1) Navegacion y shell
- Abrir menu movil desde boton flotante.
- Cerrar por: boton cerrar, click en overlay y tecla Escape.
- Navegar entre 3 vistas seguidas y confirmar que no queda drawer abierto.
- Verificar que contenido principal no queda oculto por sidebar en desktop.

### 2) Filtros y barras de accion
- En 360px: confirmar que filtros envuelven en varias filas sin desbordar.
- Probar selects largos y placeholders largos.
- Confirmar boton "Limpiar filtros" visible y clickeable.

### 3) Grids de tarjetas
- Confirmar paso de columnas: 1 -> 2 -> 3/4 segun breakpoint.
- Revisar titulos largos (2-3 lineas) y metadatos numericos.
- Verificar que CTA no se solape con badges o chips.

### 4) Tablas y vistas calendario
- Confirmar scroll horizontal interno en calendario/tabla.
- Revisar encabezados sticky (si aplica) y alineacion de celdas.
- Verificar que columna de hora/labels no tape contenido.

### 5) Modales
- Abrir modal en 360px y confirmar:
  - alto maximo utilizable,
  - scroll interno disponible,
  - botones de accion visibles.
- Cerrar modal y confirmar retorno correcto al estado previo.

### 6) Chat/mensajeria (recuperaciones)
- En 360px, enviar mensaje largo y confirmar que la burbuja no se corta.
- Confirmar alineacion de burbuja propia vs externa.
- Verificar que caja de input + boton enviar no se salga del ancho.

### 7) Formularios largos
- Completar formularios de crear/editar materiales y temarios.
- Confirmar tabulacion natural y visibilidad de errores de validacion.
- Verificar que campos tipo datetime/file/select se adaptan sin overflow.

## Evidencia recomendada
- Captura por modulo en 360, 768 y 1366.
- Para cada bug: viewport, ruta, paso, resultado actual, esperado.
- Registrar severidad: Critico, Alto, Medio, Bajo.

## Plantilla de registro rapido
Usar una entrada por hallazgo:

- Modulo:
- Ruta:
- Viewport:
- Paso:
- Actual:
- Esperado:
- Severidad:
- Estado: Abierto | En correccion | Verificado

## Cierre QA
Aprobar solo si:
- No hay hallazgos Critico/Alto abiertos.
- Casos 1-7 ejecutados en al menos 360, 768 y 1366.
- Navegacion y modales verificados en Docente y Estudiante.
