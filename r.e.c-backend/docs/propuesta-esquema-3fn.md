# Propuesta de esquema 3FN

Este archivo acompana a la propuesta en prisma/schema.3fn.propuesta.prisma.

No reemplaza todavia el esquema activo.

Se creo como esquema maestro de referencia para migrar por fases sin romper el backend actual.

## Criterios aplicados

- Estandarizacion de nombres de dominio en espanol.
- Separacion entre datos operativos, historicos y analiticos.
- Eliminacion de dependencias transitivas y campos repetidos de contexto academico.
- Reemplazo de JSON operativos por tablas hijas normalizadas.
- Sustitucion de parciales fijos y gradesJson por evaluaciones y calificaciones relacionales.
- Introduccion de PeriodoAcademico como eje temporal del sistema.
- Anclaje de la docencia a una oferta grupo-asignatura-periodo.

## Cambios estructurales clave

1. StudentGroup pasa a MatriculaGrupo y ahora incorpora periodo academico, estado e historial.
2. GroupSubject pasa a OfertaGrupoAsignatura y deja de ser una simple tabla puente.
3. TeacherAssignment pasa a AsignacionDocente y referencia la oferta academica, no el par grupo-materia por separado.
4. StudentAcademicRecord se reemplaza logicamente por RegistroAcademico y por EvaluacionAcademica + CalificacionEvaluacion.
5. GradePerformance pasa a ResumenRendimientoGrupo por periodo, con destacados normalizados en una tabla hija.
6. GroupInfo deja de usar JSON y se divide en InformacionGrupo, DestacadoInformacionGrupo, MetricaInformacionGrupo y EnlaceInformacionGrupo.
7. RecoveryConfig y RecoverySchedule dejan de ser singletons globales y pasan a depender de PeriodoAcademico.
8. Syllabus y StudyMaterial se anclan a la oferta academica.
9. Feedback se remodela como ObservacionEstudiante con detalles normalizados.
10. Horario y eventos pueden vincularse a una oferta academica concreta cuando aplica.

## Tablas de transicion recomendadas

- Mantener User, Grade, Group, Subject durante la primera migracion, usando nombres logicos en espanol con @map y @@map.
- Introducir primero PeriodoAcademico, MatriculaGrupo y OfertaGrupoAsignatura.
- Migrar despues TeacherAssignment, StudyMaterial y Syllabus a la nueva oferta.
- Finalmente sustituir gradesJson y parciales fijos por evaluaciones y calificaciones.

## Notas de compatibilidad

- El schema propuesto prioriza el modelo objetivo, no la compatibilidad inmediata con el codigo actual.
- Varias tablas reutilizan @@map hacia nombres heredados para facilitar una migracion progresiva.
- Antes de activarlo como schema principal hay que crear migraciones puente y adaptar servicios NestJS y DTOs del frontend.

## Orden recomendado de implementacion

1. Crear PeriodoAcademico y poblar periodos historicos.
2. Extender StudentGroup hacia MatriculaGrupo con periodo y estado.
3. Extender GroupSubject hacia OfertaGrupoAsignatura con periodo.
4. Migrar TeacherAssignment para que dependa de la oferta.
5. Introducir EvaluacionAcademica y CalificacionEvaluacion.
6. Migrar StudentAcademicRecord a RegistroAcademico resumen y retirar gradesJson.
7. Normalizar GroupInfo, GradePerformance y Feedback.
8. Pasar RecoveryConfig y RecoverySchedule a configuraciones por periodo.

## Fase 1 implementada en el schema activo

Se dejo preparada una primera fase puente en el schema activo y en la migracion:

- Se crea AcademicPeriod.
- Se agregan academicPeriodId, status y endedAt a StudentGroup.
- Se agregan academicPeriodId, weeklyHours e isActive a GroupSubject.
- Se inserta un periodo legado para enlazar la informacion historica existente.

Esta fase no rompe el backend actual porque solo agrega estructura nueva y mantiene intactas las relaciones y claves usadas hoy por los servicios.

## Fase 2 implementada en el schema activo

Se dejo preparada una segunda fase puente:

- Se crea AcademicOffering como oferta academica formal.
- Se rellena AcademicOffering a partir de GroupSubject y su academicPeriodId.
- Se agrega academicOfferingId a TeacherAssignment.
- Se hace backfill de TeacherAssignment usando la oferta academica legado correspondiente.

Con esto ya existe una entidad formal para representar grupo + materia + periodo, pero TeacherAssignment sigue conservando groupId y subjectId para no romper consultas actuales.