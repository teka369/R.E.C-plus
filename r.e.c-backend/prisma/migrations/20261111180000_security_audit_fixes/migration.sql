-- Contraseña temporal distinta del código de usuario.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- La migración histórica insertó esta contraseña en claro. Ya no autentica con bcrypt,
-- pero se neutraliza por si algún entorno la rehasheó o la compara de otra forma.
UPDATE "User"
SET password = 'DISABLED_PLAINTEXT_SEED',
    "mustChangePassword" = true
WHERE password = 'admin12345';

-- Tokens de reset anteriores estaban en claro. Se invalidan al pasar a hash SHA-256.
UPDATE "PasswordResetToken"
SET "usedAt" = NOW()
WHERE "usedAt" IS NULL;
