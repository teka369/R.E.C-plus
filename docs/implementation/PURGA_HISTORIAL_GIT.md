# Purga de historial Git — preparada, no ejecutada

Estado: NO AUTORIZADA. No se hizo force-push. `main` no se reescribió.

## Por qué hace falta

Sacar archivos del índice no borra los blobs. Cualquiera que clone `teka369/R.E.C-plus` hoy, o que tenga un clone viejo, puede seguir leyendo:

- `r.e.c-backend/.env`
- `r.e.c-backend/.env.test`
- `r.e.c-frontend/.env.local`
- `r.e.c-backend/uploads/study-materials/**`

Esos valores se tratan como comprometidos. No hay alojamiento activo que rotar. Al volver a desplegar hay que generar credenciales nuevas. No reutilizar nada que haya estado en Git.

## Impacto si se autoriza

- Cambian todos los SHA desde el commit que introdujo los archivos.
- Los clones actuales quedan desalineados. Hay que re-clonar o resetear al remoto nuevo.
- PRs abiertos y la rama `hardening/fase-0-baseline` hay que rebasarlos encima del historial nuevo.
- Issues y releases no se borran. Los commits citados en la auditoría (`2795c65`, `c5a4445`, `6acea2f`) dejarán de existir con ese SHA.
- Un force-push a `main` público no recupera copias que ya se llevaron. La purga reduce clones futuros, no deshace la exposición.
- Es destructivo. No hay rollback git limpio si no se guarda un bundle antes.

## Backup obligatorio antes de ejecutar

```bash
git clone --mirror git@github.com:teka369/R.E.C-plus.git rec-plus-mirror-backup.git
# Guardar ese bundle fuera de la máquina de trabajo y fuera del repo.
```

## Procedimiento propuesto (no correr hasta el OK)

Herramienta: `git filter-repo` (preferida sobre BFG porque el repo es pequeño).

```bash
# En un clone fresco, no en el working copy de todos los días.
git clone --mirror git@github.com:teka369/R.E.C-plus.git rec-plus-purge.git
cd rec-plus-purge.git
git filter-repo --invert-paths \
  --path r.e.c-backend/.env \
  --path r.e.c-backend/.env.test \
  --path r.e.c-frontend/.env.local \
  --path-glob 'r.e.c-backend/uploads/**'
# Revisar que git log --all -- r.e.c-backend/.env no devuelva nada.
# Recién ahí, y solo con autorización explícita:
# git push --force --all origin
# git push --force --tags origin
```

No incluir `.env.example` ni `.env.*.example` en el invert-paths.

## Verificación después de una purga futura

```bash
git log --all -- r.e.c-backend/.env r.e.c-frontend/.env.local
git rev-list --all --objects | grep -E 'uploads/study-materials|\.env$' || echo 'sin blobs de env/uploads'
bash scripts/check-tracked-secrets.sh
```

## Qué no hace esta purga

- No rota Postgres, JWT, Resend ni `INTERNAL_API_KEY`. No hay servicio activo que tocar.
- No invalida un clone que alguien ya descargó.
- No sustituye generar secretos nuevos el día del próximo deploy.
