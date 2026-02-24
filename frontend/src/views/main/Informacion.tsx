import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form } from 'react-bootstrap';
import { FaTasks, FaClipboardCheck, FaChartLine } from 'react-icons/fa';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'entregada' | 'calificada';
  materia: string;
  grado: string;
}

interface PromedioMateria {
  materia: string;
  promedio: number;
}

interface AsistenciaMateria {
  materia: string;
  presente: number;
  ausente: number;
  justificado: number;
}

const Informacion: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>('Todas');

  const [todasLasTareas, setTodasLasTareas] = useState<Tarea[]>([
    {
      id: 1,
      titulo: 'Completar Ejercicios de Ecuaciones',
      descripcion: 'Ejercicios 1-10 del capítulo 3',
      fechaEntrega: '2024-06-25',
      estado: 'pendiente',
      materia: 'Matemáticas',
      grado: '10-1'
    },
    {
      id: 2,
      titulo: 'Leer Capítulo sobre la Fotosíntesis',
      descripcion: 'Prepararse para quiz',
      fechaEntrega: '2024-06-28',
      estado: 'pendiente',
      materia: 'Biología',
      grado: '10-1'
    },
    {
      id: 3,
      titulo: 'Reporte de Laboratorio de Química',
      descripcion: 'Análisis de resultados del experimento X',
      fechaEntrega: '2024-07-01',
      estado: 'pendiente',
      materia: 'Química',
      grado: '10-1'
    },
    {
      id: 4,
      titulo: 'Resolver problemas de óptica',
      descripcion: 'Problemas del capítulo 5',
      fechaEntrega: '2024-07-05',
      estado: 'pendiente',
      materia: 'Física',
      grado: '10-1'
    },
  ]);

  const [todosLosPromedios, setTodosLosPromedios] = useState<PromedioMateria[]>([
    { materia: 'Matemáticas', promedio: 4.2 },
    { materia: 'Biología', promedio: 3.9 },
    { materia: 'Química', promedio: 4.1 },
    { materia: 'Física', promedio: 3.5 },
    { materia: 'Historia', promedio: 4.5 },
    { materia: 'Literatura', promedio: 3.7 },
  ]);

  const [todasLasAsistencias, setTodasLasAsistencias] = useState<AsistenciaMateria[]>([
    { materia: 'Matemáticas', presente: 18, ausente: 2, justificado: 1 },
    { materia: 'Biología', presente: 19, ausente: 1, justificado: 0 },
    { materia: 'Química', presente: 17, ausente: 3, justificado: 0 },
    { materia: 'Física', presente: 16, ausente: 2, justificado: 3 },
    { materia: 'Historia', presente: 20, ausente: 0, justificado: 0 },
    { materia: 'Literatura', presente: 15, ausente: 5, justificado: 1 },
  ]);

  useEffect(() => {
    const name = localStorage.getItem('userName');
    setUserName(name || '');
  }, []);

  const materiasDisponibles = (() => {
    const allMaterias = new Set<string>();
    todasLasTareas.forEach(t => allMaterias.add(t.materia));
    todosLosPromedios.forEach(p => allMaterias.add(p.materia));
    todasLasAsistencias.forEach(a => allMaterias.add(a.materia));
    return ['Todas', ...Array.from(allMaterias)].sort();
  })();

  const tareasFiltradas = materiaSeleccionada === 'Todas'
    ? todasLasTareas
    : todasLasTareas.filter(tarea => tarea.materia === materiaSeleccionada);

  const promediosFiltrados = materiaSeleccionada === 'Todas'
    ? todosLosPromedios
    : todosLosPromedios.filter(promedio => promedio.materia === materiaSeleccionada);

  const asistenciasFiltradas = materiaSeleccionada === 'Todas'
    ? todasLasAsistencias
    : todasLasAsistencias.filter(asistencia => asistencia.materia === materiaSeleccionada);

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-4 mb-3">Tu Rendimiento Académico, {userName}</h1>
          <p className="lead text-muted">Aquí encontrarás información detallada sobre tus tareas, promedios y asistencia por materia.</p>
        </div>

        {/* Selector de Materia */}
        <Row className="mb-4">
          <Col md={{ span: 6, offset: 3 }}>
            <Form.Group>
              <Form.Label>Selecciona una materia para filtrar:</Form.Label>
              <Form.Select
                value={materiaSeleccionada}
                onChange={(e) => setMateriaSeleccionada(e.target.value)}
              >
                {materiasDisponibles.map(materia => (
                  <option key={materia} value={materia}>
                    {materia}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Sección de Tareas Pendientes */}
        <Row className="mb-5">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center mb-4">
                  <FaTasks className="text-primary me-2" style={{ fontSize: '1.5rem' }} />
                  <h5 className="mb-0">Tareas Pendientes {materiaSeleccionada === 'Todas' ? '' : `de ${materiaSeleccionada}`}</h5>
                </div>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Título de la Tarea</th>
                      <th>Fecha de Entrega</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tareasFiltradas.length > 0 ? (
                      tareasFiltradas.map(tarea => (
                        <tr key={tarea.id}>
                          <td>{tarea.materia}</td>
                          <td>{tarea.titulo}</td>
                          <td>{tarea.fechaEntrega}</td>
                          <td><Badge bg="warning">{tarea.estado}</Badge></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center">No hay tareas pendientes {materiaSeleccionada === 'Todas' ? '' : `para ${materiaSeleccionada}`}.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Sección de Promedios y Asistencia */}
        <Row className="g-4 mb-5">
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center mb-4">
                  <FaChartLine className="text-success me-2" style={{ fontSize: '1.5rem' }} />
                  <h5 className="mb-0">Promedio General {materiaSeleccionada === 'Todas' ? 'por Materia' : `de ${materiaSeleccionada}`}</h5>
                </div>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promediosFiltrados.length > 0 ? (
                      promediosFiltrados.map((promedio, index) => (
                        <tr key={index}>
                          <td>{promedio.materia}</td>
                          <td><Badge bg="info">{promedio.promedio}</Badge></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center">No hay promedios {materiaSeleccionada === 'Todas' ? '' : `para ${materiaSeleccionada}`}.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center mb-4">
                  <FaClipboardCheck className="text-info me-2" style={{ fontSize: '1.5rem' }} />
                  <h5 className="mb-0">Asistencia {materiaSeleccionada === 'Todas' ? 'por Materia' : `de ${materiaSeleccionada}`}</h5>
                </div>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Presente</th>
                      <th>Ausente</th>
                      <th>Justificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistenciasFiltradas.length > 0 ? (
                      asistenciasFiltradas.map((asistencia, index) => (
                        <tr key={index}>
                          <td>{asistencia.materia}</td>
                          <td><Badge bg="success">{asistencia.presente}</Badge></td>
                          <td><Badge bg="danger">{asistencia.ausente}</Badge></td>
                          <td><Badge bg="warning">{asistencia.justificado}</Badge></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center">No hay registros de asistencia {materiaSeleccionada === 'Todas' ? '' : `para ${materiaSeleccionada}`}.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Informacion; 