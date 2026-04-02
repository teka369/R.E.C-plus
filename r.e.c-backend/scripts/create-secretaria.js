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

async function createSecretaria() {
  try {
    const institutionId = await resolveInstitutionId();

    const secretariaData = {
      institutionId,
      nombres: process.env.SECRETARIA_NOMBRES || 'Maria',
      apellidos: process.env.SECRETARIA_APELLIDOS || 'Garcia Lopez',
      email:
        (process.env.SECRETARIA_EMAIL ||
          `secretaria.${institutionId}@colegio.local`).trim().toLowerCase(),
      password: process.env.SECRETARIA_PASSWORD || 'Admin@2026',
      role: 'SECRETARIA',
    };

    const existing = await prisma.user.findUnique({
      where: { email: secretariaData.email },
    });

    if (existing) {
      console.log('La secretaria ya existe en la BD:', existing.email);
      return;
    }

    const hashedPassword = await bcrypt.hash(secretariaData.password, 10);

    const secretaria = await prisma.user.create({
      data: {
        institutionId: secretariaData.institutionId,
        nombres: secretariaData.nombres,
        apellidos: secretariaData.apellidos,
        email: secretariaData.email,
        password: hashedPassword,
        role: secretariaData.role,
      },
    });

    console.log('Secretaria creada exitosamente:');
    console.log('Institucion ID:', secretaria.institutionId);
    console.log('Email:', secretaria.email);
    console.log('Password inicial:', secretariaData.password);
  } catch (error) {
    console.error('Error al crear la secretaria:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSecretaria();
