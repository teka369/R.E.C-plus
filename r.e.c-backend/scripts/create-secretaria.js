// Script para crear una secretaria en la BD
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSecretaria() {
  try {
    // Datos de la secretaria
    const secretariaData = {
      nombres: 'María',
      apellidos: 'García López',
      email: 'secretaria@iejavieralondonobarriosevilla.edu.co',
      documento_identidad: '12345678',
      password: 'Admin@2025', // Contraseña inicial
      role: 'SECRETARIA',
    };

    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: secretariaData.email },
    });

    if (existing) {
      console.log('❌ La secretaria ya existe en la BD:', existing.email);
      return;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(secretariaData.password, 10);

    // Crear secretaria
    const secretaria = await prisma.user.create({
      data: {
        nombres: secretariaData.nombres,
        apellidos: secretariaData.apellidos,
        email: secretariaData.email,
        documento_identidad: secretariaData.documento_identidad,
        password: hashedPassword,
        role: secretariaData.role,
        telefono: null, // Teléfono no es requerido para secretarias
      },
    });

    console.log('✅ Secretaria creada exitosamente:');
    console.log('📧 Email:', secretaria.email);
    console.log('🔑 Contraseña: Admin@2025');
    console.log('👤 Nombres:', secretaria.nombres, secretaria.apellidos);
    console.log('📝 Documento:', secretaria.documento_identidad);
    console.log('\n💡 Usa estas credenciales en: http://localhost:3000/acceso-secretaria');
  } catch (error) {
    console.error('❌ Error al crear la secretaria:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSecretaria();
