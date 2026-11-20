# Autenticación y sesiones

- JWT HS256 con issuer/audience.
- Refresh rotado con jti, hash bcrypt, revocación en AuthSession.
- Revalidación contra DB en JwtStrategy (usuario eliminado, rol, institución).
- recover-by-code deshabilitado (GoneException).
- Pendiente: detección de reutilización de refresh token ya implementada en servicio.