// Script para verificar que el endpoint getStudentGroup funciona correctamente

const API_URL = 'http://localhost:4001';
const STUDENT_ID = 2; // juan david guarin romero

async function testStudentGroup() {
  try {
    console.log(`🔍 Verificando grupo del estudiante ID: ${STUDENT_ID}\n`);

    // Obtener grupo del estudiante
    const groupRes = await fetch(`${API_URL}/academic/students/${STUDENT_ID}/group`);
    const groupData = await groupRes.json();
    console.log('✅ Respuesta del endpoint /academic/students/:studentId/group:');
    console.log(JSON.stringify(groupData, null, 2));

    if (groupData) {
      console.log('\n📋 Desglose:');
      console.log(`  - ID StudentGroup: ${groupData.id}`);
      console.log(`  - Student ID: ${groupData.studentId}`);
      console.log(`  - Grupo ID: ${groupData.group?.id}`);
      console.log(`  - Grupo Nombre: ${groupData.group?.nombre}`);
      console.log(`  - Grado ID: ${groupData.group?.grade?.id}`);
      console.log(`  - Grado Nombre: ${groupData.group?.grade?.nombre}`);
    } else {
      console.log('❌ No hay grupo asignado');
    }

    // Obtener materias del estudiante
    console.log('\n🔍 Verificando materias del estudiante...\n');
    const subjectsRes = await fetch(`${API_URL}/academic/students/${STUDENT_ID}/subjects`);
    const subjectsData = await subjectsRes.json();
    console.log('✅ Respuesta del endpoint /academic/students/:studentId/subjects:');
    console.log(JSON.stringify(subjectsData, null, 2));
    console.log(`\nTotal de materias: ${subjectsData?.length || 0}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStudentGroup();
