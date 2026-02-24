import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, ProgressBar, Tabs, Tab, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaUserGraduate, FaChartLine, FaExclamationTriangle, FaCalendarAlt, FaComments, FaFileAlt, FaEdit, FaEye } from 'react-icons/fa';

interface Estudiante {
  id: number;
  nombre: string;
  curso: string;
  promedio: number;
  asistencia: number;
  estado: 'regular' | 'alerta' | 'critico';
  ultimoSeguimiento: string;
  materiasCriticas: string[];
  observaciones: number;
}

interface SeguimientoDetalle {
  id: number;
  fecha: string;
  tipo: 'academico' | 'disciplinario' | 'asistencia' | 'orientacion';
  descripcion: string;
  responsable: string;
  compromisos: string;
  estado: 'pendiente' | 'en proceso' | 'completado';
}

const Seguimiento: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Datos de ejemplo para estudiantes
  const estudiantes: Estudiante[] = [
    {
      id: 1001,
      nombre: 'Carlos Martínez Gómez',
      curso: '10°A',
      promedio: 3.2,
      asistencia: 85,
      estado: 'alerta',
      ultimoSeguimiento: '15/04/2024',
      materiasCriticas: ['Matemáticas', 'Física'],
      observaciones: 3
    },
    {
      id: 1002,
      nombre: 'Ana Rodríguez Pérez',
      curso: '9°B',
      promedio: 2.8,
      asistencia: 75,
      estado: 'critico',
      ultimoSeguimiento: '10/04/2024',
      materiasCriticas: ['Español', 'Inglés', 'Ciencias'],
      observaciones: 5
    },
    {
      id: 1003,
      nombre: 'Sofía López Torres',
      curso: '11°A',
      promedio: 4.5,
      asistencia: 98,
      estado: 'regular',
      ultimoSeguimiento: '05/04/2024',
      materiasCriticas: [],
      observaciones: 1
    },
    {
      id: 1004,
      nombre: 'Daniel Torres Ramírez',
      curso: '8°C',
      promedio: 3.7,
      asistencia: 90,
      estado: 'regular',
      ultimoSeguimiento: '12/04/2024',
      materiasCriticas: ['Historia'],
      observaciones: 2
    },
    {
      id: 1005,
      nombre: 'Valentina Gómez Castro',
      curso: '10°A',
      promedio: 3.0,
      asistencia: 80,
      estado: 'alerta',
      ultimoSeguimiento: '08/04/2024',
      materiasCriticas: ['Química', 'Matemáticas'],
      observaciones: 4
    },
    {
      id: 1006,
      nombre: 'Mateo Hernández Silva',
      curso: '9°B',
      promedio: 2.5,
      asistencia: 70,
      estado: 'critico',
      ultimoSeguimiento: '03/04/2024',
      materiasCriticas: ['Español', 'Matemáticas', 'Ciencias', 'Inglés'],
      observaciones: 6
    },
    {
      id: 1007,
      nombre: 'Isabella Castro Morales',
      curso: '11°A',
      promedio: 4.2,
      asistencia: 95,
      estado: 'regular',
      ultimoSeguimiento: '14/04/2024',
      materiasCriticas: [],
      observaciones: 0
    },
    {
      id: 1008,
      nombre: 'Santiago Morales Díaz',
      curso: '8°C',
      promedio: 3.4,
      asistencia: 88,
      estado: 'regular',
      ultimoSeguimiento: '07/04/2024',
      materiasCriticas: ['Inglés'],
      observaciones: 2
    },
  ];

  // Datos de ejemplo para seguimientos detallados
  const seguimientosDetalle: SeguimientoDetalle[] = [
    {
      id: 5001,
      fecha: '15/04/2024',
      tipo: 'academico',
      descripcion: 'Revisión de rendimiento académico. El estudiante presenta dificultades en matemáticas y física.',
      responsable: 'Prof. Juan Pérez',
      compromisos: 'Asistir a tutorías los martes y jueves. Entregar trabajos pendientes antes del 25/04.',
      estado: 'en proceso'
    },
    {
      id: 5002,
      fecha: '08/04/2024',
      tipo: 'asistencia',
      descripcion: 'Seguimiento por inasistencias recurrentes. Se contactó a los padres de familia.',
      responsable: 'Coord. María González',
      compromisos: 'Justificar inasistencias con certificados médicos. Mejorar puntualidad.',
      estado: 'pendiente'
    },
    {
      id: 5003,
      fecha: '01/04/2024',
      tipo: 'disciplinario',
      descripcion: 'Llamado de atención por comportamiento inadecuado en clase de matemáticas.',
      responsable: 'Prof. Roberto Díaz',
      compromisos: 'Mejorar comportamiento en clase. Presentar disculpas al profesor.',
      estado: 'completado'
    },
    {
      id: 5004,
      fecha: '25/03/2024',
      tipo: 'orientacion',
      descripcion: 'Entrevista con el estudiante para identificar factores que afectan su rendimiento.',
      responsable: 'Psic. Laura Sánchez',
      compromisos: 'Asistir a sesiones de orientación semanales. Implementar técnicas de estudio recomendadas.',
      estado: 'en proceso'
    },
  ];

  // Filtrar estudiantes según búsqueda
  const filteredEstudiantes = estudiantes.filter(estudiante => 
    estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudiante.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estudiante.id.toString().includes(searchTerm)
  );

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'regular':
        return 'success';
      case 'alerta':
        return 'warning';
      case 'critico':
        return 'danger';
      case 'pendiente':
        return 'warning';
      case 'en proceso':
        return 'info';
      case 'completado':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Función para obtener el color de la barra de progreso según el promedio
  const getPromedioBarColor = (promedio: number) => {
    if (promedio >= 4.0) return 'success';
    if (promedio >= 3.0) return 'info';
    if (promedio >= 2.5) return 'warning';
    return 'danger';
  };

  // Función para obtener el color de la barra de progreso según la asistencia
  const getAsistenciaBarColor = (asistencia: number) => {
    if (asistencia >= 90) return 'success';
    if (asistencia >= 80) return 'info';
    if (asistencia >= 70) return 'warning';
    return 'danger';
  };

  // Función para obtener el icono según el tipo de seguimiento
  const getTipoSeguimientoIcon = (tipo: string) => {
    switch (tipo) {
      case 'academico':
        return <FaChartLine className="me-1" />;
      case 'disciplinario':
        return <FaExclamationTriangle className="me-1" />;
      case 'asistencia':
        return <FaCalendarAlt className="me-1" />;
      case 'orientacion':
        return <FaComments className="me-1" />;
      default:
        return <FaFileAlt className="me-1" />;
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Seguimiento Académico</h2>
          <Link to="/nuevo-seguimiento">
            <Button variant="danger">Nuevo Seguimiento</Button>
          </Link>
        </div>

        <Row className="g-4">
          {/* Panel de búsqueda y lista de estudiantes */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Form.Group className="mb-3">
                  <div className="d-flex align-items-center">
                    <FaSearch className="text-muted position-absolute ms-3" />
                    <Form.Control
                      className="ps-5"
                      placeholder="Buscar estudiante..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Estudiantes ({filteredEstudiantes.length})</h6>
                  <Badge bg="primary" pill>{estudiantes.length} total</Badge>
                </div>

                <div className="student-list" style={{maxHeight: '500px', overflowY: 'auto'}}>
                  {filteredEstudiantes.length > 0 ? (
                    filteredEstudiantes.map((estudiante) => (
                      <Card 
                        key={estudiante.id} 
                        className={`mb-2 border-0 ${estudianteSeleccionado?.id === estudiante.id ? 'bg-primary bg-opacity-10' : ''}`}
                        onClick={() => setEstudianteSeleccionado(estudiante)}
                        style={{cursor: 'pointer'}}
                      >
                        <Card.Body className="py-2 px-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="d-flex align-items-center">
                                <FaUserGraduate className="me-2 text-primary" />
                                <div>
                                  <h6 className="mb-0">{estudiante.nombre}</h6>
                                  <small className="text-muted">{estudiante.curso} | ID: {estudiante.id}</small>
                                </div>
                              </div>
                            </div>
                            <Badge bg={getEstadoBadgeColor(estudiante.estado)}>
                              {estudiante.estado.charAt(0).toUpperCase() + estudiante.estado.slice(1)}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted my-4">No se encontraron estudiantes</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Panel de detalles del estudiante seleccionado */}
          <Col lg={8}>
            {estudianteSeleccionado ? (
              <>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h4 className="mb-1">{estudianteSeleccionado.nombre}</h4>
                        <div className="d-flex align-items-center">
                          <Badge bg="secondary" className="me-2">{estudianteSeleccionado.curso}</Badge>
                          <small className="text-muted">ID: {estudianteSeleccionado.id}</small>
                        </div>
                      </div>
                      <Badge 
                        bg={getEstadoBadgeColor(estudianteSeleccionado.estado)}
                        className="fs-6 px-3 py-2"
                      >
                        {estudianteSeleccionado.estado.charAt(0).toUpperCase() + estudianteSeleccionado.estado.slice(1)}
                      </Badge>
                    </div>

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Card className="border-0 bg-light">
                          <Card.Body className="py-2">
                            <small className="text-muted d-block mb-1">Promedio Académico</small>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h5 className="mb-0">{estudianteSeleccionado.promedio.toFixed(1)}</h5>
                              <small className={`text-${getPromedioBarColor(estudianteSeleccionado.promedio)}`}>
                                {estudianteSeleccionado.promedio >= 3.0 ? 'Aprobado' : 'Reprobado'}
                              </small>
                            </div>
                            <ProgressBar 
                              now={estudianteSeleccionado.promedio * 20} 
                              variant={getPromedioBarColor(estudianteSeleccionado.promedio)} 
                            />
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-0 bg-light">
                          <Card.Body className="py-2">
                            <small className="text-muted d-block mb-1">Asistencia</small>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h5 className="mb-0">{estudianteSeleccionado.asistencia}%</h5>
                              <small className={`text-${getAsistenciaBarColor(estudianteSeleccionado.asistencia)}`}>
                                {estudianteSeleccionado.asistencia >= 80 ? 'Regular' : 'Irregular'}
                              </small>
                            </div>
                            <ProgressBar 
                              now={estudianteSeleccionado.asistencia} 
                              variant={getAsistenciaBarColor(estudianteSeleccionado.asistencia)} 
                            />
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {estudianteSeleccionado.materiasCriticas.length > 0 && (
                      <Alert variant="warning" className="mb-3">
                        <div className="d-flex align-items-center">
                          <FaExclamationTriangle className="me-2" />
                          <div>
                            <strong>Materias en riesgo:</strong>{' '}
                            {estudianteSeleccionado.materiasCriticas.join(', ')}
                          </div>
                        </div>
                      </Alert>
                    )}

                    <Tabs
                      activeKey={activeTab}
                      onSelect={(k) => k && setActiveTab(k)}
                      className="mb-3"
                    >
                      <Tab eventKey="general" title="Información General">
                        <Row className="g-3">
                          <Col md={6}>
                            <Card className="border-0 bg-light h-100">
                              <Card.Body>
                                <h6 className="mb-3">Datos Académicos</h6>
                                <div className="mb-2">
                                  <small className="text-muted d-block">Último Seguimiento</small>
                                  <span>{estudianteSeleccionado.ultimoSeguimiento}</span>
                                </div>
                                <div className="mb-2">
                                  <small className="text-muted d-block">Observaciones</small>
                                  <span>{estudianteSeleccionado.observaciones}</span>
                                </div>
                                <div className="mb-2">
                                  <small className="text-muted d-block">Estado General</small>
                                  <Badge bg={getEstadoBadgeColor(estudianteSeleccionado.estado)}>
                                    {estudianteSeleccionado.estado.charAt(0).toUpperCase() + estudianteSeleccionado.estado.slice(1)}
                                  </Badge>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={6}>
                            <Card className="border-0 bg-light h-100">
                              <Card.Body>
                                <h6 className="mb-3">Acciones Rápidas</h6>
                                <div className="d-grid gap-2">
                                  <Button variant="outline-primary" size="sm">
                                    <FaFileAlt className="me-1" /> Ver Reporte Completo
                                  </Button>
                                  <Button variant="outline-success" size="sm">
                                    <FaComments className="me-1" /> Contactar Acudiente
                                  </Button>
                                  <Button variant="outline-warning" size="sm">
                                    <FaEdit className="me-1" /> Registrar Observación
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Tab>
                      <Tab eventKey="seguimientos" title="Historial de Seguimientos">
                        <Table hover responsive className="mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th>Fecha</th>
                              <th>Tipo</th>
                              <th>Descripción</th>
                              <th>Responsable</th>
                              <th>Estado</th>
                              <th className="text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {seguimientosDetalle.map((seguimiento) => (
                              <tr key={seguimiento.id}>
                                <td>{seguimiento.fecha}</td>
                                <td>
                                  <Badge bg="secondary">
                                    {getTipoSeguimientoIcon(seguimiento.tipo)}
                                    {seguimiento.tipo.charAt(0).toUpperCase() + seguimiento.tipo.slice(1)}
                                  </Badge>
                                </td>
                                <td>{seguimiento.descripcion.substring(0, 50)}...</td>
                                <td>{seguimiento.responsable}</td>
                                <td>
                                  <Badge bg={getEstadoBadgeColor(seguimiento.estado)}>
                                    {seguimiento.estado.charAt(0).toUpperCase() + seguimiento.estado.slice(1)}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex justify-content-center gap-2">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      style={{width: '100px'}}
                                    >
                                      <FaEye className="me-1" /> Ver
                                    </Button>
                                    <Button 
                                      variant="warning" 
                                      size="sm"
                                      className="text-white"
                                      style={{width: '100px'}}
                                    >
                                      <FaEdit className="me-1" /> Editar
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Tab>
                      <Tab eventKey="compromisos" title="Compromisos">
                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <h6 className="mb-3">Compromisos Actuales</h6>
                            {seguimientosDetalle.map((seguimiento) => (
                              <div key={seguimiento.id} className="mb-3 pb-3 border-bottom">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <Badge bg="secondary" className="me-2">
                                      {getTipoSeguimientoIcon(seguimiento.tipo)}
                                      {seguimiento.tipo.charAt(0).toUpperCase() + seguimiento.tipo.slice(1)}
                                    </Badge>
                                    <small className="text-muted">{seguimiento.fecha}</small>
                                  </div>
                                  <Badge bg={getEstadoBadgeColor(seguimiento.estado)}>
                                    {seguimiento.estado.charAt(0).toUpperCase() + seguimiento.estado.slice(1)}
                                  </Badge>
                                </div>
                                <p className="mb-1">{seguimiento.compromisos}</p>
                                <small className="text-muted">Responsable: {seguimiento.responsable}</small>
                              </div>
                            ))}
                          </Card.Body>
                        </Card>
                      </Tab>
                    </Tabs>
                  </Card.Body>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column justify-content-center align-items-center py-5">
                  <FaUserGraduate size={50} className="text-muted mb-3" />
                  <h5>Seleccione un estudiante</h5>
                  <p className="text-muted text-center">
                    Seleccione un estudiante de la lista para ver su información detallada y seguimiento académico.
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Seguimiento;
