import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faVideo, faFilePdf, faFileAlt, faDownload, 
  faEye, faTrash, faSave, faTimes, faEdit, faPlus, 
  faInfoCircle, faUser, faCalendarAlt, faLink, faImage 
} from '@fortawesome/free-solid-svg-icons';

// Interfaces
interface Material {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: 'libro' | 'video' | 'documento' | 'presentacion';
  materia_id: number;
  materia_nombre: string;
  autor: string;
  fecha_publicacion: string;
  descargas: number;
  vistas: number;
  imagen: string;
  enlace: string;
  profesor_id: number;
  profesor_nombre: string;
  profesor_apellido: string;
  grados: string; // This is a comma-separated string from backend
}

interface ModalProps {
  show: boolean;
  onHide: () => void;
}

interface MateriaItem {
  id: number;
  nombre: string;
}

interface GrupoItem {
  id: number;
  nombre: string;
}

// Represents the data sent to the backend when creating/updating a material
interface MaterialBackendPayload {
  titulo: string;
  descripcion: string;
  tipo: 'libro' | 'video' | 'documento' | 'presentacion';
  materia_id: number;
  autor: string;
  imagen: string;
  enlace: string;
  fecha_publicacion: string; // Backend expects this format
  grupos: number[]; // Array of group IDs
}

// Represents the data held in the frontend form state
interface MaterialFormState {
  titulo: string;
  descripcion: string;
  tipo: 'libro' | 'video' | 'documento' | 'presentacion';
  materia_id: number;
  autor: string;
  imagen: string;
  enlace: string;
  fechaPublicacion: string; // Frontend form field for date, e.g., 'YYYY-MM-DD'
  grupos: number[];
}

interface MaterialModalProps extends ModalProps {
  material?: Material | null;
  onSave?: (material: MaterialBackendPayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  materias?: MateriaItem[];
  currentGrado?: string;
  grupos?: GrupoOption[];
}

interface GrupoOption {
  id: number;
  nombre: string;
}

// Catálogos
const TIPOS_MATERIAL = [
  { value: 'libro', label: 'Libro', icon: faBook, color: 'primary' },
  { value: 'video', label: 'Video', icon: faVideo, color: 'danger' },
  { value: 'documento', label: 'Documento', icon: faFilePdf, color: 'success' },
  { value: 'presentacion', label: 'Presentación', icon: faFileAlt, color: 'warning' }
];

// Opciones de Grupos
const GRUPOS_OPTIONS: GrupoOption[] = [
  { id: 1, nombre: '6-1' },
  { id: 2, nombre: '6-2' },
  { id: 3, nombre: '6-3' },
  { id: 4, nombre: '7-1' },
  { id: 5, nombre: '7-2' },
  { id: 6, nombre: '7-3' },
  { id: 7, nombre: '8-1' },
  { id: 8, nombre: '8-2' },
  { id: 9, nombre: '8-3' },
  { id: 10, nombre: '9-1' },
  { id: 11, nombre: '9-2' },
  { id: 12, nombre: '9-3' },
  { id: 13, nombre: '10-1' },
  { id: 14, nombre: '10-2' },
  { id: 15, nombre: '10-3' },
  { id: 16, nombre: '11-1' },
  { id: 17, nombre: '11-2' },
  { id: 18, nombre: '11-3' }
];

// Funciones de utilidad
const getTipoIcon = (tipo: string) => {
  const tipoInfo = TIPOS_MATERIAL.find(t => t.value === tipo);
  return tipoInfo ? <FontAwesomeIcon icon={tipoInfo.icon} className="me-2" /> : null;
};

const getTipoColor = (tipo: string) => {
  return TIPOS_MATERIAL.find(t => t.value === tipo)?.color || 'secondary';
};

const getTipoLabel = (tipo: string) => {
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
};

// Modal para ver un material
export const VerMaterialModal: React.FC<MaterialModalProps> = ({ show, onHide, material }) => {
  if (!material) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
          Detalles del Material
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <img 
            src={material.imagen || `https://via.placeholder.com/400x200?text=${material.tipo}`} 
            alt={material.titulo}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: '200px' }}
          />
        </div>

        <Row className="mb-4">
          <Col md={6}>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                  Título
                </div>
                <div className="fw-bold">{material.titulo}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  Autor
                </div>
                <div className="fw-bold">{material.autor}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                  Fecha de publicación
                </div>
                <div className="fw-bold">{new Date(material.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  Profesor
                </div>
                <div className="fw-bold">{material.profesor_nombre}</div>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={6}>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                  Materia
                </div>
                <div className="fw-bold">{material.materia_nombre}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
                  Vistas
                </div>
                <div className="fw-bold">{material.vistas}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faDownload} className="me-2 text-primary" />
                  Descargas
                </div>
                <div className="fw-bold">{material.descargas}</div>
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>

        <div className="border rounded p-3">
          <h6 className="mb-3">Tipo de Material</h6>
          <Badge bg={getTipoColor(material.tipo)} className="mb-3">
            {getTipoIcon(material.tipo)}
            {getTipoLabel(material.tipo)}
          </Badge>

          <h6 className="mb-3">Descripción</h6>
          <p className="mb-3">{material.descripcion}</p>

          <h6 className="mb-3">Enlace</h6>
          <p className="mb-0">
            <a href={material.enlace} target="_blank" rel="noopener noreferrer" className="text-break">
              <FontAwesomeIcon icon={faLink} className="me-2" />
              {material.enlace}
            </a>
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cerrar
        </Button>
        <Button 
          variant="primary" 
          as="a"
          href={material.enlace}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faEye} className="me-1" /> Ver Material
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Modal para editar o crear un material
export const EditarMaterialModal: React.FC<MaterialModalProps> = ({ 
  show, 
  onHide, 
  material, 
  onSave, 
  materias = [], 
  currentGrado,
  grupos = []
}) => {
  const [formData, setFormData] = useState<MaterialFormState>({
    titulo: '',
    descripcion: '',
    tipo: 'documento',
    materia_id: 0,
    autor: '',
    fechaPublicacion: new Date().toISOString().split('T')[0],
    imagen: '',
    enlace: '',
    grupos: [],
  });

  // Actualizar el formulario cuando cambia el material o se muestra el modal
  useEffect(() => {
    if (material && show) {
      console.log("Cargando material para editar:", material);
      setFormData({
        titulo: material.titulo,
        descripcion: material.descripcion,
        tipo: material.tipo,
        materia_id: material.materia_id,
        autor: material.autor,
        fechaPublicacion: material.fecha_publicacion,
        imagen: material.imagen,
        enlace: material.enlace,
        grupos: material.grados ? material.grados.split(',').map((g: string) => {
          const parts = g.trim().split('-');
          return parseInt(parts[0]);
        }).filter((id: number) => !isNaN(id)) : [],
      });
    } else if (show && !material) {
      console.log("Configurando formulario para nuevo material");
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'documento',
        materia_id: 0,
        autor: '',
        fechaPublicacion: new Date().toISOString().split('T')[0],
        imagen: '',
        enlace: '',
        grupos: [],
      });
    }
  }, [material, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data for backend
    const payload: MaterialBackendPayload = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      materia_id: formData.materia_id,
      autor: formData.autor,
      imagen: formData.imagen,
      enlace: formData.enlace,
      fecha_publicacion: formData.fechaPublicacion,
      grupos: formData.grupos,
    };

    console.log("Enviando formulario con datos:", payload);

    if (onSave) {
      await onSave(payload);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="bg-light" closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
            {material ? 'Editar Material' : 'Nuevo Material'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={8}>
              <div className="p-3 border rounded mb-3 bg-light">
                <h5 className="mb-3 border-bottom pb-2">Información del Material</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                    Título
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                    Descripción
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    name="descripcion"
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    required
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                        Materia
                      </Form.Label>
                      <Form.Select
                        name="materia_id"
                        value={formData.materia_id}
                        onChange={(e) => {
                          const selectedId = parseInt(e.target.value);
                          setFormData({...formData, materia_id: isNaN(selectedId) ? 0 : selectedId});
                        }}
                        required
                      >
                        <option value="">Selecciona una materia</option>
                        {materias.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                        Autor
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="autor"
                        value={formData.autor}
                        onChange={(e) => setFormData({...formData, autor: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faImage} className="me-2 text-primary" />
                    URL de la Imagen (opcional)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="imagen"
                    value={formData.imagen}
                    onChange={(e) => setFormData({...formData, imagen: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faLink} className="me-2 text-primary" />
                    Enlace del Material
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="enlace"
                    value={formData.enlace}
                    onChange={(e) => setFormData({...formData, enlace: e.target.value})}
                    required
                  />
                </Form.Group>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-3 border rounded mb-3 bg-light">
                <h5 className="mb-3 border-bottom pb-2">Detalles Adicionales</h5>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                    Tipo de Material
                  </Form.Label>
                  <Form.Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as 'libro' | 'video' | 'documento' | 'presentacion'})}
                    required
                  >
                    {TIPOS_MATERIAL.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    Fecha de Publicación
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaPublicacion"
                    value={formData.fechaPublicacion}
                    onChange={(e) => setFormData({...formData, fechaPublicacion: e.target.value})}
                    required
                  />
                </Form.Group>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
          </Button>
          <Button variant="primary" type="submit">
            <FontAwesomeIcon icon={faSave} className="me-1" /> {material ? 'Guardar Cambios' : 'Crear Material'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Modal para eliminar un material
export const EliminarMaterialModal: React.FC<MaterialModalProps> = ({ show, onHide, material, onDelete }) => {
  if (!material) return null; // Handle null material

  const handleConfirm = async () => {
    if (onDelete && material) {
      await onDelete(material.id);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faTrash} className="me-2 text-danger" />
          Confirmar Eliminación
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>¿Estás seguro de que quieres eliminar el material "{material.titulo}"?</p>
        <small className="text-muted">Esta acción no se puede deshacer.</small>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          <FontAwesomeIcon icon={faTrash} className="me-1" /> Eliminar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export const useMaterialModals = () => {
  // This hook seems to be unused or its usage is not provided in the current context.
  // Keeping it as is, but it might need adjustments if it's meant to manage modal states globally.
  // For now, the modals are managed directly in BaseMaterial.tsx.
};
