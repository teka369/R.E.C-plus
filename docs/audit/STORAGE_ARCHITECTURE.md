# Arquitectura de almacenamiento

- Abstracción `StorageAdapter` (put/get/delete/getSignedUrl).
- LocalStorageAdapter (dev) + S3StorageAdapter (opcional, @aws-sdk/client-s3).
- StorageService selecciona por STORAGE_PROVIDER env.
- Migración de MaterialsService a la abstracción: pendiente.