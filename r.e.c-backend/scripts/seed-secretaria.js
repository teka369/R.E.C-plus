const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const existing = await prisma.user.findFirst({ where: { role: 'SECRETARIA' } });
  if (!existing) {
    const initial = process.env.SECRETARIA_BOOTSTRAP_PASSWORD;
    if (!initial || initial.length < 12 || initial === 'admin12345') {
      throw new Error('Define SECRETARIA_BOOTSTRAP_PASSWORD (>=12, no admin12345) antes de ejecutar este script');
    }
    const hashed = await bcrypt.hash(initial, 12);
    await prisma.user.create({
      data: {
        nombres: 'Sec',
        apellidos: 'Retaria',
        email: 'secretaria@iejavieralondonobarriosevilla.edu.co',
        password: hashed,
        role: 'SECRETARIA',
      },
    });
    console.log('Usuario SECRETARIA creado');
  } else {
    console.log('Ya existe un usuario SECRETARIA');
  }
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('Error creando SECRETARIA:', e);
  await prisma.$disconnect();
  process.exit(1);
});