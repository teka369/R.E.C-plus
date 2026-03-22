import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SanitizeInputPipe } from '../../../../src/common/pipes/sanitize-input.pipe';

describe('SanitizeInputPipe', () => {
  const pipe = new SanitizeInputPipe();
  const bodyMeta: ArgumentMetadata = {
    type: 'body',
    metatype: Object,
    data: '',
  };

  it('debe recortar cadenas y limpiar caracteres de control', () => {
    const input = { nombre: '  Ana\u0000  ' };
    const output = pipe.transform(input, bodyMeta) as { nombre: string };
    expect(output.nombre).toBe('Ana');
  });

  it('debe lanzar error con claves peligrosas', () => {
    const input = { constructor: { polluted: true } };
    expect(() => pipe.transform(input, bodyMeta)).toThrow(BadRequestException);
  });

  it('debe preservar payload en params', () => {
    const output = pipe.transform('   10   ', {
      type: 'param',
      metatype: String,
      data: 'id',
    });
    expect(output).toBe('   10   ');
  });
});
