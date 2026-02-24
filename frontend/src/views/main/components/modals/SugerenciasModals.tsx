import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Badge, ListGroup, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faEdit, faTrash, faSave, faTimes, 
  faComment, faReply, faCheckCircle, faTimesCircle,
  faExclamationCircle, faSearch, faThumbsUp, faThumbsDown,
  faUser, faCalendarAlt, faTag, faFlag, faBook, faBuilding, faUsers, faBriefcase
} from '@fortawesome/free-solid-svg-icons';

// Interfaces
export interface Sugerencia {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: 'academica' | 'infraestructura' | 'convivencia' | 'administrativa' | 'otra';
  remitente: string;
  tipoRemitente: 'estudiante' | 'docente' | 'padre' | 'administrativo';
  fecha: string;
  estado: 'pendiente' | 'en revision' | 'implementada' | 'rechazada';
  prioridad: 'baja' | 'media' | 'alta';
  respuesta?: string;
  fechaRespuesta?: string;
  responsableRespuesta?: string;
  votos: {
    positivos: number;
    negativos: number;
  };
}

interface ModalProps {
  show: boolean;
  onHide: () => void;
}

interface SugerenciaModalProps extends ModalProps {
  sugerencia?: Sugerencia;
  onSave?: (sugerencia: Sugerencia) => void;
  onDelete?: (sugerencia: Sugerencia) => void;
}

// Catálogos
const CATEGORIAS = [
  { value: 'academica', label: 'Académica', color: 'primary' },
  { value: 'infraestructura', label: 'Infraestructura', color: 'success' },
  { value: 'convivencia', label: 'Convivencia', color: 'info' },
  { value: 'administrativa', label: 'Administrativa', color: 'secondary' },
  { value: 'otra', label: 'Otra', color: 'dark' }
];

const TIPOS_REMITENTE = [
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'docente', label: 'Docente' },
  { value: 'padre', label: 'Padre de Familia' },
  { value: 'administrativo', label: 'Personal Administrativo' }
];

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'warning', icon: faExclamationCircle },
  { value: 'en revision', label: 'En Revisión', color: 'info', icon: faSearch },
  { value: 'implementada', label: 'Implementada', color: 'success', icon: faCheckCircle },
  { value: 'rechazada', label: 'Rechazada', color: 'danger', icon: faTimesCircle }
];

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'success' },
  { value: 'media', label: 'Media', color: 'warning' },
  { value: 'alta', label: 'Alta', color: 'danger' }
];

// Modal para ver una sugerencia
export const VerSugerenciaModal: React.FC<SugerenciaModalProps> = ({ show, onHide, sugerencia, onSave }) => {
  if (!sugerencia) return null;

  const [respuesta, setRespuesta] = useState('');
  const [responsable, setResponsable] = useState('');
  const [showResponderForm, setShowResponderForm] = useState(false);

  const getEstadoInfo = (estado: string) => {
    const estadoInfo = ESTADOS.find(e => e.value === estado);
    return estadoInfo ? {
      color: estadoInfo.color,
      icon: estadoInfo.icon
    } : { color: 'secondary', icon: faTimes };
  };

  const estadoInfo = getEstadoInfo(sugerencia.estado);

  const handleAprobar = () => {
    if (onSave && respuesta.trim() && responsable.trim()) {
      onSave({
        ...sugerencia,
        estado: 'implementada',
        respuesta: respuesta,
        fechaRespuesta: new Date().toLocaleDateString(),
        responsableRespuesta: responsable
      });
      setRespuesta('');
      setResponsable('');
      setShowResponderForm(false);
      onHide();
    }
  };

  const handleRechazar = () => {
    if (onSave && respuesta.trim() && responsable.trim()) {
      onSave({
        ...sugerencia,
        estado: 'rechazada',
        respuesta: respuesta,
        fechaRespuesta: new Date().toLocaleDateString(),
        responsableRespuesta: responsable
      });
      setRespuesta('');
      setResponsable('');
      setShowResponderForm(false);
      onHide();
    }
  };

  const handleVoto = (tipo: 'positivo' | 'negativo') => {
    if (!onSave) return;

    const nuevosVotos = { ...sugerencia.votos };
    
    if (tipo === 'positivo') {
      nuevosVotos.positivos += 1;
    } else {
      nuevosVotos.negativos += 1;
    }

    onSave({
      ...sugerencia,
      votos: nuevosVotos
    });
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'academica':
        return faBook;
      case 'infraestructura':
        return faBuilding;
      case 'convivencia':
        return faUsers;
      case 'administrativa':
        return faBriefcase;
      default:
        return faTag;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
          Sugerencia #{sugerencia.id}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={8}>
            <h5 className="mb-3">{sugerencia.titulo}</h5>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Badge bg={CATEGORIAS.find(c => c.value === sugerencia.categoria)?.color}>
                <FontAwesomeIcon icon={getCategoriaIcon(sugerencia.categoria)} className="me-1" />
                {sugerencia.categoria.charAt(0).toUpperCase() + sugerencia.categoria.slice(1)}
              </Badge>
              <Badge bg={PRIORIDADES.find(p => p.value === sugerencia.prioridad)?.color}>
                Prioridad: {sugerencia.prioridad.charAt(0).toUpperCase() + sugerencia.prioridad.slice(1)}
              </Badge>
              <Badge bg="secondary">
                <FontAwesomeIcon icon={faUser} className="me-1" />
                {sugerencia.tipoRemitente.charAt(0).toUpperCase() + sugerencia.tipoRemitente.slice(1)}
              </Badge>
            </div>
          </Col>
          <Col md={4} className="text-end">
            <Badge bg={estadoInfo.color} className="fs-6 py-2 px-3">
              <FontAwesomeIcon icon={estadoInfo.icon} className="me-2" />
              {sugerencia.estado.charAt(0).toUpperCase() + sugerencia.estado.slice(1)}
            </Badge>
          </Col>
        </Row>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <p className="mb-0">{sugerencia.descripcion}</p>
          </Card.Body>
          <Card.Footer className="bg-light border-top-0">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <FontAwesomeIcon icon={faUser} className="me-1" />
                Remitente: {sugerencia.remitente}
              </small>
              <small className="text-muted">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                Fecha: {sugerencia.fecha}
              </small>
            </div>
          </Card.Footer>
        </Card>

        {sugerencia.respuesta && (
          <div className="mb-4">
            <h6 className="mb-2">
              <FontAwesomeIcon icon={faReply} className="me-1" /> Respuesta
            </h6>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <p className="mb-0">{sugerencia.respuesta}</p>
              </Card.Body>
              <Card.Footer className="bg-light border-top-0">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faUser} className="me-1" />
                    Responsable: {sugerencia.responsableRespuesta}
                  </small>
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                    Fecha: {sugerencia.fechaRespuesta}
                  </small>
                </div>
              </Card.Footer>
            </Card>
          </div>
        )}

        <div className="d-flex align-items-center mb-3">
          <h6 className="mb-0 me-3">Votos:</h6>
          <Button 
            variant="outline-success" 
            size="sm" 
            className="me-2"
            onClick={() => handleVoto('positivo')}
            disabled={!onSave}
          >
            <FontAwesomeIcon icon={faThumbsUp} className="me-1" /> {sugerencia.votos.positivos}
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => handleVoto('negativo')}
            disabled={!onSave}
          >
            <FontAwesomeIcon icon={faThumbsDown} className="me-1" /> {sugerencia.votos.negativos}
          </Button>
        </div>

        {(sugerencia.estado === 'pendiente' || sugerencia.estado === 'en revision') && onSave && !showResponderForm && (
          <div className="d-flex gap-2 mt-4">
            <Button 
              variant="primary" 
              onClick={() => setShowResponderForm(true)}
            >
              <FontAwesomeIcon icon={faReply} className="me-1" /> Responder
            </Button>
          </div>
        )}

        {showResponderForm && (
          <Card className="border-0 shadow-sm mt-4">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Responder a esta sugerencia</h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Responsable</Form.Label>
                  <Form.Control
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre del responsable"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Respuesta</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escriba su respuesta aquí..."
                    required
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button 
                    variant="success" 
                    disabled={!respuesta.trim() || !responsable.trim()}
                    onClick={handleAprobar}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Aprobar e Implementar
                  </Button>
                  <Button 
                    variant="danger"
                    disabled={!respuesta.trim() || !responsable.trim()}
                    onClick={handleRechazar}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} className="me-1" /> Rechazar
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => setShowResponderForm(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Modal para editar o crear una sugerencia
export const EditarSugerenciaModal: React.FC<SugerenciaModalProps> = ({ show, onHide, sugerencia, onSave }) => {
  const [formData, setFormData] = useState<Sugerencia>({
    id: 0,
    titulo: '',
    descripcion: '',
    categoria: 'academica',
    remitente: '',
    tipoRemitente: 'estudiante',
    fecha: new Date().toLocaleDateString(),
    estado: 'pendiente',
    prioridad: 'media',
    votos: {
      positivos: 0,
      negativos: 0
    }
  });

  const [errors, setErrors] = useState({
    titulo: '',
    descripcion: '',
    remitente: ''
  });

  React.useEffect(() => {
    if (sugerencia) {
      setFormData(sugerencia);
    } else {
      setFormData({
        id: Math.floor(Math.random() * 10000) + 1000,
        titulo: '',
        descripcion: '',
        categoria: 'academica',
        remitente: '',
        tipoRemitente: 'estudiante',
        fecha: new Date().toLocaleDateString(),
        estado: 'pendiente',
        prioridad: 'media',
        votos: {
          positivos: 0,
          negativos: 0
        }
      });
    }
    // Limpiar errores cuando se abre el modal
    setErrors({
      titulo: '',
      descripcion: '',
      remitente: ''
    });
  }, [sugerencia, show]);

  const validateForm = () => {
    const newErrors = {
      titulo: '',
      descripcion: '',
      remitente: ''
    };
    let isValid = true;

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
      isValid = false;
    } else if (formData.titulo.length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres';
      isValid = false;
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
      isValid = false;
    } else if (formData.descripcion.length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
      isValid = false;
    }

    if (!formData.remitente.trim()) {
      newErrors.remitente = 'El remitente es obligatorio';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (onSave) {
      // Asegurarse de que la respuesta y campos relacionados estén presentes cuando corresponda
      if (formData.estado === 'implementada' || formData.estado === 'rechazada') {
        if (!formData.respuesta) {
          setFormData({
            ...formData,
            respuesta: 'Pendiente de detalles',
            fechaRespuesta: new Date().toLocaleDateString(),
            responsableRespuesta: 'Sistema'
          });
          return;
        }
      }

      onSave(formData);
    }
    onHide();
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'academica':
        return faBook;
      case 'infraestructura':
        return faBuilding;
      case 'convivencia':
        return faUsers;
      case 'administrativa':
        return faBriefcase;
      default:
        return faTag;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="bg-light" closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
            {sugerencia ? 'Editar Sugerencia' : 'Nueva Sugerencia'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faTag} className="me-1 text-primary" />
                  Título <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  isInvalid={!!errors.titulo}
                  placeholder="Ingrese un título descriptivo"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.titulo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faFlag} className="me-1 text-primary" />
                  Prioridad
                </Form.Label>
                <div className="d-flex">
                  {PRIORIDADES.map((prioridad) => (
                    <Form.Check
                      key={prioridad.value}
                      type="radio"
                      id={`prioridad-${prioridad.value}`}
                      label={
                        <Badge bg={prioridad.color} className="ms-1">{prioridad.label}</Badge>
                      }
                      name="prioridad"
                      className="me-3"
                      checked={formData.prioridad === prioridad.value}
                      onChange={() => setFormData({...formData, prioridad: prioridad.value as Sugerencia['prioridad']})}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faComment} className="me-1 text-primary" />
              Descripción <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              isInvalid={!!errors.descripcion}
              placeholder="Describa detalladamente su sugerencia"
            />
            <Form.Control.Feedback type="invalid">
              {errors.descripcion}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Sea específico y claro en su descripción para facilitar la comprensión de su propuesta.
            </Form.Text>
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faTag} className="me-1 text-primary" />
                  Categoría
                </Form.Label>
                <div className="mb-3">
                  {CATEGORIAS.map((categoria) => (
                    <Button
                      key={categoria.value}
                      variant={formData.categoria === categoria.value ? categoria.color : 'outline-secondary'}
                      className="me-2 mb-2"
                      onClick={() => setFormData({...formData, categoria: categoria.value as Sugerencia['categoria']})}
                      type="button"
                    >
                      <FontAwesomeIcon icon={getCategoriaIcon(categoria.value)} className="me-1" />
                      {categoria.label}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faUser} className="me-1 text-primary" />
                  Tipo de Remitente
                </Form.Label>
                <Form.Select
                  value={formData.tipoRemitente}
                  onChange={(e) => setFormData({...formData, tipoRemitente: e.target.value as Sugerencia['tipoRemitente']})}
                >
                  {TIPOS_REMITENTE.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faUser} className="me-1 text-primary" />
                  Remitente <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.remitente}
                  onChange={(e) => setFormData({...formData, remitente: e.target.value})}
                  isInvalid={!!errors.remitente}
                  placeholder="Nombre del remitente"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.remitente}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faExclamationCircle} className="me-1 text-primary" />
                  Estado
                </Form.Label>
                <Form.Select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value as Sugerencia['estado']})}
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {(formData.estado === 'implementada' || formData.estado === 'rechazada') && (
            <Card className="border-0 shadow-sm mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <FontAwesomeIcon icon={faReply} className="me-1" /> Información de Respuesta
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Responsable</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.responsableRespuesta || ''}
                        onChange={(e) => setFormData({...formData, responsableRespuesta: e.target.value})}
                        placeholder="Nombre del responsable"
                        required={formData.estado === 'implementada' || formData.estado === 'rechazada'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Respuesta</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.fechaRespuesta || new Date().toLocaleDateString()}
                        onChange={(e) => setFormData({...formData, fechaRespuesta: e.target.value})}
                        placeholder="DD/MM/AAAA"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group>
                  <Form.Label>Respuesta</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.respuesta || ''}
                    onChange={(e) => setFormData({...formData, respuesta: e.target.value})}
                    placeholder="Escriba la respuesta a la sugerencia"
                    required={formData.estado === 'implementada' || formData.estado === 'rechazada'}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
          </Button>
          <Button variant="primary" type="submit">
            <FontAwesomeIcon icon={faSave} className="me-1" /> Guardar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Modal para eliminar una sugerencia
export const EliminarSugerenciaModal: React.FC<SugerenciaModalProps> = ({ show, onHide, sugerencia, onDelete }) => {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (sugerencia && onDelete) {
      onDelete(sugerencia);
    }
    setConfirmText('');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faTrash} className="me-2 text-danger" />
          Eliminar Sugerencia
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>¿Está seguro que desea eliminar esta sugerencia?</p>
        <p className="text-muted">
          Esta acción no se puede deshacer. Por favor, escriba "ELIMINAR" para confirmar.
        </p>
        <Form.Control
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Escriba ELIMINAR para confirmar"
        />
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm}
          disabled={confirmText !== 'ELIMINAR'}
        >
          <FontAwesomeIcon icon={faTrash} className="me-1" /> Eliminar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Hook personalizado para gestionar los modales
export const useSugerenciaModals = () => {
  const [showVer, setShowVer] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [sugerenciaSeleccionada, setSugerenciaSeleccionada] = useState<Sugerencia | undefined>();
  const [onSaveCallback, setOnSaveCallback] = useState<((sugerencia: Sugerencia) => void) | undefined>();
  const [onDeleteCallback, setOnDeleteCallback] = useState<((sugerencia: Sugerencia) => void) | undefined>();

  // Función para limpiar el estado al cerrar los modales
  const limpiarEstado = () => {
    setSugerenciaSeleccionada(undefined);
    setOnSaveCallback(undefined);
    setOnDeleteCallback(undefined);
  };

  const handleViewSugerencia = (sugerencia: Sugerencia, onSave?: (sugerencia: Sugerencia) => void) => {
    // Asegurar que siempre tengamos una copia fresca de la sugerencia
    setSugerenciaSeleccionada({...sugerencia});
    
    if (onSave) {
      setOnSaveCallback(() => onSave);
    }
    
    setShowVer(true);
  };

  const handleEditSugerencia = (sugerencia: Sugerencia | null, onSave?: (sugerencia: Sugerencia) => void) => {
    if (sugerencia) {
      setSugerenciaSeleccionada({...sugerencia});
    } else {
      setSugerenciaSeleccionada(undefined);
    }
    
    if (onSave) {
      setOnSaveCallback(() => onSave);
    }
    
    setShowEditar(true);
  };

  const handleDeleteSugerencia = (sugerencia: Sugerencia, onDelete?: (sugerencia: Sugerencia) => void) => {
    setSugerenciaSeleccionada({...sugerencia});
    setShowEliminar(true);
    
    if (onDelete) {
      setOnDeleteCallback(() => onDelete);
    }
  };

  const handleSaveSugerencia = (sugerencia: Sugerencia) => {
    if (onSaveCallback) {
      onSaveCallback(sugerencia);
    }
    setShowEditar(false);
  };

  const handleConfirmDelete = (sugerencia: Sugerencia) => {
    if (onDeleteCallback && sugerenciaSeleccionada) {
      onDeleteCallback(sugerenciaSeleccionada);
    }
    setShowEliminar(false);
  };

  const modals = (
    <>
      <VerSugerenciaModal
        show={showVer}
        onHide={() => {
          setShowVer(false);
          limpiarEstado();
        }}
        sugerencia={sugerenciaSeleccionada}
        onSave={onSaveCallback}
      />
      <EditarSugerenciaModal
        show={showEditar}
        onHide={() => {
          setShowEditar(false);
          limpiarEstado();
        }}
        sugerencia={sugerenciaSeleccionada}
        onSave={handleSaveSugerencia}
      />
      <EliminarSugerenciaModal
        show={showEliminar}
        onHide={() => {
          setShowEliminar(false);
          limpiarEstado();
        }}
        sugerencia={sugerenciaSeleccionada}
        onDelete={handleConfirmDelete}
      />
    </>
  );

  return {
    modals,
    handleViewSugerencia,
    handleEditSugerencia,
    handleDeleteSugerencia
  };
};
