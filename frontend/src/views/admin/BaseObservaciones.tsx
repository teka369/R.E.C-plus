import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge, Form, InputGroup, Table } from 'react-bootstrap';
import { FaSearch, FaFilter, FaPlus } from 'react-icons/fa';
import { useObservacionModals } from './components/modals/ObservacionesModals';
import axios from 'axios';
import { useProfesorGrupos } from '../../hooks/useProfesorGrupos';
import { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos';
import type { Observacion, Materia } from '../../types/Observacion';
import RecuperacionButton from '../../components/RecuperacionButton';

const Observaciones: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todas');
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [cursos, setCursos] = useState<Materia[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  const { 
    modals, 
    handleViewObservacion, 
    handleEditObservacion, 
    handleDeleteObservacion 
  } = useObservacionModals(materias);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    setUserRole(role);
    setUserId(id);
    setUserName(name);
    setUserEmail(email);
  }, []);

  // Obtener el ID del profesor del localStorage
  const profesorId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null;

  // Usar hooks para obtener grupos según el rol
  const { grupos: gruposProfesor, loading: loadingGruposProfesor, error: errorGruposProfesor } = useProfesorGrupos(profesorId);
  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante, error: errorGruposEstudiante } = useEstudianteGrupos(userEmail);

  // Determinar qué grupos usar según el rol
  let grupos: any[] = [];
  let loadingGrupos = false;
  let errorGrupos: string | null = null;

  if (userRole === 'profesor') {
    grupos = gruposProfesor;
    loadingGrupos = loadingGruposProfesor;
    errorGrupos = errorGruposProfesor;
  } else if (userRole === 'estudiante') {
    grupos = gruposEstudiante;
    loadingGrupos = loadingGruposEstudiante;
    errorGrupos = errorGruposEstudiante;
  }

  // Cargar materias para profesores
  useEffect(() => {
    if (userRole === 'profesor' && userEmail) {
      axios.get(`http://localhost:4000/api/profesores/${userEmail}`)
        .then(res => {
          if (res.data.success) {
            const { materias } = res.data.data;
            setMaterias(materias || []);
          }
        })
        .catch(err => console.error("Error al cargar materias del profesor", err));
    }
  }, [userRole, userEmail]);

  // Seleccionar curso por defecto cuando se cargan los grupos
  useEffect(() => {
    if (grupos.length > 0 && !cursoSeleccionado) {
      setCursoSeleccionado(grupos[0].nombre);
      setCursos(grupos);
    }
  }, [grupos, cursoSeleccionado]);

  useEffect(() => {
    fetchObservaciones();
  }, [cursoSeleccionado]);

  const fetchObservaciones = () => {
    if (cursoSeleccionado) {
      setLoading(true);
      axios.get(`http://localhost:4000/api/observaciones/grupo/${cursoSeleccionado}`)
        .then(res => {
          if (res.data.success) {
            setObservaciones(res.data.data);
          }
        })
        .catch(err => console.error(`Error al cargar observaciones para ${cursoSeleccionado}`, err))
        .finally(() => setLoading(false));
    }
  }

  const filteredObservaciones = observaciones.filter(obs => {
    const matchesSearch = obs.estudiante.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          obs.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          obs.profesor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          obs.asignatura.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todas' || obs.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'positiva':
        return 'success';
      case 'negativa':
        return 'danger';
      case 'informativa':
        return 'info';
      case 'seguimiento':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'atendida':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const handleSaveObservacion = async (observacion: any) => {
    const isNew = !observacion.id;
    const payload = {
      ...observacion,
      profesor_id: userId,
    };

    try {
      if (isNew) {
        await axios.post('http://localhost:4000/api/observaciones', payload);
      } else {
        await axios.put(`http://localhost:4000/api/observaciones/${observacion.id}`, payload);
      }
      fetchObservaciones(); // Recargar datos frescos desde el servidor
    } catch (error) {
      console.error("Error al guardar la observación", error);
    }
  };

  const onDeleteObservacion = async (observacion: Observacion) => {
    try {
      await axios.delete(`http://localhost:4000/api/observaciones/${observacion.id}`);
      fetchObservaciones();
    } catch (error) {
      console.error("Error al eliminar la observación", error);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Observaciones por Curso</h2>
          <div className="d-flex align-items-center gap-3">
            <Form.Select
              value={cursoSeleccionado}
              onChange={(e) => setCursoSeleccionado(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">Seleccione un curso</option>
              {cursos.map(curso => (
                <option key={curso.id} value={curso.nombre}>Grado {curso.nombre}</option>
              ))}
            </Form.Select>
            {userRole === 'profesor' && (
              <Button 
                variant="danger"
                onClick={() => handleEditObservacion(null, handleSaveObservacion, cursoSeleccionado)}
                disabled={!cursoSeleccionado}
              >
                <FaPlus className="me-1" /> Nueva Observación
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-3 mb-4">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por estudiante, profesor, asignatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select 
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="todas">Todos los tipos</option>
                  <option value="positiva">Positivas</option>
                  <option value="negativa">Negativas</option>
                  <option value="informativa">Informativas</option>
                  <option value="seguimiento">Seguimiento</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </div>

        <div className="bg-white rounded shadow-sm overflow-hidden">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Estudiante</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Asignatura</th>
                <th>Profesor</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    Cargando observaciones...
                  </td>
                </tr>
              ) : filteredObservaciones.length > 0 ? (
                filteredObservaciones.map((observacion) => (
                  <tr key={observacion.id}>
                    <td>{observacion.id}</td>
                    <td>{observacion.estudiante}</td>
                    <td>{new Date(observacion.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td>
                      <Badge bg={getTipoBadgeColor(observacion.tipo)}>
                        {observacion.tipo.charAt(0).toUpperCase() + observacion.tipo.slice(1)}
                      </Badge>
                    </td>
                    <td>{observacion.asignatura}</td>
                    <td>{observacion.profesor}</td>
                    <td>
                      <Badge bg={getEstadoBadgeColor(observacion.estado)}>
                        {observacion.estado.charAt(0).toUpperCase() + observacion.estado.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          style={{width: '100px'}}
                          onClick={() => handleViewObservacion(observacion)}
                        >
                          Ver
                        </Button>
                        {userRole === 'profesor' && (
                          <>
                            <Button 
                              variant="warning" 
                              size="sm"
                              className="text-white"
                              style={{width: '100px'}}
                              onClick={() => handleEditObservacion(observacion, handleSaveObservacion, cursoSeleccionado)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              style={{width: '100px'}}
                              onClick={() => handleDeleteObservacion(observacion, onDeleteObservacion)}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No se encontraron observaciones para este curso.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        {modals}
      </Container>
    </div>
  );
};

export default Observaciones;

