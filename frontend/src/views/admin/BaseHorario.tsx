import React, { useState, useEffect } from 'react';
import { Container, Table, Card, Badge, Button, Row, Col, Form, Modal } from 'react-bootstrap';
import {
  ModalAgregar,
  ModalEditar,
  ModalEliminar,
  ModalEliminarHorario
} from './components/modals/HorarioModals';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useProfesorGrupos } from '../../hooks/useProfesorGrupos';
import { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos';
import { Clase, NotaImportante, Materia, Profesor, Grupo } from '../../types/horario';

const Horario: React.FC = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [notasImportantes, setNotasImportantes] = useState<NotaImportante[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [nuevoTituloNota, setNuevoTituloNota] = useState('');
  const [editandoNota, setEditandoNota] = useState<number | null>(null);
  const [notaEditada, setNotaEditada] = useState('');
  const [tituloEditado, setTituloEditado] = useState('');
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profesorId, setProfesorId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);
  const [loadingNotas, setLoadingNotas] = useState(true);
  const [errorNotas, setErrorNotas] = useState<string | null>(null);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [errorMaterias, setErrorMaterias] = useState<string | null>(null);
  const [loadingProfesores, setLoadingProfesores] = useState(true);
  const [errorProfesores, setErrorProfesores] = useState<string | null>(null);

  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [showModalEliminarHorario, setShowModalEliminarHorario] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | undefined>();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const horas = [
    '6:00 - 7:00',
    '7:00 - 8:30',
    '8:30 - 10:00',
    '10:30 - 12:00',
    '12:00 - 13:30',
    '13:30 - 15:00'
  ];
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const [infoHorario, setInfoHorario] = useState({
    director: '',
    aula: '',
    anio: '2024',
  });
  const [editandoInfo, setEditandoInfo] = useState(false);

  const { user, role } = useAuth();
  useEffect(() => {
    const currentRole = role || null;
    const email = (user?.correo as string) || (user?.correo_institucional as string) || null;
    const idValue = typeof user?.id === 'string' ? parseInt(user.id) : (user?.id as number | null);
    setUserRole(currentRole);
    setUserEmail(email);
    if (idValue) setProfesorId(idValue);
  }, [user, role]);

  // Usar hooks para obtener grupos según el rol
  const { grupos: gruposProfesor, loading: loadingGruposProfesor, error: errorGruposProfesor } = useProfesorGrupos(profesorId);
  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante, error: errorGruposEstudiante } = useEstudianteGrupos(userEmail);

  const grupos = userRole === 'profesor' ? gruposProfesor : userRole === 'estudiante' ? gruposEstudiante : [];
  const loadingGrupos = userRole === 'profesor' ? loadingGruposProfesor : loadingGruposEstudiante;
  const errorGrupos = userRole === 'profesor' ? errorGruposProfesor : errorGruposEstudiante;

  useEffect(() => {
    if (grupoSeleccionadoId) {
      fetchHorarios();
      fetchNotasImportantes();
    }
  }, [grupoSeleccionadoId]);

  useEffect(() => {
    fetchMaterias();
    fetchProfesores();
  }, []);

  useEffect(() => {
    const fetchGrupoInfo = async () => {
      if (!grupoSeleccionadoId) return;
      try {
        const response = await api.get(`/horarios/grupos/${grupoSeleccionadoId}/info`);
        if (response.data.success && response.data.data) {
          setInfoHorario({
            director: response.data.data.director || '',
            aula: response.data.data.aula || '',
            anio: response.data.data.anio || '2024',
          });
        } else {
          setInfoHorario({ director: '', aula: '', anio: '2024' });
        }
      } catch {
        setInfoHorario({ director: '', aula: '', anio: '2024' });
      }
    };
    fetchGrupoInfo();
  }, [grupoSeleccionadoId]);

  const getGrupoNombre = (grupoId: number | null) => {
    return grupos.find(grupo => grupo.id === grupoId)?.nombre || '';
  };

  const fetchMaterias = async () => {
    try {
      setLoadingMaterias(true);
      const response = await api.get('/materias');
      if (response.data) {
        setMaterias(response.data);
      } else {
        setErrorMaterias(response.data.message || 'Error al cargar materias');
      }
    } catch (error) {
      console.error('Error fetching materias:', error);
      setErrorMaterias('Error al cargar materias');
    } finally {
      setLoadingMaterias(false);
    }
  };

  const fetchProfesores = async () => {
    try {
      setLoadingProfesores(true);
      const response = await api.get('/profesores');
      if (response.data) {
        setProfesores(response.data);
      } else {
        setErrorProfesores(response.data.message || 'Error al cargar profesores');
      }
    } catch (error) {
      console.error('Error fetching profesores:', error);
      setErrorProfesores('Error al cargar profesores');
    } finally {
      setLoadingProfesores(false);
    }
  };

  const fetchHorarios = async () => {
    if (!grupoSeleccionadoId) {
      setClases([]);
      setLoadingHorarios(false);
      return;
    }

    try {
      setLoadingHorarios(true);
      const response = await api.get(`/horarios/grupos/${grupoSeleccionadoId}/horarios`);
      if (response.data.success) {
        setClases(response.data.data);
      } else {
        setErrorHorarios(response.data.message || 'Error al cargar horarios');
      }
    } catch (error) {
      console.error('Error fetching horarios:', error);
      setErrorHorarios('Error al cargar horarios');
    } finally {
      setLoadingHorarios(false);
    }
  };

  const fetchNotasImportantes = async () => {
    if (!grupoSeleccionadoId) {
      setNotasImportantes([]);
      setLoadingNotas(false);
      return;
    }

    try {
      setLoadingNotas(true);
      const response = await api.get(`/horarios/grupos/${grupoSeleccionadoId}/notas`);
      if (response.data.success) {
        setNotasImportantes(response.data.data);
      } else {
        setErrorNotas(response.data.message || 'Error al cargar notas importantes');
      }
    } catch (error) {
      console.error('Error fetching notas importantes:', error);
      setErrorNotas('Error al cargar notas importantes');
    } finally {
      setLoadingNotas(false);
    }
  };

  const generarOpcionesGrado = () => {
    if (loadingGrupos) return [<option key="loading">Seleccione un grado</option>];
    if (errorGrupos) return [<option key="error">Error al cargar grupos</option>];
    if (grupos.length === 0) return [<option key="no-groups">No hay grupos disponibles</option>];

    if (userRole === 'profesor') {
      return [<option key="select">Seleccionar grado</option>,
        ...grupos.map(grupo => (
          <option key={grupo.id} value={grupo.id}>
            Grado {grupo.nombre}
          </option>
        ))
      ];
    }
    if (userRole === 'estudiante') {
      return [<option key="select">Seleccionar grado</option>,
        ...grupos.map(grupo => (
          <option key={grupo.id} value={grupo.id}>
            Grado {grupo.nombre}
          </option>
        ))
      ];
    }
    return grupos.map(grupo => (
      <option key={grupo.id} value={grupo.id}>
        Grado {grupo.nombre}
      </option>
    ));
  };

  const getClase = (dia: string, hora: string) => {
    return clases.find(clase => clase.dia === dia && clase.hora === hora);
  };

  const handleAgregarClase = async (nuevaClase: Clase) => {
    if (!grupoSeleccionadoId) {
      alert('No se pudo determinar el grupo. Por favor, seleccione un grado.');
      return;
    }
    try {
      const payload = { 
        ...nuevaClase, 
        grupos: [grupoSeleccionadoId]
      };
      const response = await api.post('/horarios', payload);
      if (response.data.success) {
        fetchHorarios();
        setShowModalAgregar(false);
      } else {
        alert(response.data.message || 'Error al agregar clase');
      }
    } catch (error: any) {
      console.error('Error al agregar clase:', error);
      alert(error.response?.data?.message || 'Error al agregar clase');
    }
  };

  const handleEditarClase = async (claseEditada: Clase) => {
    if (!grupoSeleccionadoId || !claseEditada.id) {
      alert('Información incompleta para editar la clase.');
      return;
    }
    try {
      const payload = { 
        ...claseEditada, 
        grupos: [grupoSeleccionadoId]
      };
      const response = await axios.put(`http://localhost:4000/api/horarios/${claseEditada.id}`, payload);
      if (response.data.success) {
        fetchHorarios();
        setShowModalEditar(false);
      } else {
        alert(response.data.message || 'Error al editar clase');
      }
    } catch (error: any) {
      console.error('Error al editar clase:', error);
      alert(error.response?.data?.message || 'Error al editar clase');
    }
  };

  const handleEliminarClase = async () => {
    if (!claseSeleccionada?.id) {
      alert('No se pudo identificar la clase a eliminar.');
      return;
    }
    try {
      const response = await axios.delete(`http://localhost:4000/api/horarios/${claseSeleccionada.id}`);
      if (response.data.success) {
        fetchHorarios();
        setShowModalEliminar(false);
      } else {
        alert(response.data.message || 'Error al eliminar clase');
      }
    } catch (error: any) {
      console.error('Error al eliminar clase:', error);
      alert(error.response?.data?.message || 'Error al eliminar clase');
    }
  };

  const handleAgregarNota = async () => {
    if (!grupoSeleccionadoId) {
      alert('No se pudo determinar el grupo. Por favor, seleccione un grado.');
      return;
    }
    if (nuevaNota.trim() && nuevoTituloNota.trim()) {
      try {
        const payload = {
          titulo: nuevoTituloNota.trim(),
          texto: nuevaNota.trim(),
          tipo: 'general',
          prioridad: 'media',
          grupos: [grupoSeleccionadoId],
          profesor_id: profesorId
        };
        const response = await axios.post('http://localhost:4000/api/horarios/notas', payload);
        if (response.data.success) {
          fetchNotasImportantes();
          setNuevaNota('');
          setNuevoTituloNota('');
        } else {
          alert(response.data.message || 'Error al agregar nota');
        }
      } catch (error: any) {
        console.error('Error al agregar nota:', error);
        alert(error.response?.data?.message || 'Error al agregar nota');
      }
    } else {
      alert('Por favor, complete el título y el texto de la nota.');
    }
  };

  const handleEditarNota = async (id: number) => {
    if (!grupoSeleccionadoId) {
      alert('No se pudo determinar el grupo. Por favor, seleccione un grado.');
      return;
    }
    if (notaEditada.trim() && tituloEditado.trim()) {
      try {
        const payload = {
          titulo: tituloEditado.trim(),
          texto: notaEditada.trim(),
          tipo: 'general',
          prioridad: 'media',
          grupos: [grupoSeleccionadoId]
        };
        const response = await axios.put(`http://localhost:4000/api/horarios/notas/${id}`, payload);
        if (response.data.success) {
          fetchNotasImportantes();
          setEditandoNota(null);
          setNotaEditada('');
          setTituloEditado('');
        } else {
          alert(response.data.message || 'Error al editar nota');
        }
      } catch (error: any) {
        console.error('Error al editar nota:', error);
        alert(error.response?.data?.message || 'Error al editar nota');
      }
    } else {
      alert('Por favor, complete el título y el texto de la nota.');
    }
  };

  const handleEliminarNota = async (id: number) => {
    try {
      const response = await axios.delete(`http://localhost:4000/api/horarios/notas/${id}`);
      if (response.data.success) {
        fetchNotasImportantes();
      } else {
        alert(response.data.message || 'Error al eliminar nota');
      }
    } catch (error: any) {
      console.error('Error al eliminar nota:', error);
      alert(error.response?.data?.message || 'Error al eliminar nota');
    }
  };

  const handleEliminarHorario = async () => {
    if (!grupoSeleccionadoId) {
      alert('No se pudo determinar el grupo. Por favor, seleccione un grado para eliminar su horario.');
      return;
    }
    try {
      const response = await axios.delete(`http://localhost:4000/api/horarios/grupos/${grupoSeleccionadoId}/horarios`);
      if (response.data.success) {
        fetchHorarios();
        setShowModalEliminarHorario(false);
      } else {
        alert(response.data.message || 'Error al eliminar horario');
      }
    } catch (error: any) {
      console.error('Error al eliminar horario:', error);
      alert(error.response?.data?.message || 'Error al eliminar horario');
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'danger';
      case 'alta': return 'warning';
      case 'media': return 'info';
      case 'baja': return 'success';
      default: return 'secondary';
    }
  };

  const handleGuardarInfo = async () => {
    if (!grupoSeleccionadoId) return;
    try {
      await axios.put(`http://localhost:4000/api/horarios/grupos/${grupoSeleccionadoId}/info`, infoHorario);
      setEditandoInfo(false);
    } catch {
      alert('Error al guardar la información del horario');
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Horario de Clases</h2>
          <div className="d-flex gap-3">
            <Form.Select
              value={grupoSeleccionadoId ?? ''}
              onChange={(e) => setGrupoSeleccionadoId(Number(e.target.value))}
              style={{ width: 'auto' }}
              disabled={loadingGrupos || Boolean(errorGrupos)}
            >
              {generarOpcionesGrado()}
            </Form.Select>
            {userRole === 'profesor' && (
              <Button 
                variant="outline-danger" 
                onClick={() => setShowModalEliminarHorario(true)}
              >
                Eliminar Horario
              </Button>
            )}
          </div>
        </div>

        {/* Información del Horario como subtítulos, solo si hay grupo seleccionado */}
        {grupoSeleccionadoId && (
          <div className="mb-4">
            <hr />
            <div className="d-flex flex-wrap gap-4 align-items-center">
              <div>
                <span className="fw-bold">Director de Grupo:</span> {(() => {
                  const prof = profesores.find(p => p.id?.toString() === infoHorario.director?.toString());
                  return prof ? `${prof.nombre} ${prof.apellido}` : (infoHorario.director || 'No asignado');
                })()}
              </div>
              <div>
                <span className="fw-bold">Aula Principal:</span> {infoHorario.aula || 'No asignada'}
              </div>
              <div>
                <span className="fw-bold">Año Escolar:</span> {infoHorario.anio}
              </div>
              {userRole === 'profesor' && (!infoHorario.director || String(profesorId) === String(infoHorario.director)) && (
                <Button size="sm" variant="outline-primary" onClick={() => setEditandoInfo(true)}>
                  Editar Información
                </Button>
              )}
            </div>
            <hr />
            {editandoInfo && userRole === 'profesor' && (!infoHorario.director || String(profesorId) === String(infoHorario.director)) && (
              <div className="mt-3 mb-2">
                <Form.Group className="mb-2">
                  <Form.Label>Director de Grupo</Form.Label>
                  <Form.Select
                    value={infoHorario.director}
                    onChange={e => setInfoHorario({ ...infoHorario, director: e.target.value })}
                  >
                    <option value="">Seleccione un profesor</option>
                    {profesores
                      .filter(prof => String(prof.id) === String(profesorId))
                      .map(prof => (
                        <option key={prof.id} value={prof.id}>
                          {prof.nombre} {prof.apellido}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Aula Principal</Form.Label>
                  <Form.Control
                    value={infoHorario.aula}
                    onChange={e => setInfoHorario({ ...infoHorario, aula: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Año Escolar</Form.Label>
                  <Form.Control
                    value={infoHorario.anio}
                    onChange={e => setInfoHorario({ ...infoHorario, anio: e.target.value })}
                  />
                </Form.Group>
                <Button size="sm" variant="success" onClick={() => setShowConfirmModal(true)}>Guardar</Button>
                <Button size="sm" variant="secondary" className="ms-2" onClick={() => setEditandoInfo(false)}>Cancelar</Button>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmación para guardar info de grupo */}
        <Modal show={showConfirmModal} onHide={() => { setShowConfirmModal(false); setConfirmText(''); }} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar acción</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>¿Está seguro que este es su grado? Para confirmar, escriba <b>SI ES MI GRADO</b> en el campo de abajo.</p>
            <input
              type="text"
              className="form-control"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Escriba SI ES MI GRADO para confirmar"
              autoFocus
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowConfirmModal(false); setConfirmText(''); }}>Cancelar</Button>
            <Button variant="danger" disabled={confirmText !== 'SI ES MI GRADO'} onClick={() => { setShowConfirmModal(false); setConfirmText(''); handleGuardarInfo(); }}>Confirmar</Button>
          </Modal.Footer>
        </Modal>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              {loadingHorarios || loadingMaterias || loadingProfesores ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><p>Seleccione un grado</p></div>
              ) : errorHorarios || errorMaterias || errorProfesores ? (
                <div className="text-center py-5"><p className="text-danger">Error al cargar datos: {errorHorarios || errorMaterias || errorProfesores}</p></div>
              ) : (
                <Table bordered hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-center" style={{ width: '10%' }}>Día</th>
                      {horas.map((hora, index) => (
                        <th key={index} className="text-center">{hora}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dias.map((dia, diaIndex) => (
                      <tr key={diaIndex}>
                        <td className="text-center align-middle bg-light fw-bold">{dia}</td>
                        {horas.map((hora, horaIndex) => {
                          const clase = getClase(dia, hora);
                          return (
                            <td key={horaIndex} className="p-2">
                              {clase ? (
                                <div className={`p-2 rounded bg-${clase.color} bg-opacity-10 border border-${clase.color} h-100`}>
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <Badge bg={clase.color}>{clase.materia_nombre}</Badge>
                                    {userRole === 'profesor' && String(profesorId) === String(infoHorario.director) && (
                                      <div>
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 me-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setClaseSeleccionada(clase);
                                            setShowModalEditar(true);
                                          }}
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 text-danger"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setClaseSeleccionada(clase);
                                            setShowModalEliminar(true);
                                          }}
                                        >
                                          🗑️
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <small className="d-block text-muted">
                                    {clase.profesor_nombre}<br />
                                    Aula: {clase.aula}
                                  </small>
                                </div>
                              ) : (
                                userRole === 'profesor' && String(profesorId) === String(infoHorario.director) && (
                                  <div 
                                    className="p-2 text-center text-muted"
                                    style={{ cursor: 'pointer', minHeight: '80px' }}
                                    onClick={() => {
                                      setClaseSeleccionada({
                                        materia_id: 0,
                                        profesor_id: 0,
                                        aula: infoHorario.aula || '',
                                        hora: hora,
                                        dia: dia,
                                        color: 'primary'
                                      });
                                      setShowModalAgregar(true);
                                    }}
                                  >
                                    <div className="h-100 d-flex align-items-center justify-content-center">
                                      <span className="text-muted">+ Agregar clase</span>
                                    </div>
                                  </div>
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {clases.length === 0 && !loadingHorarios && !errorHorarios && (
                      <tr>
                        <td colSpan={horas.length + 1} className="text-center py-4 text-muted">
                          No hay clases programadas para este grado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </div>
          </Card.Body>
        </Card>

        <Row className="mt-4">
          {grupoSeleccionadoId && (
            <>
              <Col md={6}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h5 className="mb-3">Notas Importantes</h5>
                    {userRole === 'profesor' && (
                      <div className="mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Título de la nota"
                          value={nuevoTituloNota}
                          onChange={(e) => setNuevoTituloNota(e.target.value)}
                          className="mb-2"
                        />
                        <Form.Control
                          type="text"
                          placeholder="Texto de la nota"
                          value={nuevaNota}
                          onChange={(e) => setNuevaNota(e.target.value)}
                          className="mb-2"
                        />
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={handleAgregarNota}
                        >
                          Agregar Nota
                        </Button>
                      </div>
                    )}
                    {loadingNotas ? (
                      <div className="text-center py-3"><div className="spinner-border text-primary" role="status"></div><p>Cargando notas...</p></div>
                    ) : errorNotas ? (
                      <div className="text-center py-3"><p className="text-danger">{errorNotas}</p></div>
                    ) : notasImportantes.length === 0 ? (
                      <p className="text-muted">No hay notas importantes para este grado.</p>
                    ) : (
                      <ul className="list-unstyled">
                        {notasImportantes.map((nota) => (
                          <li key={nota.id} className="mb-3 p-2 border rounded">
                            {editandoNota === nota.id ? (
                              <>
                                <Form.Control
                                  type="text"
                                  placeholder="Título"
                                  value={tituloEditado}
                                  onChange={(e) => setTituloEditado(e.target.value)}
                                  className="mb-2"
                                />
                                <Form.Control
                                  type="text"
                                  placeholder="Texto"
                                  value={notaEditada}
                                  onChange={(e) => setNotaEditada(e.target.value)}
                                  className="mb-2"
                                />
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleEditarNota(nota.id)}
                                  >
                                    ✓ Guardar
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => {
                                      setEditandoNota(null);
                                      setNotaEditada('');
                                      setTituloEditado('');
                                    }}
                                  >
                                    ✕ Cancelar
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <h6 className="mb-1">{nota.titulo}</h6>
                                  <Badge bg={getPrioridadColor(nota.prioridad)} className="ms-2">
                                    {nota.prioridad}
                                  </Badge>
                                </div>
                                <p className="mb-1 text-muted small">{nota.texto}</p>
                                <small className="text-muted">
                                  {nota.profesor_nombre && `Por: ${nota.profesor_nombre} • `}
                                  {new Date(nota.fecha_creacion).toLocaleDateString('es-ES')}
                                </small>
                                {userRole === 'profesor' && (
                                  <div className="mt-2">
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-primary me-2"
                                      onClick={() => {
                                        setEditandoNota(nota.id);
                                        setNotaEditada(nota.texto);
                                        setTituloEditado(nota.titulo);
                                      }}
                                    >
                                      ✏️ Editar
                                    </Button>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-danger"
                                      onClick={() => handleEliminarNota(nota.id)}
                                    >
                                      🗑️ Eliminar
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}
        </Row>

        <ModalAgregar
          show={showModalAgregar}
          onHide={() => setShowModalAgregar(false)}
          onSave={(clase: Clase) => handleAgregarClase(clase)}
          clase={claseSeleccionada}
          materias={materias}
          profesores={profesores}
          horas={horas}
          dias={dias}
        />

        {claseSeleccionada && (
          <>
            <ModalEditar
              show={showModalEditar}
              onHide={() => setShowModalEditar(false)}
              onSave={(clase: Clase) => handleEditarClase(clase)}
              clase={claseSeleccionada}
              materias={materias}
              profesores={profesores}
              horas={horas}
              dias={dias}
            />

            <ModalEliminar
              show={showModalEliminar}
              onHide={() => setShowModalEliminar(false)}
              onConfirm={handleEliminarClase}
              clase={claseSeleccionada}
            />
          </>
        )}

        <ModalEliminarHorario
          show={showModalEliminarHorario}
          onHide={() => setShowModalEliminarHorario(false)}
          onConfirm={handleEliminarHorario}
        />
      </Container>
    </div>
  );
};

export default Horario;
