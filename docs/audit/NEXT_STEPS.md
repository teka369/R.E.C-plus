# Próximos pasos

Documento vigente. Los pasos de Render, Vercel y Neon que figuraban aquí ya no aplican.

## Fuera del repositorio

1. Rotar las credenciales que estuvieron en el historial. La lista está en [controles](../security/controles.md).
2. Autorizar la purga del historial si se quiere borrar esos blobs. Hace falta force push.
3. En el servidor: base vacía, secretos nuevos, volumen de `uploads/` y, si hay correo, Resend.

## Dentro del repositorio, si se continúa

- Revisar IDOR método por método más allá de las suites de integración ya verdes.
- Prisma 7, firebase-admin 14 y el downgrade de exceljs solo con un plan de compatibilidad. Ver [dependencias](../quality/dependencias.md).
