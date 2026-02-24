const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const groupId = parseInt(process.env.GROUP_ID || '1', 10);
  const directorId = parseInt(process.env.DIRECTOR_ID || '11', 10);

  const user = await prisma.user.findUnique({ where: { id: directorId } });
  if (!user) throw new Error(`Usuario ${directorId} no encontrado`);
  if (user.role !== 'PROFESOR') throw new Error(`Usuario ${directorId} no es PROFESOR`);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error(`Grupo ${groupId} no encontrado`);

  await prisma.group.update({ where: { id: groupId }, data: { directorId } });

  const info = await prisma.groupInfo.upsert({
    where: { groupId },
    update: {
      summary: 'Resumen del grupo actualizado por el director.',
      highlights: ['Proyecto Matemáticas', 'Participación destacada'],
      metrics: { promedio_general: 4.3, asistencia: 95, tareas_completadas: 88 },
      links: ['https://materiales.example/guia', 'https://calificaciones.example']
    },
    create: {
      groupId,
      summary: 'Resumen del grupo actualizado por el director.',
      highlights: ['Proyecto Matemáticas', 'Participación destacada'],
      metrics: { promedio_general: 4.3, asistencia: 95, tareas_completadas: 88 },
      links: ['https://materiales.example/guia', 'https://calificaciones.example']
    }
  });

  const out = await prisma.group.findUnique({
    where: { id: groupId },
    include: { grade: true }
  });

  console.log('Director asignado:', { groupId, directorId });
  console.log('Group:', out);
  console.log('GroupInfo:', info);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });