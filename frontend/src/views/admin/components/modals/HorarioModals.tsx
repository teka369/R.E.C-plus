import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, InputGroup, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faChalkboardTeacher, faDoorOpen, faClock, faCalendarDay, faPalette, faInfoCircle, faTrash, faSave, faTimes, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Materia {
  id: number;
  nombre: string;
}

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
}

interface Clase {
  id?: number;
  materia_id: number;
  profesor_id: number;
  aula: string;
  hora: string;
  dia: string;
  color: string;
  // Propiedades adicionales para mostrar en el frontend, no necesariamente para enviar al backend
  materia_nombre?: string;
  profesor_nombre?: string;
  profesor_apellido?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface ModalProps {
  show: boolean;
  onHide: () => void;
}

interface ModalClaseProps extends ModalProps {
  onSave: (clase: Clase) => Promise<void>; // Cambiado a Promise<void>
  clase?: Clase;
  materias: Materia[]; // Lista de materias para el selector
  profesores: Profesor[]; // Lista de profesores para el selector
  horas: string[]; // Lista de horas disponibles
  dias: string[]; // Lista de días disponibles
}

interface ModalEliminarProps extends ModalProps {
  onConfirm: () => Promise<void>; // Cambiado a Promise<void>
  clase: Clase;
}

// Colores disponibles para las clases
const colores = [
  { nombre: 'primary', label: 'Azul' },
  { nombre: 'secondary', label: 'Gris' },
  { nombre: 'success', label: 'Verde' },
  { nombre: 'danger', label: 'Rojo' },
  { nombre: 'warning', label: 'Amarillo' },
  { nombre: 'info', label: 'Celeste' },
  { nombre: 'dark', label: 'Negro' },
  { nombre: 'indigo', label: 'Índigo' },
  { nombre: 'purple', label: 'Morado' },
  { nombre: 'pink', label: 'Rosa' }
];

// Modal para agregar una nueva clase
export const ModalAgregar: React.FC<ModalClaseProps> = ({ show, onHide, onSave, clase, materias, profesores, horas, dias }) => {
  const [formData, setFormData] = useState<Clase>({
    materia_id: clase?.materia_id || 0,
    profesor_id: clase?.profesor_id || 0,
    aula: clase?.aula || '',
    hora: clase?.hora || '',
    dia: clase?.dia || '',
    color: clase?.color || 'primary'
  });

  // Resetear el formulario cuando se abre el modal con datos preexistentes
  useEffect(() => {
    if (show) {
      setFormData({
        materia_id: clase?.materia_id || 0,
        profesor_id: clase?.profesor_id || 0,
        aula: clase?.aula || '',
        hora: clase?.hora || '',
        dia: clase?.dia || '',
        color: clase?.color || 'primary'
      });
    }
  }, [show, clase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2 text-primary" />
          Agregar Nueva Clase
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={7}>
              <div className="p-3 border rounded mb-3 bg-light">
                <h5 className="mb-3 border-bottom pb-2">Información de la Clase</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                    Materia
                  </Form.Label>
                  <Form.Select
                    value={formData.materia_id}
                    onChange={(e) => setFormData({...formData, materia_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">Seleccionar Materia</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="me-2 text-primary" />
                    Profesor
                  </Form.Label>
                  <Form.Select
                    value={formData.profesor_id}
                    onChange={(e) => setFormData({...formData, profesor_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">Seleccionar Profesor</option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faDoorOpen} className="me-2 text-primary" />
                    Aula
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aula}
                    onChange={(e) => setFormData({...formData, aula: e.target.value})}
                    placeholder="Número o nombre del aula"
                    required
                  />
                </Form.Group>
              </div>
            </Col>
            
            <Col md={5}>
              <div className="p-3 border rounded mb-3 bg-light">
                <h5 className="mb-3 border-bottom pb-2">Horario</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarDay} className="me-2 text-primary" />
                    Día
                  </Form.Label>
                  <Form.Select 
                    value={formData.dia}
                    onChange={(e) => setFormData({...formData, dia: e.target.value})}
                    required
                    disabled={clase?.dia !== undefined} // Deshabilitar si se está editando una clase existente
                  >
                    <option value="">Seleccionar día</option>
                    {dias.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                    Hora
                  </Form.Label>
                  <Form.Select
                    value={formData.hora}
                    onChange={(e) => setFormData({...formData, hora: e.target.value})}
                    required
                    disabled={clase?.hora !== undefined} // Deshabilitar si se está editando una clase existente
                  >
                    <option value="">Seleccionar hora</option>
                    {horas.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="p-3 border rounded">
                <h5 className="mb-3 border-bottom pb-2">Personalización</h5>
                
                <Form.Group className="mb-0">
                  <Form.Label>
                    <FontAwesomeIcon icon={faPalette} className="me-2 text-primary" />
                    Color de la clase
                  </Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {colores.map((color) => (
                      <Form.Check
                        key={color.nombre}
                        type="radio"
                        id={`color-${color.nombre}`}
                        name="color"
                        value={color.nombre}
                        checked={formData.color === color.nombre}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        label={
                          <Badge bg={color.nombre} className="px-3 py-2">
                            {color.label}
                          </Badge>
                        }
                        className="me-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Guardar Clase
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Modal para editar una clase existente
export const ModalEditar: React.FC<ModalClaseProps> = ({ show, onHide, onSave, clase, materias, profesores, horas, dias }) => {
  const [formData, setFormData] = useState<Clase>({
    materia_id: clase?.materia_id || 0,
    profesor_id: clase?.profesor_id || 0,
    aula: clase?.aula || '',
    hora: clase?.hora || '',
    dia: clase?.dia || '',
    color: clase?.color || 'primary'
  });

  // Actualizar el formulario cuando cambia la clase seleccionada
  useEffect(() => {
    if (clase && show) {
      setFormData({
        id: clase.id,
        materia_id: clase.materia_id,
        profesor_id: clase.profesor_id,
        aula: clase.aula,
        hora: clase.hora,
        dia: clase.dia,
        color: clase.color
      });
    }
  }, [clase, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEdit} className="me-2 text-warning" />
          Editar Clase
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={7}>
              <div className="p-3 border rounded mb-3 bg-light">
                <h5 className="mb-3 border-bottom pb-2">Información de la Clase</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                    Materia
                  </Form.Label>
                  <Form.Select
                    value={formData.materia_id}
                    onChange={(e) => setFormData({...formData, materia_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">Seleccionar Materia</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="me-2 text-primary" />
                    Profesor
                  </Form.Label>
                  <Form.Select
                    value={formData.profesor_id}
                    onChange={(e) => setFormData({...formData, profesor_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">Seleccionar Profesor</option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faDoorOpen} className="me-2 text-primary" />
                    Aula
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aula}
                    onChange={(e) => setFormData({...formData, aula: e.target.value})}
                    placeholder="Número o nombre del aula"
                    required
                  />
                </Form.Group>
              </div>
            </Col>
            
            <Col md={5}>
              <div className="p-3 border rounded mb-3 bg-light">
                <h5 className="mb-3 border-bottom pb-2">Horario</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarDay} className="me-2 text-primary" />
                    Día
                  </Form.Label>
                  <Form.Select 
                    value={formData.dia}
                    onChange={(e) => setFormData({...formData, dia: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar día</option>
                    {dias.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                    Hora
                  </Form.Label>
                  <Form.Select
                    value={formData.hora}
                    onChange={(e) => setFormData({...formData, hora: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar hora</option>
                    {horas.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="p-3 border rounded">
                <h5 className="mb-3 border-bottom pb-2">Personalización</h5>
                
                <Form.Group className="mb-0">
                  <Form.Label>
                    <FontAwesomeIcon icon={faPalette} className="me-2 text-primary" />
                    Color de la clase
                  </Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {colores.map((color) => (
                      <Form.Check
                        key={color.nombre}
                        type="radio"
                        id={`color-edit-${color.nombre}`}
                        name="color-edit"
                        value={color.nombre}
                        checked={formData.color === color.nombre}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        label={
                          <Badge bg={color.nombre} className="px-3 py-2">
                            {color.label}
                          </Badge>
                        }
                        className="me-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Cancelar
          </Button>
          <Button variant="warning" type="submit">
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Actualizar Clase
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Modal para confirmar eliminación de una clase
export const ModalEliminar: React.FC<ModalEliminarProps> = ({ show, onHide, onConfirm, clase }) => {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header className="bg-danger text-white" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Confirmar Eliminación
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <FontAwesomeIcon icon={faInfoCircle} className="text-warning mb-3" size="3x" />
          <h5>¿Estás seguro de que quieres eliminar esta clase?</h5>
          <p className="text-muted">
            Esta acción no se puede deshacer. La clase será eliminada permanentemente.
          </p>
          <div className="bg-light p-3 rounded">
            <strong>Detalles de la clase:</strong>
            <ul className="list-unstyled mt-2 mb-0">
              <li><strong>Materia:</strong> {clase.materia_nombre}</li>
              <li><strong>Profesor:</strong> {clase.profesor_nombre}</li>
              <li><strong>Día:</strong> {clase.dia}</li>
              <li><strong>Hora:</strong> {clase.hora}</li>
              <li><strong>Aula:</strong> {clase.aula}</li>
            </ul>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Eliminar Clase
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Modal para confirmar eliminación de todo el horario
export const ModalEliminarHorario: React.FC<ModalProps & { onConfirm: () => Promise<void> }> = ({ show, onHide, onConfirm }) => {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header className="bg-danger text-white" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Eliminar Horario Completo
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <FontAwesomeIcon icon={faInfoCircle} className="text-warning mb-3" size="3x" />
          <h5>¿Estás seguro de que quieres eliminar todo el horario?</h5>
          <p className="text-muted">
            Esta acción eliminará todas las clases del horario actual. Esta acción no se puede deshacer.
          </p>
          <div className="alert alert-warning">
            <strong>⚠️ Advertencia:</strong> Se eliminarán todas las clases programadas para este grado.
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Eliminar Todo el Horario
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
