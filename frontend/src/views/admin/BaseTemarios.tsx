import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Accordion, Nav, Tab, Tabs, ListGroup, Modal as RBModal, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaBook, FaDownload, FaEye, FaEdit, FaTrash, FaPlus, FaList, FaCalendarAlt, FaFileAlt, FaChalkboardTeacher, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { useTemarioModals, VerTemarioModal, EditarTemarioModal, EliminarTemarioModal } from './components/modals/TemarioModals';
import axios from 'axios';
import { useProfesorGrupos } from '../../hooks/useProfesorGrupos';
import { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos';
import type { Temario, Unidad, Materia } from '../../types/Temario';
import { ASIGNATURAS_CATALOGO } from '../../types/Temario';

import UnidadModal from './components/modals/UnidadModal'; // (crearás este modal para el formulario de unidad)

const Temarios: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsignatura, setFilterAsignatura] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [activeTab, setActiveTab] = useState('lista');
  const [temarios, setTemarios] = useState<Temario[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profesorId, setProfesorId] = useState<number | null>(null);
  const [gradoSeleccionado, setGradoSeleccionado] = useState<number>(0);
  const [materiasProfesor, setMateriasProfesor] = useState<any[]>([]);
  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [unidadEdit, setUnidadEdit] = useState<Unidad | null>(null);
  const [temarioActivo, setTemarioActivo] = useState<Temario | null>(null);
  const [showDeleteTemarioModal, setShowDeleteTemarioModal] = useState(false);
  const [temarioToDelete, setTemarioToDelete] = useState<Temario | null>(null);
  const [showDeleteUnidadModal, setShowDeleteUnidadModal] = useState(false);
  const [unidadToDelete, setUnidadToDelete] = useState<{ id: number, temario: Temario | null } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom hook para gestionar los modales
  const { modals, handleViewTemario, handleEditTemario, handleDeleteTemario, setInitialGradoForNew } = useTemarioModals(materiasProfesor);

  const { grupos: gruposProfesor, loading: loadingGruposProfesor } = useProfesorGrupos(profesorId);
  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante } = useEstudianteGrupos(userEmail);

  const grupos = userRole === 'profesor' ? gruposProfesor : userRole === 'estudiante' ? gruposEstudiante : [];
  const loadingGrupos = userRole === 'profesor' ? loadingGruposProfesor : loadingGruposEstudiante;

  // Inicializar grado seleccionado con el primer grupo disponible (id)
  useEffect(() => {
    if (!gradoSeleccionado && grupos && grupos.length > 0) {
      setGradoSeleccionado(grupos[0].id);
    }
  }, [grupos, gradoSeleccionado]);

  // Efecto para cargar los datos y el rol del usuario
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/api/temarios');
        setTemarios(response.data);
      } catch (error) {
        console.error("Error al cargar los temarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const role = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    setUserRole(role);
    setUserEmail(email);
    if (userId && role === 'profesor') {
      setProfesorId(parseInt(userId));
    } else {
      setProfesorId(null);
    }
  }, []);

  // Obtener materias asignadas al profesor (igual que en Observaciones)
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    if (role === 'profesor' && email) {
      // Consulta la API para obtener las materias del profesor
      axios.get(`http://localhost:4000/api/profesores/${email}`)
        .then(response => {
          if (response.data.success && response.data.data.materias) {
            setMateriasProfesor(response.data.data.materias);
          }
        })
        .catch(error => {
          console.error('Error al obtener materias del profesor:', error);
          setMateriasProfesor([]);
        });
    }
  }, []);

  // Filtrar temarios según búsqueda y filtros
  const filteredTemarios = temarios.filter(temario => {
    const matchesSearch = temario.asignatura.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          temario.profesor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsignatura = filterAsignatura === 'todas' ? true : temario.asignatura === filterAsignatura;
    const matchesEstado = filterEstado === 'todos' ? true : temario.estado === filterEstado;
    return matchesSearch && matchesAsignatura && matchesEstado;
  });

  // 1. Filtrar temarios por el grupo seleccionado (gradoSeleccionado)
  const temariosDelGrupo = filteredTemarios.filter(t => t.grupo_id === gradoSeleccionado);

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'borrador':
        return 'warning';
      case 'archivado':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  // Función para crear un nuevo temario
  const handleCreateTemario = () => {
    if (!gradoSeleccionado) return;
    setInitialGradoForNew(String(gradoSeleccionado));
    handleEditTemario({
      id: 0,
      asignatura: '',
      grupo_id: gradoSeleccionado,
      grupo_nombre: grupos.find(g => g.id === gradoSeleccionado)?.nombre || '',
      profesor: localStorage.getItem('userName') || '',
      periodo: '',
      fechaActualizacion: new Date().toLocaleDateString(),
      estado: 'borrador',
      unidades: []
    }, handleSaveTemario);
  };

  // Función para guardar un temario (nuevo o editado)
  const handleSaveTemario = async (temario: Temario) => {
    try {
      const userId = localStorage.getItem('userId');
      const url = temario.id ? `http://localhost:4000/api/temarios/${temario.id}` : 'http://localhost:4000/api/temarios';
      const grupoNombre = grupos.find(g => g.id === (temario.grupo_id || gradoSeleccionado))?.nombre || '';
      const payload = { ...temario, grupo_id: gradoSeleccionado, profesor_id: userId, grupo_nombre: grupoNombre };
      if (temario.id) {
        await axios.put(url, payload);
      } else {
        await axios.post(url, payload);
      }
      // Recargar los temarios
      const temariosResponse = await axios.get('http://localhost:4000/api/temarios');
      setTemarios(temariosResponse.data);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al guardar el temario');
    }
  };

  // Función para abrir modal de confirmación de eliminación de temario
  const handleAskDeleteTemario = (temario: Temario) => {
    setTemarioToDelete(temario);
    setShowDeleteTemarioModal(true);
  };

  // Función para confirmar eliminación de temario
  const handleConfirmDelete = async (id: number) => {
    setShowDeleteTemarioModal(false);
    try {
      await axios.delete(`http://localhost:4000/api/temarios/${id}`);
      setTemarios(temarios.filter(t => t.id !== id));
      setSuccessMsg('Temario eliminado exitosamente.');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al eliminar el temario');
    }
  };

  // Función para abrir modal de nueva unidad
  const handleAddUnidad = (temario: Temario) => {
    setTemarioActivo(temario);
    setUnidadEdit(null);
    setShowUnidadModal(true);
  };

  // Función para abrir modal de edición de unidad
  const handleEditUnidad = (unidad: Unidad, temario: Temario) => {
    setTemarioActivo(temario);
    setUnidadEdit(unidad);
    setShowUnidadModal(true);
  };

  // Función para eliminar unidad
  const handleDeleteUnidad = async (unidadId: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta unidad?')) return;
    try {
      await axios.delete(`http://localhost:4000/api/temarios/unidades/${unidadId}`);
      // Recargar temarios
      const response = await axios.get('http://localhost:4000/api/temarios');
      setTemarios(response.data);
    } catch (error) {
      alert('Error al eliminar la unidad');
    }
  };

  // Función para abrir modal de confirmación de eliminación de unidad
  const handleAskDeleteUnidad = (unidadId: number, temario: Temario) => {
    setUnidadToDelete({ id: unidadId, temario });
    setShowDeleteUnidadModal(true);
  };

  // Función para confirmar eliminación de unidad
  const handleConfirmDeleteUnidad = async () => {
    if (!unidadToDelete) return;
    setShowDeleteUnidadModal(false);
    try {
      await axios.delete(`http://localhost:4000/api/temarios/unidades/${unidadToDelete.id}`);
      // Recargar temarios
      const response = await axios.get('http://localhost:4000/api/temarios');
      setTemarios(response.data);
      setSuccessMsg('Unidad eliminada exitosamente.');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (error) {
      alert('Error al eliminar la unidad');
    }
  };

  // Guardar unidad (nuevo o editado)
  const handleSaveUnidad = async (unidadData: any) => {
    try {
      if (unidadEdit && unidadEdit.id) {
        // Editar unidad
        await axios.put(`http://localhost:4000/api/temarios/unidades/${unidadEdit.id}`, unidadData);
      } else if (temarioActivo) {
        // Nueva unidad
        await axios.post(`http://localhost:4000/api/temarios/${temarioActivo.id}/unidades`, unidadData);
      }
      // Recargar temarios
      const response = await axios.get('http://localhost:4000/api/temarios');
      setTemarios(response.data);
      setShowUnidadModal(false);
    } catch (error) {
      alert('Error al guardar la unidad');
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Temarios Académicos</h2>
          <div className="d-flex align-items-center gap-3">
            <Form.Select
              value={gradoSeleccionado}
              onChange={(e) => setGradoSeleccionado(Number(e.target.value))}
              style={{ width: 'auto' }}
            >
              {loadingGrupos ? (
                <option>Cargando grupos...</option>
              ) : grupos.length === 0 ? (
                <option>No hay grupos asignados</option>
              ) : (
                grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                ))
              )}
            </Form.Select>
            {userRole === 'profesor' && (
              <Button variant="danger" onClick={handleCreateTemario} disabled={!gradoSeleccionado}>
                <FaPlus className="me-1" /> Nuevo Temario
              </Button>
            )}
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Buscar</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FaSearch />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por asignatura o profesor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Asignatura</Form.Label>
                  <Form.Select
                    value={filterAsignatura}
                    onChange={(e) => setFilterAsignatura(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="todas">Todas las asignaturas</option>
                    {materiasProfesor && materiasProfesor.length > 0
                      ? materiasProfesor.map((asignatura) => (
                          <option key={asignatura.id} value={asignatura.nombre}>{asignatura.nombre}</option>
                        ))
                      : ASIGNATURAS_CATALOGO.map((asignatura) => (
                          <option key={asignatura} value={asignatura}>{asignatura}</option>
                        ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="borrador">Borrador</option>
                    <option value="archivado">Archivado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tabs de visualización */}
        <Tabs
          id="temarios-tabs"
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="lista" title={<span><FaList className="me-2" />Lista de Temarios</span>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="table-responsive">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2">Cargando temarios...</p>
                    </div>
                  ) : temariosDelGrupo.length > 0 ? (
                    <Table striped bordered hover responsive className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Asignatura</th>
                          <th>Grado</th>
                          <th>Profesor</th>
                          <th>Periodo</th>
                          <th>Estado</th>
                          <th>Actualización</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {temariosDelGrupo.map((temario) => (
                          <tr key={temario.id}>
                            <td>{temario.asignatura}</td>
                            <td>{temario.grupo_nombre || temario.grupo_id}</td>
                            <td>{temario.profesor}</td>
                            <td>{temario.periodo}</td>
                            <td>
                              <Badge bg={getEstadoBadgeColor(temario.estado)}>
                                {temario.estado.charAt(0).toUpperCase() + temario.estado.slice(1)}
                              </Badge>
                            </td>
                            <td>{temario.fechaActualizacion}</td>
                            <td className="text-center">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleViewTemario(temario)}
                              >
                                <FaEye /> Ver
                              </Button>
                              {userRole === 'profesor' && (
                                <>
                                  <Button 
                                    variant="warning" 
                                    size="sm" 
                                    className="me-2 text-white"
                                    onClick={() => handleEditTemario(temario, handleSaveTemario)}
                                  >
                                    <FaEdit /> Editar
                                  </Button>
                                  <Button 
                                    variant="danger" 
                                    size="sm"
                                    onClick={() => handleAskDeleteTemario(temario)}
                                  >
                                    <FaTrash /> Eliminar
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted py-4">No se encontraron temarios para este grupo.</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Tab>
          <Tab eventKey="resumen" title={<span><FaBook className="me-2" />Visualización Completa</span>}>
            <Row className="g-4">
              {(() => {
                const grupoActual = grupos.find(g => g.id === gradoSeleccionado);
                const temariosDelGrado = temariosDelGrupo;
                
                if (!grupoActual) {
                  return (
                    <Col md={12}>
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                          <p className="text-muted">Selecciona un grado para ver sus temarios</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                }

                return (
                  <Col md={12}>
                    {temariosDelGrado.length > 0 ? (
                      <Row className="g-4">
                        {temariosDelGrado.map(temario => (
                          <Col md={6} key={temario.id}>
                            <Card className="border-0 shadow-sm h-100">
                              <Card.Header className="bg-light">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h5 className="mb-1">{temario.asignatura}</h5>
                                    <p className="text-muted small mb-0">
                                      Grado {temario.grupo_nombre} • {temario.profesor} • {temario.periodo}
                                    </p>
                                  </div>
                                  <div className="d-flex flex-column align-items-end gap-1">
                                    <Badge bg={getEstadoBadgeColor(temario.estado)}>
                                      {temario.estado.charAt(0).toUpperCase() + temario.estado.slice(1)}
                                    </Badge>
                                    {userRole === 'profesor' && (
                                      <div className="d-flex gap-1">
                                        <Button 
                                          variant="warning" 
                                          size="sm" 
                                          className="text-white"
                                          onClick={() => handleEditTemario(temario, handleSaveTemario)}
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button 
                                          variant="danger" 
                                          size="sm"
                                          onClick={() => handleAskDeleteTemario(temario)}
                                        >
                                          <FaTrash />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card.Header>
                              <Card.Body>
                                <div className="mb-3">
                                  <small className="text-muted">Actualizado: {temario.fechaActualizacion}</small>
                                </div>
                                
                                {temario.unidades && temario.unidades.length > 0 ? (
                                  <div>
                                    <h6 className="mb-3">Unidades Temáticas ({temario.unidades.length})</h6>
                                    <Accordion>
                                      {temario.unidades.map((unidad, index) => (
                                        <Accordion.Item eventKey={index.toString()} key={unidad.id}>
                                          <Accordion.Header>
                                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                              <span className="small">{unidad.titulo}</span>
                                              <Badge bg="info" className="ms-2 small">{unidad.duracion}</Badge>
                                            </div>
                                          </Accordion.Header>
                                          <Accordion.Body className="small">
                                            <p className="text-muted mb-2">{unidad.descripcion}</p>
                                            
                                            <Row>
                                              <Col md={6}>
                                                <h6 className="small">Objetivos</h6>
                                                <ul className="list-unstyled">
                                                  {unidad.objetivos && unidad.objetivos.length > 0 ? (
                                                    unidad.objetivos.slice(0, 3).map((objetivo, i) => (
                                                      <li key={i} className="mb-1">
                                                        <FaCheck className="text-success me-1" />
                                                        {objetivo}
                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="text-muted">Sin objetivos</li>
                                                  )}
                                                  {unidad.objetivos && unidad.objetivos.length > 3 && (
                                                    <li className="text-muted small">+{unidad.objetivos.length - 3} más</li>
                                                  )}
                                                </ul>
                                              </Col>
                                              <Col md={6}>
                                                <h6 className="small">Contenidos</h6>
                                                <ul className="list-unstyled">
                                                  {unidad.contenidos && unidad.contenidos.length > 0 ? (
                                                    unidad.contenidos.slice(0, 3).map((contenido, i) => (
                                                      <li key={i} className="mb-1">
                                                        <FaBook className="text-primary me-1" />
                                                        {contenido}
                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="text-muted">Sin contenidos</li>
                                                  )}
                                                  {unidad.contenidos && unidad.contenidos.length > 3 && (
                                                    <li className="text-muted small">+{unidad.contenidos.length - 3} más</li>
                                                  )}
                                                </ul>
                                              </Col>
                                            </Row>
                                            
                                            <Row className="mt-2">
                                              <Col md={6}>
                                                <h6 className="small">Actividades</h6>
                                                <ul className="list-unstyled">
                                                  {unidad.actividades && unidad.actividades.length > 0 ? (
                                                    unidad.actividades.slice(0, 2).map((actividad, i) => (
                                                      <li key={i} className="mb-1">
                                                        <FaInfoCircle className="text-info me-1" />
                                                        {actividad}
                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="text-muted">Sin actividades</li>
                                                  )}
                                                  {unidad.actividades && unidad.actividades.length > 2 && (
                                                    <li className="text-muted small">+{unidad.actividades.length - 2} más</li>
                                                  )}
                                                </ul>
                                              </Col>
                                              <Col md={6}>
                                                <h6 className="small">Evaluación</h6>
                                                <ul className="list-unstyled">
                                                  {unidad.evaluacion && unidad.evaluacion.length > 0 ? (
                                                    unidad.evaluacion.slice(0, 2).map((evaluacionItem, i) => (
                                                      <li key={i} className="mb-1">
                                                        <FaFileAlt className="text-warning me-1" />
                                                        {evaluacionItem}
                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="text-muted">Sin evaluaciones</li>
                                                  )}
                                                  {unidad.evaluacion && unidad.evaluacion.length > 2 && (
                                                    <li className="text-muted small">+{unidad.evaluacion.length - 2} más</li>
                                                  )}
                                                </ul>
                                              </Col>
                                            </Row>
                                            
                                            {unidad.recursos && unidad.recursos.length > 0 && (
                                              <div className="mt-2">
                                                <h6 className="small">Recursos</h6>
                                                <ul className="list-unstyled">
                                                  {unidad.recursos.slice(0, 2).map((recurso, i) => (
                                                    <li key={i} className="mb-1">
                                                      <FaBook className="text-secondary me-1" />
                                                      {recurso}
                                                    </li>
                                                  ))}
                                                  {unidad.recursos.length > 2 && (
                                                    <li className="text-muted small">+{unidad.recursos.length - 2} más</li>
                                                  )}
                                                </ul>
                                              </div>
                                            )}
                                          </Accordion.Body>
                                        </Accordion.Item>
                                      ))}
                                    </Accordion>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-muted">Este temario no tiene unidades definidas</p>
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                          <p className="text-muted">No hay temarios para el grado {grupoActual.nombre}</p>
                        </Card.Body>
                      </Card>
                    )}
                  </Col>
                );
              })()}
            </Row>
          </Tab>
        </Tabs>

        {/* Modales */}
        {modals}
        {/* Modal para agregar/editar unidad */}
        <UnidadModal
          show={showUnidadModal}
          onHide={() => setShowUnidadModal(false)}
          onSave={handleSaveUnidad}
          unidad={unidadEdit}
        />
        {/* Modal de confirmación de eliminación de temario */}
        <RBModal show={showDeleteTemarioModal} onHide={() => setShowDeleteTemarioModal(false)} centered>
          <RBModal.Header closeButton>
            <RBModal.Title>Confirmar eliminación</RBModal.Title>
          </RBModal.Header>
          <RBModal.Body>
            ¿Estás seguro de que deseas eliminar el temario <b>{temarioToDelete?.asignatura}</b> del grado <b>{temarioToDelete?.grupo_nombre || temarioToDelete?.grupo_id}</b>?<br />Esta acción no se puede deshacer.
          </RBModal.Body>
          <RBModal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteTemarioModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => handleConfirmDelete(temarioToDelete!.id)}>Eliminar</Button>
          </RBModal.Footer>
        </RBModal>
        {/* Modal de confirmación de eliminación de unidad */}
        <RBModal show={showDeleteUnidadModal} onHide={() => setShowDeleteUnidadModal(false)} centered>
          <RBModal.Header closeButton>
            <RBModal.Title>Confirmar eliminación</RBModal.Title>
          </RBModal.Header>
          <RBModal.Body>
            ¿Estás seguro de que deseas eliminar esta unidad/sesión? Esta acción no se puede deshacer.
          </RBModal.Body>
          <RBModal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteUnidadModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmDeleteUnidad}>Eliminar</Button>
          </RBModal.Footer>
        </RBModal>
      </Container>
    </div>
  );
};

export default Temarios;