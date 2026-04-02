/**
 * Crea (si no existen) una institución demo, un usuario SECRETARIA y un SUPER_ADMIN
 * para desarrollo local. Idempotente: no duplica emails.
 *
 * Uso (desde r.e.c-backend):
 *   node scripts/bootstrap-dev-access.js
 *
 * Variables opcionales:
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD (mín. 10 caracteres)
 *   SECRETARIA_EMAIL, SECRETARIA_PASSWORD (mín. 8 caracteres, validación login)
 *   INSTITUTION_SLUG, INSTITUTION_NAME
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const defaults = {
  superAdminEmail: '  ',
  superAdminPassword: 'RecDev2026!Sa',
  secretariaEmail: 'secretaria@rec-dev.local',
  secretariaPassword: 'RecDev2026!Se',
  institutionSlug: 'rec-dev',
  institutionName: 'Institución desarrollo R.E.C',
};

async function ensureInstitution() {
  const slug = (process.env.INSTITUTION_SLUG || defaults.institutionSlug).trim();
  const nombre = (process.env.INSTITUTION_NAME || defaults.institutionName).trim();

  let inst = await prisma.institution.findUnique({ where: { slug } });
  if (inst) {
    return inst;
  }

  const any = await prisma.institution.findFirst({ orderBy: { id: 'asc' } });
  if (any) {
    console.log(`Usando institución existente id=${any.id} (${any.nombre})`);
    return any;
  }

  inst = await prisma.institution.create({
    data: {
      nombre,
      slug,
      codigo: 'DEV-001',
      activa: true,
    },
  });
  console.log(`Institución creada: id=${inst.id} slug=${inst.slug}`);
  return inst;
}

async function ensureSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || defaults.superAdminEmail)
    .trim()
    .toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || defaults.superAdminPassword;
  const nombres = process.env.SUPER_ADMIN_NOMBRES || 'Super';
  const apellidos = process.env.SUPER_ADMIN_APELLIDOS || 'Administrador';
  if (password.length < 10) {
    throw new Error('SUPER_ADMIN_PASSWORD debe tener al menos 10 caracteres');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', institutionId: null },
      });
      console.log(`Usuario ${email} promovido a SUPER_ADMIN.`);
    } else {
      console.log(`SUPER_ADMIN ya existe: ${email}`);
    }
    return { email, password: '(la que ya tenías; no se cambió aquí)' };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      institutionId: null,
      nombres,
      apellidos,
      email,
      password: hashed,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`SUPER_ADMIN creado: ${email}`);
  return { email, password };
}

async function ensureSecretaria(institutionId) {
  const email = (process.env.SECRETARIA_EMAIL || defaults.secretariaEmail)
    .trim()
    .toLowerCase();
  const password = process.env.SECRETARIA_PASSWORD || defaults.secretariaPassword;
  const nombres = process.env.SECRETARIA_NOMBRES || 'Secretaría';
  const apellidos = process.env.SECRETARIA_APELLIDOS || 'Demo';
  if (password.length < 8) {
    throw new Error('SECRETARIA_PASSWORD debe tener al menos 8 caracteres');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'SECRETARIA') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SECRETARIA', institutionId },
      });
      console.log(`Usuario ${email} actualizado a SECRETARIA (institución ${institutionId}).`);
    } else if (existing.institutionId !== institutionId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { institutionId },
      });
      console.log(`Secretaría ${email} reasignada a institución ${institutionId}.`);
    } else {
      console.log(`SECRETARIA ya existe: ${email}`);
    }
    return { email, password: '(la que ya tenías; no se cambió aquí)' };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      institutionId,
      nombres,
      apellidos,
      email,
      password: hashed,
      role: 'SECRETARIA',
    },
  });
  console.log(`SECRETARIA creada: ${email} (institución ${institutionId})`);
  return { email, password };
}

async function main() {
  const inst = await ensureInstitution();
  const superCreds = await ensureSuperAdmin();
  const secCreds = await ensureSecretaria(inst.id);

  console.log('\n--- Accesos (guárdalos en un gestor; no commitees) ---');
  console.log('Super Admin → /acceso-secretaria o login según flujo:');
  console.log(`  Email:    ${typeof superCreds.email === 'string' ? superCreds.email : ''}`);
  console.log(`  Password: ${superCreds.password}`);
  console.log('Secretaría → /acceso-secretaria:');
  console.log(`  Email:    ${typeof secCreds.email === 'string' ? secCreds.email : ''}`);
  console.log(`  Password: ${secCreds.password}`);
  console.log('---\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
