const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const existing = await prisma.user.findFirst({ where: { role: 'SECRETARIA' } });
  if (!existing) {
    const hashed = await bcrypt.hash('admin12345', 10);
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