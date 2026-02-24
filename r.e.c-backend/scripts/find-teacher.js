// Script para encontrar profesor en la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findTeacher() {
  try {
    console.log('🔍 Buscando profesor en la base de datos...\n');

    const teacher = await prisma.user.findFirst({
      where: {
        role: 'PROFESOR',
      },
    });

    if (!teacher) {
      console.log('❌ No hay profesores en la base de datos\n');
      console.log('💡 Creando profesor de ejemplo...\n');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('ProfesorTest@2025', 10);
      
      const newTeacher = await prisma.user.create({
        data: {
          nombres: 'Carlos',
          apellidos: 'Rodríguez García',
          email: 'carlos.rodriguez@iejavieralondonobarriosevilla.edu.co',
          password: hashedPassword,
          documento_identidad: '87654321',
          telefono: '+57 301 5555555',
          role: 'PROFESOR',
        },
      });

      console.log('✅ Profesor creado exitosamente\n');
      console.log('👨‍🏫 Datos del profesor:');
      console.log(`   Email: ${newTeacher.email}`);
      console.log(`   Contraseña: ProfesorTest@2025`);
      console.log(`   Nombre: ${newTeacher.nombres} ${newTeacher.apellidos}`);
      console.log(`   ID: ${newTeacher.id}`);
      console.log(`   Rol: ${newTeacher.role}`);
      return;
    }

    console.log('👨‍🏫 Profesor encontrado:\n');
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Nombre: ${teacher.nombres} ${teacher.apellidos}`);
    console.log(`   ID: ${teacher.id}`);
    console.log(`   Rol: ${teacher.role}`);
    console.log('\n⚠️ La contraseña no se puede recuperar (está encriptada)');
    console.log('💡 Opción: Crear un nuevo profesor con contraseña conocida');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findTeacher();
