# Fase 1 — índice limpio, historial todavía sucio

Fecha: 2026-10-06. Rama: `hardening/fase-0-baseline`. No se tocó `main`. No hubo force-push.

## Hecho

- Fuera del índice: `r.e.c-backend/.env`, `r.e.c-backend/.env.test`, `r.e.c-frontend/.env.local`.
- Fuera del índice: 9 archivos en `r.e.c-backend/uploads/study-materials/`.
- Esos archivos siguen en el disco local. No se borraron del working tree.
- `.gitignore` de raíz, backend y frontend niega `.env` reales y permite solo examples.
- `scripts/check-tracked-secrets.sh` corre en CI antes del lint, en `main` y en `hardening/**`.
- Purga documentada en `docs/implementation/PURGA_HISTORIAL_GIT.md`. No ejecutada.

## No hecho, a propósito

- No se rotó nada externo. No hay alojamiento activo.
- No se reescribió el historial. `git log -- r.e.c-backend/.env` sigue encontrando el blob.
- Credenciales del repo siguen comprometidas. Al redesplegar: generar de nuevo Postgres, JWT, refresh, Resend, `INTERNAL_API_KEY` y cualquier otra. No reutilizar.

## Verificación local

`bash scripts/check-tracked-secrets.sh` debe imprimir `secret/upload guard ok` en esta rama después del commit.
`git ls-files` no debe listar `.env`, `.env.local`, `.env.test` ni `uploads/study-materials`.
