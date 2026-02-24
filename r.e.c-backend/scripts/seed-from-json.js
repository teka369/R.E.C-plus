const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const UserRole = {
  SECRETARIA: 'SECRETARIA',
  PROFESOR: 'PROFESOR',
  ESTUDIANTE: 'ESTUDIANTE',
};

async function main() {
  const jsonPath = process.argv[2] || path.join(__dirname, 'seed-users.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`No se encontró el archivo JSON en: ${jsonPath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  let items;
  try {
    items = JSON.parse(raw);
  } catch (e) {
    console.error('Error parseando JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(items)) {
    console.error('El JSON debe ser un arreglo de usuarios');
    process.exit(1);
  }

  for (const item of items) {
    const {
      nombres,
      apellidos,
      email,
      documento_identidad,
      telefono,
      role,
      password,
    } = item;

    // Validaciones mínimas
    if (!nombres || !apellidos || !email || !documento_identidad) {
      console.warn(`Saltando usuario por campos faltantes: ${email}`);
      continue;
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      console.log(`Ya existe: ${email}, se omite`);
      continue;
    }

    // Reglas de negocio alineadas con UsersService
    let roleFinal = role || UserRole.ESTUDIANTE;
    let passwordFinal = password;

    if (roleFinal === UserRole.PROFESOR) {
      if (!telefono) {
        console.warn(`Profesor sin teléfono, se omite: ${email}`);
        continue;
      }
      if (!passwordFinal) {
        console.warn(`Profesor sin contraseña, se omite: ${email}`);
        continue;
      }
    } else if (roleFinal === UserRole.SECRETARIA) {
      if (!passwordFinal) {
        console.warn(`Secretaría sin contraseña, se omite: ${email}`);
        continue;
      }
    } else {
      // ESTUDIANTE: usar documento como contraseña si no se provee
      passwordFinal = passwordFinal || documento_identidad;
    }

    const hashedPassword = await bcrypt.hash(passwordFinal, 10);

    await prisma.user.create({
      data: {
        nombres,
        apellidos,
        email,
        documento_identidad,
        telefono: telefono || null,
        password: hashedPassword,
        role: roleFinal,
      },
    });
    console.log(`Creado: ${email} (${roleFinal})`);
  }
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });