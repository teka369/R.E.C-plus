const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resolveInstitutionId() {
  if (process.env.INSTITUTION_ID) {
    const parsed = Number(process.env.INSTITUTION_ID);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('INSTITUTION_ID invalido');
    }
    return parsed;
  }

  const firstInstitution = await prisma.institution.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (!firstInstitution) {
    throw new Error('No existen instituciones. Cree una institucion primero.');
  }

  return firstInstitution.id;
}

async function createTeacher() {
  try {
    const institutionId = await resolveInstitutionId();

    const email =
      (process.env.TEACHER_EMAIL ||
        `profesor.${institutionId}.${Date.now()}@colegio.local`).trim().toLowerCase();
    const password = process.env.TEACHER_PASSWORD || 'ProfesorTest@2026';

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      console.log('El email ya existe en la base de datos:', email);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await prisma.user.create({
      data: {
        institutionId,
        nombres: process.env.TEACHER_NOMBRES || 'Carlos',
        apellidos: process.env.TEACHER_APELLIDOS || 'Acosta Velez',
        email,
        password: hashedPassword,
        role: 'PROFESOR',
      },
    });

    console.log('Profesor creado exitosamente');
    console.log(`Institucion ID: ${teacher.institutionId}`);
    console.log(`Email: ${teacher.email}`);
    console.log(`Password inicial: ${password}`);
    console.log(`ID: ${teacher.id}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTeacher();
