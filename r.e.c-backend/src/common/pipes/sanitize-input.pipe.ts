import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value && typeof value === 'object') {
      const output: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        if (DANGEROUS_KEYS.has(key)) {
          throw new BadRequestException('Payload contiene claves no permitidas');
        }
        output[key] = this.sanitize(nested);
      }
      return output;
    }

    if (typeof value === 'string') {
      // Sanitizacion defensiva para entradas comunes de inyeccion
      const trimmed = value.trim();
      const normalized = trimmed.replace(/[\u0000-\u001F\u007F]/g, '');
      return normalized;
    }

    return value;
  }
}
