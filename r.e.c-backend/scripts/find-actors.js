const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const secretaria = await prisma.user.findFirst({ where: { role: 'SECRETARIA' } });
  const professor = await prisma.user.findFirst({ where: { role: 'PROFESOR' }, orderBy: { id: 'desc' } });
  const student = await prisma.user.findFirst({ where: { role: 'ESTUDIANTE' }, orderBy: { id: 'desc' } });

  console.log(JSON.stringify({
    secretaria: secretaria ? { id: secretaria.id, email: secretaria.email } : null,
    professor: professor ? { id: professor.id, email: professor.email } : null,
    student: student ? { id: student.id, email: student.email } : null,
    defaultPasswords: { secretaria: 'admin12345', others: 'password123' }
  }, null, 2));
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