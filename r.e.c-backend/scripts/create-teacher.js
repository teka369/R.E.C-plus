// Script para crear profesor de prueba
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTeacher() {
  try {
    console.log('✨ Creando profesor de prueba...\n');

    const hashedPassword = await bcrypt.hash('ProfesorTest@2025', 10);
    
    const teacher = await prisma.user.create({
      data: {
        nombres: 'Carlos',
        apellidos: 'Acosta Vélez',
        email: 'carlos.acosta@iejavieralondonobarriosevilla.edu.co',
        password: hashedPassword,
        documento_identidad: '98765432',
        telefono: '+57 301 9876543',
        role: 'PROFESOR',
      },
    });

    console.log('✅ Profesor creado exitosamente\n');
    console.log('👨‍🏫 Datos de acceso:');
    console.log('═════════════════════════════════════════');
    console.log(`📧 Email:       ${teacher.email}`);
    console.log(`🔐 Contraseña:  ProfesorTest@2025`);
    console.log(`👤 Nombre:      ${teacher.nombres} ${teacher.apellidos}`);
    console.log(`🆔 ID:          ${teacher.id}`);
    console.log(`📌 Rol:         ${teacher.role}`);
    console.log('═════════════════════════════════════════\n');
    console.log('💡 Ya puedes iniciar sesión con estas credenciales');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ El email ya existe en la base de datos');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTeacher();
