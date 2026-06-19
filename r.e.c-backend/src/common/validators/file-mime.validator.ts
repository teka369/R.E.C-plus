import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

const MIME_CACHE_SIZE = 8192;

export async function validateMimeFromBuffer(
  buffer: Buffer,
  allowedMimes: Set<string>,
  fieldName = 'Archivo',
): Promise<string> {
  const sample = buffer.length > MIME_CACHE_SIZE
    ? buffer.subarray(0, MIME_CACHE_SIZE)
    : buffer;

  const detected = await fileTypeFromBuffer(sample);

  const detectedMime = detected?.mime;
  if (!detectedMime) {
    throw new BadRequestException(
      `${fieldName}: no se pudo detectar el tipo de archivo`,
    );
  }

  if (!allowedMimes.has(detectedMime)) {
    throw new BadRequestException(
      `${fieldName}: tipo de archivo no permitido (${detectedMime}). Tipos aceptados: ${[...allowedMimes].join(', ')}`,
    );
  }

  return detectedMime;
}
