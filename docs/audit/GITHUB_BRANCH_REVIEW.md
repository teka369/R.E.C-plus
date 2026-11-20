# GitHub Branch & PR Review — Recedu

Fecha de auditoría: 2026-11-20 (UTC-5). Rama de trabajo local: `work/audit-recovery` (tracking `origin/fix/audit-2026-11-11-critical`).

## Repositorio

- Remote: `https://github.com/teka369/R.E.C-plus.git`
- Default branch: `main`
- Visibilidad: pública
- Último push remoto observado: 2026-11-11 20:38 UTC

## Ramas remotas

| Rama | Commit punta | Fecha commit | Relación con main |
| --- | --- | --- | --- |
| `main` | `c5a4445` | 2026-10-06 | base |
| `fix/audit-2026-11-11-critical` | `ef89eb2` | 2026-11-11 | +5 commits sobre `c5a4445` |
| `hardening/fase-0-baseline` | `ef0fada` | 2026-10-06 | +2 commits sobre `c5a4445` |

No se encontraron ramas locales adicionales ni ramas remotas fuera de las tres anteriores. No existen tags.

## Pull Requests (API GitHub)

Único PR encontrado: **#1 — "Hardening/fase 0 baseline"** (abierto, sin merge).
- Autor: `teka369`
- Creado/actualizado: 2026-10-06
- Head: `hardening/fase-0-baseline` (`ef0fada`)
- Base: `main` (`c5a4445`)
- Merge commit sha registrado: `b0231b66...` (no mergeado)
- Estado: abierto, sin revisores asignados, sin labels.

No existe PR para `fix/audit-2026-11-11-critical`. Esa rama es trabajo no integrado, no revisado.

## Commits relevantes (Sep 1 – Nov 20 2026)

No hay commits en septiembre 2026. Actividad en el rango:

| Fecha | Commit | Autor | Mensaje |
| --- | --- | --- | --- |
| 2026-10-06 | `c5a4445` | teka369 | docs: auditoría técnica de R.E.C-plus al commit 2795c65 |
| 2026-10-06 | `6acea2f` | teka369 | docs: baseline de hardening fase 0 |
| 2026-10-06 | `ef0fada` | teka369 | security: untrack secrets and user uploads |
| 2026-11-11 | `f8dec9d` | Shyoko115 | fix: cerrar hallazgos criticos de la auditoria 2026-11-11 |
| 2026-11-11 | `ad74989` | Shyoko115 | chore: quitar test mjs duplicado de client-ip |
| 2026-11-11 | `540353e` | Shyoko115 | feat: preparar deploy en Vercel, Render y Neon |
| 2026-11-11 | `a71695d` | Shyoko115 | feat: automatizar deploy de Neon, Render y Vercel |
| 2026-11-11 | `ef89eb2` | Shyoko115 | feat: un solo comando para pedir keys y desplegar |

## Línea de desarrollo elegida

`fix/audit-2026-11-11-critical` es la más completa y coherente: contiene los fixes de seguridad de la auditoría 2026-11-11, el desacoplamiento de secretos del índice, la preparación de Vercel/Render/Neon y la automatización de deploy. Es la continuación correcta del trabajo. Se creó la rama local `work/audit-recovery` sobre ella sin modificar `main`.

`hardening/fase-0-baseline` aporta la documentación de baseline de hardening y el untrack de secretos; esos cambios ya están reflejados en la rama fix (no hay `.env` ni uploads trackeados en fix). No se mezcló automáticamente; se verificó por `git ls-files`.

## Hallazgos

- No se fusionó ninguna rama a `main` (autorización no otorgada).
- `fix/audit-2026-11-11-critical` no tiene PR; su trabajo no fue revisado.
- `hardening/fase-0-baseline` tiene PR #1 abierto y sin merge.
- No se detectaron ramas abandonadas adicionales ni trabajo en septiembre 2026.

## Evidencia de verificación

- `git branch -a`, `git log --all`, API `https://api.github.com/repos/teka369/R.E.C-plus/pulls`.
- `git ls-files | grep -E "\.env$|uploads/.*\.(pdf|jpeg|jpg|png)$"` → sin resultados (secretos/uploads no trackeados en la rama de trabajo).
- `scripts/check-tracked-secrets.mjs` → "secret/upload guard ok" (exit 0).