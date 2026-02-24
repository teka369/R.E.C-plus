import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Badge, Card, Table } from 'react-bootstrap';
import { FaGraduationCap, FaSpinner, FaPlus, FaEdit, FaCheck, FaTimes, FaCalendar, FaFileAlt, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import type { SolicitudRecuperacion, ActividadRecuperacion, NuevaActividadRecuperacion } from '../../../../types/Recuperacion';

interface ActividadesModalProps {
  show: boolean;
  onHide: () => void;
  solicitud: SolicitudRecuperacion | null;
  userRole: string | null;
  onSuccess: () => void;
}

const ActividadesModal: React.FC<ActividadesModalProps> = ({
  show,
  onHide,
  solicitud,
  userRole,
  onSuccess
}) => {
  const [actividades, setActividades] = useState<ActividadRecuperacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNuevaActividad, setShowNuevaActividad] = useState(false);
  // 1. Cambia el estado inicial y el formulario para quitar puntaje_maximo y agregar fecha_inicio
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_actividad: 'tarea' as 'tarea' | 'examen' | 'proyecto' | 'trabajo_practico',
    fecha_inicio: '',
    fecha_limite: ''
  });

  // 1. Agregar estados para los modales de detalle y edición
  const [showDetalle, setShowDetalle] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadRecuperacion | null>(null);

  // 1. Agregar estados para edición de campos
  const [editForm, setEditForm] = useState({
    estado: '',
    nota_obtenida: ''
  });

  // 1. Estado para el archivo adjunto
  const [archivo, setArchivo] = useState<File | null>(null);

  // Actualizar editForm cuando se seleccione una actividad para editar
  useEffect(() => {
    if (showEditar && actividadSeleccionada) {
      setEditForm({
        estado: actividadSeleccionada.estado || '',
        nota_obtenida: actividadSeleccionada.nota_obtenida ? String(actividadSeleccionada.nota_obtenida) : ''
      });
    }
  }, [showEditar, actividadSeleccionada]);

  useEffect(() => {
    if (show && solicitud) {
      cargarActividades();
    }
  }, [show, solicitud]);

  const cargarActividades = async () => {
    if (!solicitud) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/api/recuperacion/${solicitud.id}/actividades`);
      setActividades(response.data.data);
    } catch (error: any) {
      console.error('Error al cargar actividades:', error);
      setError('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitud) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('tipo_actividad', formData.tipo_actividad);
      formDataToSend.append('fecha_inicio', formData.fecha_inicio);
      formDataToSend.append('fecha_limite', formData.fecha_limite);
      if (archivo) {
        formDataToSend.append('archivo', archivo);
      }

      const response = await axios.post(
        `http://localhost:4000/api/recuperacion/${solicitud.id}/actividades`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        setSuccess('Actividad creada exitosamente');
        setFormData({
          titulo: '',
          descripcion: '',
          tipo_actividad: 'tarea',
          fecha_inicio: '',
          fecha_limite: ''
        });
        setArchivo(null);
        setShowNuevaActividad(false);
        cargarActividades();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (error: any) {
      console.error('Error al crear actividad:', error);
      setError(error.response?.data?.message || 'Error al crear la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'puntaje_maximo' ? parseInt(value) : value
    }));
  };

  // Handler para cambios en los campos del formulario de edición
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Handler para guardar cambios de la actividad
  const handleGuardarCambios = async () => {
    if (!actividadSeleccionada) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`http://localhost:4000/api/recuperacion/actividades/${actividadSeleccionada.id}`, {
        estado: editForm.estado,
        nota_obtenida: editForm.nota_obtenida !== '' ? Number(editForm.nota_obtenida) : null
      });
      if (response.data.success) {
        setShowEditar(false);
        setActividadSeleccionada(null);
        setSuccess('Actividad actualizada correctamente');
        cargarActividades();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al actualizar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
    } else {
      setArchivo(null);
    }
  };

  const handleEliminarActividad = async (actividad: ActividadRecuperacion) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`http://localhost:4000/api/recuperacion/actividades/${actividad.id}`);
      if (response.data.success) {
        setSuccess('Actividad eliminada correctamente');
        cargarActividades();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(response.data.message || 'Error al eliminar la actividad');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al eliminar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: { bg: 'warning', text: 'Pendiente' },
      en_proceso: { bg: 'info', text: 'En Proceso' },
      completada: { bg: 'success', text: 'Completada' },
      evaluada: { bg: 'primary', text: 'Evaluada' }
    };
    const variant = variants[estado as keyof typeof variants] || { bg: 'secondary', text: estado };
    
    return <Badge bg={variant.bg}>{variant.text}</Badge>;
  };

  const getTipoActividadBadge = (tipo: string) => {
    const variants = {
      tarea: { bg: 'primary', text: 'Tarea' },
      examen: { bg: 'danger', text: 'Examen' },
      proyecto: { bg: 'success', text: 'Proyecto' },
      trabajo_practico: { bg: 'info', text: 'Trabajo Práctico' }
    };
    const variant = variants[tipo as keyof typeof variants] || { bg: 'secondary', text: tipo };
    
    return <Badge bg={variant.bg}>{variant.text}</Badge>;
  };

  // 2. Handlers para abrir los modales
  const handleVerDetalle = (actividad: ActividadRecuperacion) => {
    setActividadSeleccionada(actividad);
    setShowDetalle(true);
  };
  const handleEditarActividad = (actividad: ActividadRecuperacion) => {
    setActividadSeleccionada(actividad);
    setShowEditar(true);
  };

  if (!solicitud) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaGraduationCap className="me-2" />
          Actividades de Recuperación
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Información de la Solicitud</h6>
            {userRole === 'profesor' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowNuevaActividad(true)}
              >
                <FaPlus className="me-2" />
                Nueva Actividad
              </Button>
            )}
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Materia:</strong> {solicitud.materia_nombre}</p>
                <p><strong>Estudiante:</strong> {solicitud.estudiante_nombre}</p>
              </Col>
              <Col md={6}>
                <p><strong>Tipo:</strong> {solicitud.tipo_solicitud === 'recuperacion' ? 'Recuperación' : 'Refuerzo'}</p>
                <p><strong>Estado:</strong> {solicitud.estado}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Lista de Actividades */}
        {loading ? (
          <div className="text-center py-4">
            <FaSpinner className="fa-spin" size={24} />
            <p className="mt-2">Cargando actividades...</p>
          </div>
        ) : actividades.length === 0 ? (
          <div className="text-center py-4">
            <FaGraduationCap size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No hay actividades asignadas</h5>
            <p className="text-muted">
              {userRole === 'profesor' 
                ? 'Crea la primera actividad para el estudiante'
                : 'El profesor aún no ha asignado actividades'
              }
            </p>
            {userRole === 'profesor' && (
              <Button variant="primary" onClick={() => setShowNuevaActividad(true)}>
                <FaPlus className="me-2" />
                Crear Primera Actividad
              </Button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Límite</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((actividad) => (
                  <tr key={actividad.id}>
                    <td>
                      <div>
                        <strong>{actividad.titulo}</strong>
                        <br />
                        <small className="text-muted">{actividad.descripcion}</small>
                      </div>
                    </td>
                    <td>{getTipoActividadBadge(actividad.tipo_actividad)}</td>
                    <td>{getEstadoBadge(actividad.estado)}</td>
                    <td>{actividad.fecha_inicio ? new Date(actividad.fecha_inicio).toLocaleDateString('es-ES') : '-'}</td>
                    <td>{new Date(actividad.fecha_limite).toLocaleDateString('es-ES')}</td>
                    <td>
                      {actividad.nota_obtenida ? (
                        <Badge bg="success">{actividad.nota_obtenida}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleVerDetalle(actividad)}
                        >
                          <FaFileAlt />
                        </Button>
                        {userRole === 'profesor' && (
                          <>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEditarActividad(actividad)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleEliminarActividad(actividad)}
                            >
                              <FaTrash />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Modal para nueva actividad */}
        <Modal show={showNuevaActividad} onHide={() => setShowNuevaActividad(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <FaPlus className="me-2" />
              Nueva Actividad de Recuperación
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleCrearActividad}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Título de la Actividad *</Form.Label>
                    <Form.Control
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      placeholder="Ej: Ejercicios de Álgebra"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Actividad *</Form.Label>
                    <Form.Select
                      name="tipo_actividad"
                      value={formData.tipo_actividad}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="tarea">Tarea</option>
                      <option value="examen">Examen</option>
                      <option value="proyecto">Proyecto</option>
                      <option value="trabajo_practico">Trabajo Práctico</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Descripción *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe detalladamente la actividad..."
                  required
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha de Inicio *</Form.Label>
                    <Form.Control
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha Límite *</Form.Label>
                    <Form.Control
                      type="date"
                      name="fecha_limite"
                      value={formData.fecha_limite}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Archivo Adjunto (opcional)</Form.Label>
                <Form.Control
                  type="file"
                  name="archivo"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png,.zip,.rar"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNuevaActividad(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCrearActividad}
              disabled={loading || !formData.titulo || !formData.descripcion || !formData.fecha_limite}
            >
              {loading ? (
                <>
                  <FaSpinner className="fa-spin me-2" />
                  Creando...
                </>
              ) : (
                <>
                  <FaPlus className="me-2" />
                  Crear Actividad
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 4. Agregar los modales de detalle y edición al final del Modal.Body */}
        {showDetalle && actividadSeleccionada && (
          <Modal show={showDetalle} onHide={() => setShowDetalle(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Detalle de Actividad</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p><strong>Título:</strong> {actividadSeleccionada.titulo}</p>
              <p><strong>Descripción:</strong> {actividadSeleccionada.descripcion}</p>
              <p><strong>Tipo:</strong> {getTipoActividadBadge(actividadSeleccionada.tipo_actividad)}</p>
              <p><strong>Estado:</strong> {getEstadoBadge(actividadSeleccionada.estado)}</p>
              <p><strong>Fecha de Inicio:</strong> {actividadSeleccionada.fecha_inicio ? new Date(actividadSeleccionada.fecha_inicio).toLocaleDateString('es-ES') : '-'}</p>
              <p><strong>Fecha Límite:</strong> {new Date(actividadSeleccionada.fecha_limite).toLocaleDateString('es-ES')}</p>
              <p><strong>Nota mínima para aprobar:</strong> <Badge bg="info">3.5</Badge></p>
              <p><strong>Nota Obtenida:</strong> {actividadSeleccionada.nota_obtenida ?? '-'}</p>
              <p>
                <strong>Archivo Adjunto:</strong>{" "}
                {actividadSeleccionada.archivo_adjunto
                  ? "Hay un archivo disponible para descargar que te proporciono tu profesor."
                  : "No se adjuntó ningún archivo."}
              </p>
              {actividadSeleccionada.archivo_adjunto && (
                <div className="mt-3">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    href={`http://localhost:4000/api/recuperacion/actividades/${actividadSeleccionada.id}/archivo`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Descargar Archivo
                  </Button>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetalle(false)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {showEditar && actividadSeleccionada && (
          <Modal show={showEditar} onHide={() => setShowEditar(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Editar Actividad</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    type="text"
                    value={actividadSeleccionada.titulo}
                    readOnly
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    value={actividadSeleccionada.descripcion}
                    readOnly
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={editForm.estado}
                    onChange={handleEditInputChange}
                    disabled={userRole !== 'profesor'}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completada">Completada</option>
                    <option value="evaluada">Evaluada</option>
                  </Form.Select>
                </Form.Group>
                                  <Form.Group className="mb-3">
                    <Form.Label>Nota Obtenida</Form.Label>
                    <Form.Control
                      type="number"
                      name="nota_obtenida"
                      value={editForm.nota_obtenida}
                      onChange={(e) => setEditForm({ ...editForm, nota_obtenida: e.target.value })}
                      min="0"
                      max="5"
                      step="0.1"
                      disabled={userRole !== 'profesor'}
                    />
                  </Form.Group>
              </Form>
              {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditar(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleGuardarCambios}
                disabled={loading || userRole !== 'profesor'}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ActividadesModal;
