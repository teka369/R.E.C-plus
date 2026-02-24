import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faEdit, faTrash, faSave, faTimes, 
  faChartBar, faChartPie, faChartLine, faFileExport,
  faCalendarAlt, faUser, faBook, faChalkboardTeacher
} from '@fortawesome/free-solid-svg-icons';
import type { Reporte, TipoReporte, EstadoReporte, FormatoReporte } from '../../../../types/Reportes';
import { TIPOS_REPORTE, ESTADOS_REPORTE, FORMATOS_REPORTE } from '../../../../types/Reportes';

// Interfaces
interface ModalProps {
  show: boolean;
  onHide: () => void;
}

interface ReporteModalProps extends ModalProps {
  reporte?: Reporte;
  onSave?: (reporte: Reporte) => void;
  onDelete?: (reporte: Reporte) => void;
}

// Catálogos con iconos y colores para la UI
const TIPOS_REPORTE_UI = [
  { value: 'academico', label: 'Académico', icon: faChartBar, color: 'primary' },
  { value: 'asistencia', label: 'Asistencia', icon: faCalendarAlt, color: 'success' },
  { value: 'comportamiento', label: 'Comportamiento', icon: faUser, color: 'warning' },
  { value: 'evaluacion', label: 'Evaluación', icon: faChartLine, color: 'info' }
];

const ESTADOS_REPORTE_UI = [
  { value: 'pendiente', label: 'Pendiente', color: 'warning' },
  { value: 'generado', label: 'Generado', color: 'success' },
  { value: 'archivado', label: 'Archivado', color: 'secondary' }
];

const FORMATOS_REPORTE_UI = [
  { value: 'pdf', label: 'PDF', color: 'danger' },
  { value: 'excel', label: 'Excel', color: 'success' },
  { value: 'csv', label: 'CSV', color: 'info' }
];

// Modal para ver un reporte
export const VerReporteModal: React.FC<ReporteModalProps> = ({ show, onHide, reporte }) => {
  if (!reporte) return null;

  const getTipoIcon = (tipo: string) => {
    const tipoInfo = TIPOS_REPORTE_UI.find(t => t.value === tipo);
    return tipoInfo ? <FontAwesomeIcon icon={tipoInfo.icon} className="me-2" /> : null;
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
          Detalles del Reporte
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={6}>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faBook} className="me-2 text-primary" />
                  Título
                </div>
                <div className="fw-bold">{reporte.titulo}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                  Periodo
                </div>
                <div className="fw-bold">{reporte.periodo}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="me-2 text-primary" />
                  Curso
                </div>
                <div className="fw-bold">{reporte.curso}</div>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={6}>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faFileExport} className="me-2 text-primary" />
                  Formato
                </div>
                <Badge bg={FORMATOS_REPORTE_UI.find(f => f.value === reporte.formato)?.color}>
                  {reporte.formato.toUpperCase()}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                  Fecha
                </div>
                <div className="fw-bold">{reporte.fecha}</div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faChartBar} className="me-2 text-primary" />
                  Estado
                </div>
                <Badge bg={ESTADOS_REPORTE_UI.find(e => e.value === reporte.estado)?.color}>
                  {reporte.estado.charAt(0).toUpperCase() + reporte.estado.slice(1)}
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>

        <div className="border rounded p-3">
          <h6 className="mb-3">Tipo de Reporte</h6>
          <Badge bg={TIPOS_REPORTE_UI.find(t => t.value === reporte.tipo)?.color} className="mb-3">
            {getTipoIcon(reporte.tipo)}
            {reporte.tipo.charAt(0).toUpperCase() + reporte.tipo.slice(1)}
          </Badge>

          <h6 className="mb-3">Descripción</h6>
          <p className="mb-0">{reporte.descripcion}</p>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cerrar
        </Button>
        <Button variant="primary">
          <FontAwesomeIcon icon={faFileExport} className="me-1" /> Descargar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Modal para editar o crear un reporte
export const EditarReporteModal: React.FC<ReporteModalProps> = ({ show, onHide, reporte, onSave }) => {
  const [formData, setFormData] = useState<Reporte>({
    id: 0,
    titulo: '',
    tipo: 'academico',
    periodo: '',
    curso: '',
    fecha: new Date().toLocaleDateString(),
    descripcion: '',
    estado: 'pendiente',
    formato: 'pdf'
  });

  React.useEffect(() => {
    if (reporte) {
      setFormData(reporte);
    } else {
      setFormData({
        id: Math.floor(Math.random() * 1000),
        titulo: '',
        tipo: 'academico',
        periodo: '',
        curso: '',
        fecha: new Date().toLocaleDateString(),
        descripcion: '',
        estado: 'pendiente',
        formato: 'pdf'
      });
    }
  }, [reporte, show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="bg-light" closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
            {reporte ? 'Editar Reporte' : 'Nuevo Reporte'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Título</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Curso</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.curso}
                  onChange={(e) => setFormData({...formData, curso: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Reporte</Form.Label>
                <Form.Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as Reporte['tipo']})}
                  required
                >
                  {TIPOS_REPORTE.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Formato</Form.Label>
                <Form.Select
                  value={formData.formato}
                  onChange={(e) => setFormData({...formData, formato: e.target.value as Reporte['formato']})}
                  required
                >
                  {FORMATOS_REPORTE.map((formato) => (
                    <option key={formato.value} value={formato.value}>
                      {formato.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Periodo</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.periodo}
                  onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value as Reporte['estado']})}
                  required
                >
                  {ESTADOS_REPORTE.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              required
            />
          </Form.Group>
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

// Modal para eliminar un reporte
export const EliminarReporteModal: React.FC<ReporteModalProps> = ({ show, onHide, reporte, onDelete }) => {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (reporte && onDelete) {
      onDelete(reporte);
    }
    setConfirmText('');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header className="bg-light" closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faTrash} className="me-2 text-danger" />
          Eliminar Reporte
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>¿Está seguro que desea eliminar este reporte?</p>
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
export const useReporteModals = () => {
  const [showVer, setShowVer] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | undefined>();
  const [onSaveCallback, setOnSaveCallback] = useState<((reporte: Reporte) => void) | undefined>();
  const [onDeleteCallback, setOnDeleteCallback] = useState<((reporte: Reporte) => void) | undefined>();

  const handleViewReporte = (reporte: Reporte) => {
    setReporteSeleccionado(reporte);
    setShowVer(true);
  };

  const handleEditReporte = (reporte: Reporte | null, onSave?: (reporte: Reporte) => void) => {
    setReporteSeleccionado(reporte || undefined);
    if (onSave) {
      setOnSaveCallback(() => onSave);
    }
    setShowEditar(true);
  };

  const handleDeleteReporte = (reporte: Reporte, onDelete?: (reporte: Reporte) => void) => {
    setReporteSeleccionado(reporte);
    setShowEliminar(true);
    if (onDelete) {
      setOnDeleteCallback(() => onDelete);
    }
  };

  const handleSaveReporte = (reporte: Reporte) => {
    if (onSaveCallback) {
      onSaveCallback(reporte);
    }
    setShowEditar(false);
  };

  const handleConfirmDelete = (reporte: Reporte) => {
    if (onDeleteCallback) {
      onDeleteCallback(reporte);
    }
    setShowEliminar(false);
  };

  const modals = (
    <>
      <VerReporteModal
        show={showVer}
        onHide={() => setShowVer(false)}
        reporte={reporteSeleccionado}
      />
      <EditarReporteModal
        show={showEditar}
        onHide={() => setShowEditar(false)}
        reporte={reporteSeleccionado}
        onSave={handleSaveReporte}
      />
      <EliminarReporteModal
        show={showEliminar}
        onHide={() => setShowEliminar(false)}
        reporte={reporteSeleccionado}
        onDelete={handleConfirmDelete}
      />
    </>
  );

  return {
    modals,
    handleViewReporte,
    handleEditReporte,
    handleDeleteReporte
  };
};
