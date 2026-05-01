/**
 * Defaults para variables JWT exigidas por ConfigModule en tests (e2e / integración)
 * cuando el entorno no las define o JWT_SECRET es demasiado corto para Joi (min 32).
 */
if (!process.env.JWT_ISSUER) {
  process.env.JWT_ISSUER = 'recedu-test-issuer';
}
if (!process.env.JWT_AUDIENCE) {
  process.env.JWT_AUDIENCE = 'recedu-test-api';
}
if (!process.env.JWT_EXPIRES) {
  process.env.JWT_EXPIRES = '15m';
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = 'test-only-jwt-secret-32-characters-minimum';
}
