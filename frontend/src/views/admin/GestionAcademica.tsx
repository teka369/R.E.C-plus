import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaAward, FaCalendarCheck, FaChartLine, FaEye, FaUsers } from 'react-icons/fa';
import { EstudianteDetalleModal } from './components/modals/EstudianteDetalleModal';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'entregada' | 'calificada';
  calificacion?: number;
  materia: string;
  grado: string;
}

interface AsistenciaRegistro {
  id: number;
  fecha: string;
  estado: 'presente' | 'ausente' | 'justificado';
}

interface PromedioMateria {
  materia: string;
  promedio: number;
}

interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  grado: string;
  tareas: Tarea[];
  asistencias: AsistenciaRegistro[];
  promedios: PromedioMateria[];
}

const GestionAcademica: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('profesor');
  const [userSubject, setUserSubject] = useState<string>('Biología');
  const [selectedGrado, setSelectedGrado] = useState<string>('10-1');
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([
    {
      id: 101,
      nombre: 'Juan',
      apellido: 'Pérez',
      grado: '10-1',
      tareas: [
        {
          id: 1,
          titulo: 'Reporte de Ecología del Lago',
          descripcion: 'Análisis de la biodiversidad del lago local.',
          fechaEntrega: '2024-07-01',
          estado: 'pendiente',
          materia: 'Biología',
          grado: '10-1'
        },
        {
          id: 2,
          titulo: 'Presentación sobre Células',
          descripcion: 'Preparar una presentación sobre los tipos de células y sus funciones.',
          fechaEntrega: '2024-07-05',
          estado: 'entregada',
          materia: 'Biología',
          grado: '10-1'
        }
      ],
      asistencias: [
        { id: 1, fecha: '2024-06-01', estado: 'presente' },
        { id: 2, fecha: '2024-06-05', estado: 'presente' },
      ],
      promedios: [
        { materia: 'Biología', promedio: 4.0 },
        { materia: 'Matemáticas', promedio: 3.5 }
      ]
    },
    {
      id: 102,
      nombre: 'María',
      apellido: 'García',
      grado: '10-1',
      tareas: [
        {
          id: 3,
          titulo: 'Ensayo sobre el Ecosistema Marino',
          descripcion: 'Investigar y escribir sobre el ecosistema marino.',
          fechaEntrega: '2024-07-10',
          estado: 'pendiente',
          materia: 'Biología',
          grado: '10-1'
        }
      ],
      asistencias: [
        { id: 3, fecha: '2024-06-01', estado: 'ausente' },
        { id: 4, fecha: '2024-06-05', estado: 'justificado' },
      ],
      promedios: [
        { materia: 'Biología', promedio: 3.5 }
      ]
    },
  ]);

  // Estados para los modales
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);
  const [showEstudianteDetalleModal, setShowEstudianteDetalleModal] = useState(false);
  const [showTareaGeneralModal, setShowTareaGeneralModal] = useState(false);

  const [currentTarea, setCurrentTarea] = useState<Tarea | null>(null);
  const [currentEstudiante, setCurrentEstudiante] = useState<Estudiante | null>(null);

  useEffect(() => {
    // En una aplicación real, aquí obtendrías el rol, la materia del profesor y los datos de estudiantes desde el backend
    // setUserRole(localStorage.getItem('userRole') || '');
    // setUserSubject(localStorage.getItem('userSubject') || '');
    // Cargar estudiantes y sus datos
  }, []);

  // Filtrar estudiantes por la materia del profesor
  const filteredEstudiantes = estudiantes.filter(estudiante => 
    estudiante.tareas.some(t => t.materia === userSubject) ||
    estudiante.asistencias.some(a => a.estado !== undefined) || // Asumiendo que la asistencia siempre tiene materia si está registrada
    estudiante.promedios.some(p => p.materia === userSubject)
  );

  // Funciones para tareas
  const handleCalificarTarea = (estudiante: Estudiante, tarea: Tarea) => {
    setCurrentEstudiante(estudiante);
    setCurrentTarea(tarea);
    setShowCalificacionModal(true);
  };

  // Funciones para asistencia
  const handleRegistrarAsistencia = (estudiante: Estudiante) => {
    setCurrentEstudiante(estudiante);
    setShowAsistenciaModal(true);
  };

  const handleGuardarAsistencia = (asistenciaData: { fecha: string; materia: string; estudiantes: { id: number; estado: 'presente' | 'ausente' | 'justificado' }[] }) => {
    setEstudiantes(prevEstudiantes => {
      const updatedEstudiantes = prevEstudiantes.map(est => {
        const asistenciaEstudiante = asistenciaData.estudiantes.find(att => att.id === est.id);
        if (asistenciaEstudiante) {
          const newAsistencia: AsistenciaRegistro = {
            id: Date.now(), // Generar un ID único para cada registro de asistencia
            fecha: asistenciaData.fecha,
            estado: asistenciaEstudiante.estado,
            // materia: asistenciaData.materia // Si AsistenciaRegistro necesita materia, descomentar
          };
          return { ...est, asistencias: [...est.asistencias, newAsistencia] };
        }
        return est;
      });
      return updatedEstudiantes;
    });
    setShowAsistenciaModal(false);
  };

  // Funciones para calificación
  const handleGuardarCalificacion = (tareaCalificada: Tarea) => {
    setEstudiantes(prevEstudiantes => 
      prevEstudiantes.map(est => {
        if (est.id === currentEstudiante?.id) {
          return {
            ...est,
            tareas: est.tareas.map(t => t.id === tareaCalificada.id ? tareaCalificada : t)
          };
        }
        return est;
      })
    );
    setShowCalificacionModal(false);
  };

  // Nueva función para guardar el promedio
  const handleSavePromedio = (estudianteId: number, materia: string, nuevoPromedio: number) => {
    setEstudiantes(prevEstudiantes => 
      prevEstudiantes.map(est => {
        if (est.id === estudianteId) {
          const updatedPromedios = est.promedios.some(p => p.materia === materia)
            ? est.promedios.map(p => p.materia === materia ? { ...p, promedio: nuevoPromedio } : p)
            : [...est.promedios, { materia: materia, promedio: nuevoPromedio }];
          return { ...est, promedios: updatedPromedios };
        }
        return est;
      })
    );
  };

  // Función para ver detalles del estudiante (usando la nueva modal)
  const handleVerDetallesEstudiante = (estudiante: Estudiante) => {
    setCurrentEstudiante(estudiante);
    setShowEstudianteDetalleModal(true);
  };

  const handleUpdateTareaEstado = (estudianteId: number, tareaId: number, nuevoEstado: Tarea['estado']) => {
    setEstudiantes(prevEstudiantes =>
      prevEstudiantes.map(est =>
        est.id === estudianteId
          ? {
              ...est,
              tareas: est.tareas.map(tarea =>
                tarea.id === tareaId ? { ...tarea, estado: nuevoEstado } : tarea
              )
            }
          : est
      )
    );
  };

  // Nueva función para crear tarea general
  const handleCrearTareaGeneral = () => {
    setCurrentTarea(null);
    setShowTareaGeneralModal(true);
  };

  const handleGuardarTareaGeneral = (nuevaTarea: Tarea) => {
    setEstudiantes(prevEstudiantes =>
      prevEstudiantes.map(est => {
        if (est.grado === selectedGrado) {
          return {
            ...est,
            tareas: [...est.tareas, { ...nuevaTarea, id: Date.now(), materia: userSubject, grado: selectedGrado }]
          };
        }
        return est;
      })
    );
    setShowTareaGeneralModal(false);
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-4 mb-3">Gestión Académica de {userSubject}</h1>
          <p className="lead text-muted">Gestiona las tareas, asistencia y promedios de tus estudiantes.</p>
        </div>

        {/* Filtros y Controles */}
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Grado</Form.Label>
              <Form.Select
                value={selectedGrado}
                onChange={(e) => setSelectedGrado(e.target.value)}
              >
                {Array.from({ length: 6 }, (_, i) => i + 6).map((grado) => (
                  <option key={grado} value={`${grado}-1`}>Grado {grado}-1</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={8} className="text-end">
            <Button
              variant="primary"
              className="me-2"
              onClick={handleCrearTareaGeneral}
            >
              <FaUsers className="me-2" /> Crear Tarea General
            </Button>
          </Col>
        </Row>

        {/* Tabla Unificada de Estudiantes */}
        <Row>
          <Col md={12}>
            <Card className="border-0 shadow-sm mb-5">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Estudiantes en {userSubject} - Grado {selectedGrado}</h5>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Grado</th>
                        <th>Tareas Pendientes ({userSubject})</th>
                        <th>Promedio ({userSubject})</th>
                        <th>Asistencia ({userSubject})</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEstudiantes
                        .filter(est => est.grado === selectedGrado)
                        .map(estudiante => {
                          const tareasPendientesCount = estudiante.tareas.filter(t => t.materia === userSubject && t.estado === 'pendiente').length;
                          const promedioMateria = estudiante.promedios.find(p => p.materia === userSubject)?.promedio || 'N/A';
                          const totalClases = estudiante.asistencias.length;
                          const presentes = estudiante.asistencias.filter(a => a.estado === 'presente').length;
                          const porcentajeAsistencia = totalClases > 0 ? ((presentes / totalClases) * 100).toFixed(0) : 'N/A';

                          return (
                            <tr key={estudiante.id}>
                              <td>{estudiante.nombre} {estudiante.apellido}</td>
                              <td>{estudiante.grado}</td>
                              <td><Badge bg="warning">{tareasPendientesCount}</Badge></td>
                              <td><Badge bg="info">{promedioMateria}</Badge></td>
                              <td><Badge bg="primary">{porcentajeAsistencia}%</Badge></td>
                              <td>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleRegistrarAsistencia(estudiante)}
                                >
                                  <FaCalendarCheck /> Asistencia
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => handleVerDetallesEstudiante(estudiante)}
                                >
                                  <FaEye /> Detalles
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modales */}
      <EditarTareaModal
        show={showTareaGeneralModal}
        onHide={() => setShowTareaGeneralModal(false)}
        tarea={currentTarea}
        onSave={handleGuardarTareaGeneral}
      />

      <AsistenciaModal
        show={showAsistenciaModal}
        onHide={() => setShowAsistenciaModal(false)}
        onSave={handleGuardarAsistencia}
        estudiantes={estudiantes}
        gradoSeleccionado={selectedGrado}
      />

      {currentTarea && (
        <CalificacionModal
          show={showCalificacionModal}
          onHide={() => setShowCalificacionModal(false)}
          tarea={currentTarea}
          onSave={handleGuardarCalificacion}
        />
      )}

      {currentEstudiante && (
        <EstudianteDetalleModal
          show={showEstudianteDetalleModal}
          onHide={() => setShowEstudianteDetalleModal(false)}
          estudiante={currentEstudiante}
          userSubject={userSubject}
          onSavePromedio={handleSavePromedio}
        />
      )}
    </div>
  );
};

export default GestionAcademica; 