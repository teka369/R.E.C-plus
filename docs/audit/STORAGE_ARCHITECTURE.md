# Archivos

Los materiales y los adjuntos de recuperación se guardan en el disco del proceso, bajo `uploads/`.

`MaterialsService` escribe y lee esa carpeta y rechaza rutas que salen de ella. No hay un segundo adaptador S3 conectado: se retiró porque no participaba en el flujo y `@aws-sdk/client-s3` no estaba instalado.

La carpeta no es persistente por sí misma. El administrador debe montar un volumen, limitar los permisos y copiarla junto con la base.
