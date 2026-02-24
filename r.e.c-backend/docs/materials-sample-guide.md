# Guía rápida: crear materiales de prueba para estudiantes

Esta guía ayuda a verificar que un estudiante vea materiales y a generar materiales de prueba con visibilidad por grupo y por grado.

## 1) Verificar asignación del estudiante

- Asegúrate de que el estudiante tenga `groupId` y `gradeId` asignados.
- Puedes comprobarlo con el endpoint de grupo del estudiante (usado en el frontend por `academicApi.getStudentGroup`).
- Si no tiene asignación, primero asígnalo a un grupo válido del grado correspondiente.

## 2) Crear materiales con visibilidad de "GROUP"

Los materiales con `visibility: "GROUP"` son visibles solo para el `groupId` indicado.

Ejemplo de `POST /materials/study` (requiere autenticación de docente):

```
POST /materials/study
Authorization: Bearer <TOKEN_DOCENTE>
Content-Type: application/json

{
  "subjectId": 1,
  "groupId": 12,
  "title": "Guía de lectura",
  "description": "Semana 3",
  "type": "PDF",
  "resourceUrl": "https://example.com/lectura.pdf",
  "visibility": "GROUP"
}
```

Notas:
- Usa un `groupId` que coincida exactamente con el grupo del estudiante.
- El `subjectId` debe existir y estar activo.

## 3) Crear materiales con visibilidad de "GRADE"

Los materiales con `visibility: "GRADE"` son visibles para todos los grupos del mismo `gradeId` del grupo del material.

Para crear el material, usa el `groupId` de **cualquier** grupo que pertenezca al mismo grado del estudiante:

```
POST /materials/study
Authorization: Bearer <TOKEN_DOCENTE>
Content-Type: application/json

{
  "subjectId": 1,
  "groupId": 13, // grupo del mismo grado que el estudiante
  "title": "Proyecto trimestral",
  "type": "LINK",
  "resourceUrl": "https://example.com/proyecto",
  "visibility": "GRADE"
}
```

## 4) Comprobar materiales visibles para estudiante

El frontend llama a `GET /materials/study` y el backend filtra automáticamente por rol:
- Estudiantes ven materiales `GROUP` si el `groupId` coincide con el suyo.
- Estudiantes ven materiales `GRADE` si el `groupId` del material pertenece al mismo `gradeId` del estudiante.

Si el listado aparece vacío:
- Verifica que el estudiante tenga grupo y grado asignados.
- Comprueba que existan materiales con visibilidad `GROUP`/`GRADE` que coincidan.
- Asegúrate de autenticarte como estudiante al consultar la vista.

## 5) Consejos de prueba

- Crea al menos 2 materiales: uno `GROUP` (del grupo exacto del estudiante) y otro `GRADE` (cualquier grupo del mismo grado).
- Usa títulos descriptivos para identificar origen desde el frontend.
- Revisa la sección de depuración (en desarrollo) que muestra conteos y una muestra de materiales.

