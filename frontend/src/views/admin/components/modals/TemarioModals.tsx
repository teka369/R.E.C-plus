import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, ListGroup, Tabs, Tab, Accordion, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faChalkboardTeacher, faCalendarAlt, 
  faFileAlt, faTrash, faSave, faTimes, faEdit, 
  faPlus, faCheck, faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import type { Temario, Unidad, Materia, EstadoTemario } from '../../../../types/Temario';
import { ASIGNATURAS_CATALOGO, PERIODOS_CATALOGO } from '../../../../types/Temario';

declare global {
  interface Window {
    gruposGlobal?: { id: string | number; nombre: string }[];
  }
}

// Interfaces
interface ModalProps {
  show: boolean;
  onHide: () => void;
}

interface TemarioModalProps extends ModalProps {
  temario?: Temario;
  onSave?: (temario: Temario) => void;
  onDelete?: (id: number) => void;
  initialGrado?: string;
  materiasProfesor?: Materia[];
}

// Catálogos
const GRADOS_CATALOGO = [
  '6-1', '6-2', '6-3',
  '7-1', '7-2', '7-3',
  '8-1', '8-2', '8-3',
  '9-1', '9-2', '9-3',
  '10-1', '10-2', '10-3',
  '11-1', '11-2', '11-3'
];

// Modal para ver un temario
export const VerTemarioModal: React.FC<TemarioModalProps> = ({ show, onHide, temario }) => {
  if (!temario) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
          {temario.asignatura} - {temario.grupo_nombre}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <Row>
            <Col md={6}>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="me-2 text-primary" />
                    Profesor
                  </div>
                  <div className="fw-bold">{temario.profesor}</div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    Periodo
                  </div>
                  <div className="fw-bold">{temario.periodo}</div>
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={6}>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                    Estado
                  </div>
                  <Badge bg={
                    temario.estado === 'activo' ? 'success' : 
                    temario.estado === 'borrador' ? 'warning' : 'secondary'
                  }>
                    {temario.estado.charAt(0).toUpperCase() + temario.estado.slice(1)}
                  </Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                    Última actualización
                  </div>
                  <div className="fw-bold">{temario.fechaActualizacion}</div>
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </div>

        <h5 className="mb-3">Unidades Temáticas</h5>
        <Accordion>
          {temario.unidades.map((unidad, index) => (
            <Accordion.Item eventKey={index.toString()} key={unidad.id}>
              <Accordion.Header>
                {unidad.titulo} <span className="ms-2 text-muted">({unidad.duracion})</span>
              </Accordion.Header>
              <Accordion.Body>
                <p className="mb-3">{unidad.descripcion}</p>
                
                <Tabs defaultActiveKey="objetivos" className="mb-3">
                  <Tab eventKey="objetivos" title="Objetivos">
                    <ListGroup variant="flush">
                      {unidad.objetivos.map((objetivo, i) => (
                        <ListGroup.Item key={i}>
                          <FontAwesomeIcon icon={faCheck} className="me-2 text-success" />
                          {objetivo}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Tab>
                  <Tab eventKey="contenidos" title="Contenidos">
                    <ListGroup variant="flush">
                      {unidad.contenidos.map((contenido, i) => (
                        <ListGroup.Item key={i}>
                          <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                          {contenido}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Tab>
                  <Tab eventKey="actividades" title="Actividades">
                    <ListGroup variant="flush">
                      {unidad.actividades.map((actividad, i) => (
                        <ListGroup.Item key={i}>
                          <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-info" />
                          {actividad}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Tab>
                  <Tab eventKey="evaluacion" title="Evaluación">
                    <ListGroup variant="flush">
                      {unidad.evaluacion.map((evaluacionItem, i) => (
                        <ListGroup.Item key={i}>
                          <FontAwesomeIcon icon={faFileAlt} className="me-2 text-warning" />
                          {evaluacionItem}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Tab>
                  <Tab eventKey="recursos" title="Recursos">
                    <ListGroup variant="flush">
                      {unidad.recursos.map((recurso, i) => (
                        <ListGroup.Item key={i}>
                          <FontAwesomeIcon icon={faBook} className="me-2 text-secondary" />
                          {recurso}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Tab>
                </Tabs>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Modal para editar o crear un temario
export const EditarTemarioModal: React.FC<TemarioModalProps> = ({ show, onHide, temario, onSave, initialGrado, materiasProfesor }) => {
  const [formData, setFormData] = useState<Temario>({
    id: 0,
    asignatura: '',
    grupo_id: 0,
    grupo_nombre: '',
    profesor: localStorage.getItem('userName') || '',
    periodo: '',
    fechaActualizacion: new Date().toLocaleDateString(),
    estado: 'borrador',
    unidades: []
  });

  const [unidadActual, setUnidadActual] = useState<Unidad>({
    id: 0,
    titulo: '',
    descripcion: '',
    objetivos: [],
    contenidos: [],
    actividades: [],
    evaluacion: [],
    duracion: '',
    recursos: []
  });

  const [nombreGrupo, setNombreGrupo] = useState('');
  useEffect(() => {
    if (initialGrado && Array.isArray(window.gruposGlobal)) {
      const grupo = window.gruposGlobal.find(g => g.id === initialGrado);
      setNombreGrupo(grupo ? grupo.nombre : '');
    }
  }, [initialGrado]);

  useEffect(() => {
    if (temario) {
      setFormData(temario);
    } else {
      setFormData({
        id: 0,
        asignatura: '',
        grupo_id: 0,
        grupo_nombre: '',
        profesor: localStorage.getItem('userName') || '',
        periodo: '',
        fechaActualizacion: new Date().toLocaleDateString(),
        estado: 'borrador',
        unidades: [] // No agregar unidades ni campos por defecto
      });
    }
  }, [temario, show, initialGrado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let unidadesFinal = formData.unidades;
    // Si unidadActual tiene título y no está ya en la lista, agrégala
    if (
      unidadActual.titulo &&
      unidadActual.titulo.trim() !== '' &&
      !formData.unidades.some(u => u.titulo === unidadActual.titulo && u.descripcion === unidadActual.descripcion)
    ) {
      unidadesFinal = [...formData.unidades, { ...unidadActual, id: Math.floor(Math.random() * 1000) }];
    }
    if (onSave) {
      onSave({ ...formData, unidades: unidadesFinal });
    }
    onHide();
  };

  const handleAddUnidad = () => {
    setFormData({
      ...formData,
      unidades: [...formData.unidades, { ...unidadActual, id: Math.floor(Math.random() * 1000) }]
    });
    setUnidadActual({
      id: 0,
      titulo: '',
      descripcion: '',
      objetivos: [],
      contenidos: [],
      actividades: [],
      evaluacion: [],
      duracion: '',
      recursos: []
    });
  };

  const handleRemoveUnidad = (id: number) => {
    setFormData(prev => ({
      ...prev,
      unidades: prev.unidades.filter(u => u.id !== id)
    }));
  };

  const handleAddObjetivo = () => {
    setUnidadActual(prev => ({
      ...prev,
      objetivos: [...prev.objetivos, '']
    }));
  };

  const handleUpdateObjetivo = (index: number, value: string) => {
    setUnidadActual(prev => ({
      ...prev,
      objetivos: prev.objetivos.map((obj, i) => i === index ? value : obj)
    }));
  };

  const handleRemoveObjetivo = (index: number) => {
    setUnidadActual(prev => ({
      ...prev,
      objetivos: prev.objetivos.filter((_, i) => i !== index)
    }));
  };

  const handleAddContenido = () => {
    setUnidadActual(prev => ({
      ...prev,
      contenidos: [...prev.contenidos, '']
    }));
  };

  const handleUpdateContenido = (index: number, value: string) => {
    setUnidadActual(prev => ({
      ...prev,
      contenidos: prev.contenidos.map((cont, i) => i === index ? value : cont)
    }));
  };

  const handleRemoveContenido = (index: number) => {
    setUnidadActual(prev => ({
      ...prev,
      contenidos: prev.contenidos.filter((_, i) => i !== index)
    }));
  };

  const handleAddActividad = () => {
    setUnidadActual(prev => ({
      ...prev,
      actividades: [...prev.actividades, '']
    }));
  };

  const handleUpdateActividad = (index: number, value: string) => {
    setUnidadActual(prev => ({
      ...prev,
      actividades: prev.actividades.map((act, i) => i === index ? value : act)
    }));
  };

  const handleRemoveActividad = (index: number) => {
    setUnidadActual(prev => ({
      ...prev,
      actividades: prev.actividades.filter((_, i) => i !== index)
    }));
  };

  const handleAddEvaluacion = () => {
    setUnidadActual(prev => ({
      ...prev,
      evaluacion: [...prev.evaluacion, '']
    }));
  };

  const handleUpdateEvaluacion = (index: number, value: string) => {
    setUnidadActual(prev => ({
      ...prev,
      evaluacion: prev.evaluacion.map((evalItem, idx) => idx === index ? value : evalItem)
    }));
  };

  const handleRemoveEvaluacion = (index: number) => {
    setUnidadActual(prev => ({
      ...prev,
      evaluacion: prev.evaluacion.filter((_, i) => i !== index)
    }));
  };

  const handleAddRecurso = () => {
    setUnidadActual(prev => ({
      ...prev,
      recursos: [...prev.recursos, '']
    }));
  };

  const handleUpdateRecurso = (index: number, value: string) => {
    setUnidadActual(prev => ({
      ...prev,
      recursos: prev.recursos.map((rec, i) => i === index ? value : rec)
    }));
  };

  const handleRemoveRecurso = (index: number) => {
    setUnidadActual(prev => ({
      ...prev,
      recursos: prev.recursos.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="bg-light" closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
            {temario ? 'Editar Temario' : 'Nuevo Temario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Asignatura</Form.Label>
                <Form.Select
                  value={formData.asignatura || ""}
                  onChange={(e) => setFormData({...formData, asignatura: e.target.value})}
                  required
                >
                  <option value="">Seleccione una asignatura</option>
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
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Profesor</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.profesor || ""}
                  readOnly
                  onChange={(e) => setFormData({...formData, profesor: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Periodo</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.periodo || ""}
                  onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Actualización</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.fechaActualizacion || ""}
                  readOnly
                  onChange={(e) => setFormData({...formData, fechaActualizacion: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value as Temario['estado']})}
                  required
                >
                  <option value="activo">Activo</option>
                  <option value="borrador">Borrador</option>
                  <option value="archivado">Archivado</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <h5 className="mb-3">Gestionar Unidades</h5>
          <Accordion className="mb-3">
            {formData.unidades.map((unidad, index) => (
              <Accordion.Item eventKey={index.toString()} key={unidad.id}>
                <Accordion.Header>
                  {unidad.titulo} <span className="ms-2 text-muted">({unidad.duracion})</span>
                </Accordion.Header>
                <Accordion.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                        <Form.Label>Título de Unidad</Form.Label>
                  <Form.Control
                    type="text"
                          value={unidad.titulo || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, titulo: e.target.value } : u)
                          }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duración</Form.Label>
                  <Form.Control
                    type="text"
                          value={unidad.duracion || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, duracion: e.target.value } : u)
                          }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                      rows={3}
                      value={unidad.descripcion || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, descripcion: e.target.value } : u)
                      }))}
                    />
                  </Form.Group>

                  <h6>Objetivos</h6>
                  {unidad.objetivos.map((obj, i) => (
                    <InputGroup className="mb-2" key={i}>
                      <Form.Control
                        type="text"
                        value={obj || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, objetivos: u.objetivos.map((o, idx) => idx === i ? e.target.value : o) } : u)
                        }))}
                      />
                      <Button 
                        variant="outline-danger" 
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, objetivos: u.objetivos.filter((_, idx) => idx !== i) } : u)
                        }))}
                      >
                        X
                      </Button>
                    </InputGroup>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                    className="mb-3"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, objetivos: [...u.objetivos, ''] } : u)
                    }))}
                >
                    + Agregar Objetivo
                </Button>

                  <h6>Contenidos</h6>
                  {unidad.contenidos.map((cont, i) => (
                    <InputGroup className="mb-2" key={i}>
                    <Form.Control
                      type="text"
                        value={cont || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, contenidos: u.contenidos.map((c, idx) => idx === i ? e.target.value : c) } : u)
                        }))}
                      />
                      <Button 
                        variant="outline-danger" 
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, contenidos: u.contenidos.filter((_, idx) => idx !== i) } : u)
                        }))}
                      >
                        X
                      </Button>
                    </InputGroup>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                    className="mb-3"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, contenidos: [...u.contenidos, ''] } : u)
                    }))}
                >
                    + Agregar Contenido
                </Button>

                  <h6>Actividades</h6>
                  {unidad.actividades.map((act, i) => (
                    <InputGroup className="mb-2" key={i}>
                    <Form.Control
                      type="text"
                        value={act || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, actividades: u.actividades.map((a, idx) => idx === i ? e.target.value : a) } : u)
                        }))}
                      />
                      <Button 
                        variant="outline-danger" 
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, actividades: u.actividades.filter((_, idx) => idx !== i) } : u)
                        }))}
                      >
                        X
                      </Button>
                    </InputGroup>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                    className="mb-3"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, actividades: [...u.actividades, ''] } : u)
                    }))}
                >
                    + Agregar Actividad
                </Button>

                  <h6>Evaluación</h6>
                  {unidad.evaluacion.map((evalItem, i) => (
                    <InputGroup className="mb-2" key={i}>
                    <Form.Control
                      type="text"
                        value={evalItem || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, evaluacion: u.evaluacion.map((evalItem, idx) => idx === i ? e.target.value : evalItem) } : u)
                        }))}
                      />
                      <Button 
                        variant="outline-danger" 
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, evaluacion: u.evaluacion.filter((_, idx) => idx !== i) } : u)
                        }))}
                      >
                        X
                      </Button>
                    </InputGroup>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                    className="mb-3"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, evaluacion: [...u.evaluacion, ''] } : u)
                    }))}
                >
                    + Agregar Evaluación
                </Button>

                  <h6>Recursos</h6>
                  {unidad.recursos.map((rec, i) => (
                    <InputGroup className="mb-2" key={i}>
                    <Form.Control
                      type="text"
                        value={rec || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, recursos: u.recursos.map((r, idx) => idx === i ? e.target.value : r) } : u)
                        }))}
                      />
                      <Button 
                        variant="outline-danger" 
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, recursos: u.recursos.filter((_, idx) => idx !== i) } : u)
                        }))}
                      >
                        X
                      </Button>
                    </InputGroup>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                    className="mb-3"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      unidades: prev.unidades.map(u => u.id === unidad.id ? { ...u, recursos: [...u.recursos, ''] } : u)
                    }))}
                >
                    + Agregar Recurso
                </Button>

              <Button
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => {
                      setUnidadActual(unidad);
                      alert('Para editar la unidad directamente, modifique los campos de arriba.');
                    }}
                  >
                    Editar Unidad
              </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                    className="ms-2"
                      onClick={() => handleRemoveUnidad(unidad.id)}
                    >
                    Eliminar Unidad
                  </Button>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>

          <h5 className="mb-3">Agregar Nueva Unidad</h5>
          <Form.Group className="mb-3">
            <Form.Label>Título de Unidad</Form.Label>
            <Form.Control
              type="text"
              value={unidadActual.titulo || ""}
              onChange={(e) => setUnidadActual({...unidadActual, titulo: e.target.value})}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción de Unidad</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={unidadActual.descripcion || ""}
              onChange={(e) => setUnidadActual({...unidadActual, descripcion: e.target.value})}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Duración</Form.Label>
            <Form.Control
              type="text"
              value={unidadActual.duracion || ""}
              onChange={(e) => setUnidadActual({...unidadActual, duracion: e.target.value})}
            />
          </Form.Group>
          
          <h6>Objetivos de la unidad</h6>
          {unidadActual.objetivos.map((obj, i) => (
            <InputGroup className="mb-2" key={i}>
              <Form.Control
                type="text"
                value={obj || ""}
                onChange={(e) => handleUpdateObjetivo(i, e.target.value)}
              />
              <Button variant="outline-danger" onClick={() => handleRemoveObjetivo(i)}>
                X
              </Button>
            </InputGroup>
          ))}
          <Button variant="outline-primary" size="sm" className="mb-3" onClick={handleAddObjetivo}>
            + Agregar Objetivo
          </Button>

          <h6>Contenidos de la unidad</h6>
          {unidadActual.contenidos.map((cont, i) => (
            <InputGroup className="mb-2" key={i}>
              <Form.Control
                type="text"
                value={cont || ""}
                onChange={(e) => handleUpdateContenido(i, e.target.value)}
              />
              <Button variant="outline-danger" onClick={() => handleRemoveContenido(i)}>
                X
              </Button>
            </InputGroup>
          ))}
          <Button variant="outline-primary" size="sm" className="mb-3" onClick={handleAddContenido}>
            + Agregar Contenido
          </Button>

          <h6>Actividades de la unidad</h6>
          {unidadActual.actividades.map((act, i) => (
            <InputGroup className="mb-2" key={i}>
              <Form.Control
                type="text"
                value={act || ""}
                onChange={(e) => handleUpdateActividad(i, e.target.value)}
              />
              <Button variant="outline-danger" onClick={() => handleRemoveActividad(i)}>
                X
              </Button>
            </InputGroup>
          ))}
          <Button variant="outline-primary" size="sm" className="mb-3" onClick={handleAddActividad}>
            + Agregar Actividad
          </Button>

          <h6>Evaluación de la unidad</h6>
          {unidadActual.evaluacion.map((evalItem, i) => (
            <InputGroup className="mb-2" key={i}>
              <Form.Control
                type="text"
                value={evalItem || ""}
                onChange={(e) => handleUpdateEvaluacion(i, e.target.value)}
              />
              <Button variant="outline-danger" onClick={() => handleRemoveEvaluacion(i)}>
                X
              </Button>
            </InputGroup>
          ))}
          <Button variant="outline-primary" size="sm" className="mb-3" onClick={handleAddEvaluacion}>
            + Agregar Evaluación
          </Button>

          <h6>Recursos de la unidad</h6>
          {unidadActual.recursos.map((rec, i) => (
            <InputGroup className="mb-2" key={i}>
              <Form.Control
                type="text"
                value={rec || ""}
                onChange={(e) => handleUpdateRecurso(i, e.target.value)}
              />
              <Button variant="outline-danger" onClick={() => handleRemoveRecurso(i)}>
                X
                    </Button>
            </InputGroup>
                ))}
          <Button variant="outline-primary" size="sm" className="mb-3" onClick={handleAddRecurso}>
            + Agregar Recurso
          </Button>

          <Button 
            variant="success" 
            className="mt-3"
            onClick={handleAddUnidad}
            disabled={!unidadActual.titulo}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> Agregar Unidad
          </Button>

        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
          </Button>
          <Button variant="primary" type="submit">
            <FontAwesomeIcon icon={faSave} className="me-1" /> {temario ? 'Guardar Cambios' : 'Crear Temario'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Modal para confirmar la eliminación de un temario
export const EliminarTemarioModal: React.FC<TemarioModalProps> = ({ show, onHide, temario, onDelete }) => {
  if (!temario) return null;

  const handleConfirm = () => {
    if (onDelete) {
      onDelete(temario.id);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirmar Eliminación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        ¿Estás seguro de que deseas eliminar el temario de "{temario.asignatura}" para el grado "{temario.grupo_nombre}"? Esta acción no se puede deshacer.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          Eliminar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Custom hook para gestionar los modales de temarios
export const useTemarioModals = (materiasProfesor?: Materia[]) => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemario, setSelectedTemario] = useState<Temario | null>(null);
  const [onSaveCallback, setOnSaveCallback] = useState<((temario: Temario) => void) | undefined>(undefined);
  const [onDeleteCallback, setOnDeleteCallback] = useState<((id: number) => void) | undefined>(undefined);
  const [initialGradoForNew, setInitialGradoForNew] = useState<string>('');

  const handleViewTemario = (temario: Temario) => {
    setSelectedTemario(temario);
    setShowViewModal(true);
  };

  const handleEditTemario = (temario: Temario | null, onSave?: (temario: Temario) => void) => {
    setSelectedTemario(temario);
    setOnSaveCallback(() => onSave);
    setShowEditModal(true);
  };

  const handleDeleteTemario = (temario: Temario, onDelete?: (id: number) => void) => {
    setSelectedTemario(temario);
    setOnDeleteCallback(() => onDelete);
    setShowDeleteModal(true);
  };

  const handleSaveTemario = (temario: Temario) => {
    if (onSaveCallback) {
      onSaveCallback(temario);
    }
    setShowEditModal(false);
    setSelectedTemario(null);
    setOnSaveCallback(undefined);
  };

  const handleConfirmDelete = (id: number) => {
    if (onDeleteCallback) {
      onDeleteCallback(id);
    }
    setShowDeleteModal(false);
    setSelectedTemario(null);
    setOnDeleteCallback(undefined);
  };

  const modals = (
    <>
      <VerTemarioModal
        show={showViewModal} 
        onHide={() => setShowViewModal(false)} 
        temario={selectedTemario || undefined} 
      />
      <EditarTemarioModal
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        temario={selectedTemario || undefined} 
        onSave={handleSaveTemario}
        initialGrado={initialGradoForNew} 
        materiasProfesor={materiasProfesor}
      />
      <EliminarTemarioModal
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        temario={selectedTemario || undefined} 
        onDelete={handleConfirmDelete}
      />
    </>
  );

  return {
    modals,
    handleViewTemario,
    handleEditTemario,
    handleDeleteTemario,
    setInitialGradoForNew
  };
};
