const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || '';
  const nombres = process.env.SUPER_ADMIN_NOMBRES || 'Admin';
  const apellidos = process.env.SUPER_ADMIN_APELLIDOS || 'Plataforma';
  const documento = process.env.SUPER_ADMIN_DOCUMENTO || `SAAS-${Date.now()}`;

  if (!email) {
    throw new Error('SUPER_ADMIN_EMAIL es requerido');
  }
  if (!password || password.length < 10) {
    throw new Error('SUPER_ADMIN_PASSWORD es requerido y debe tener al menos 10 caracteres');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario con email ${email}.`);
    if (existing.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', institutionId: null },
      });
      console.log('El usuario fue promovido a SUPER_ADMIN.');
    } else {
      console.log('El usuario ya es SUPER_ADMIN.');
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      institutionId: null,
      nombres,
      apellidos,
      email,
      documento_identidad: documento,
      password: hashed,
      role: 'SUPER_ADMIN',
    },
    select: { id: true, email: true, role: true },
  });

  console.log('SUPER_ADMIN creado correctamente:');
  console.log(created);
}

main()
  .catch((error) => {
    console.error('Error creando SUPER_ADMIN:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
