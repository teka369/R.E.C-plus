import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Badge, Card } from 'react-bootstrap';
import { FaGraduationCap, FaSpinner, FaCheck, FaTimes, FaCalendar, FaUser, FaBook } from 'react-icons/fa';
import axios from 'axios';
import type { SolicitudRecuperacion } from '../../../../types/Recuperacion';

interface DetalleSolicitudModalProps {
  show: boolean;
  onHide: () => void;
  solicitud: SolicitudRecuperacion | null;
  userRole: string | null;
  onSuccess: () => void;
}

const DetalleSolicitudModal: React.FC<DetalleSolicitudModalProps> = ({
  show,
  onHide,
  solicitud,
  userRole,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [estado, setEstado] = useState<'aprobada' | 'rechazada' | ''>('');

  const handleResponderSolicitud = async () => {
    if (!solicitud || !estado) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(`http://localhost:4000/api/recuperacion/${solicitud.id}`, {
        estado,
        comentario_profesor: comentario
      });

      if (response.data.success) {
        setSuccess(`Solicitud ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} exitosamente`);
        setTimeout(() => {
          onSuccess();
          onHide();
          setSuccess(null);
          setComentario('');
          setEstado('');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error al responder solicitud:', error);
      setError('Error al procesar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: { bg: 'warning', icon: <FaCalendar />, text: 'Pendiente' },
      aprobada: { bg: 'success', icon: <FaCheck />, text: 'Aprobada' },
      rechazada: { bg: 'danger', icon: <FaTimes />, text: 'Rechazada' },
      completada: { bg: 'info', icon: <FaGraduationCap />, text: 'Completada' }
    };
    const variant = variants[estado as keyof typeof variants] || { bg: 'secondary', icon: <FaGraduationCap />, text: estado };
    
    return (
      <Badge bg={variant.bg} className="d-flex align-items-center gap-1">
        {variant.icon}
        {variant.text}
      </Badge>
    );
  };

  const getTipoSolicitudBadge = (tipo: string) => {
    return (
      <Badge bg={tipo === 'recuperacion' ? 'primary' : 'info'}>
        {tipo === 'recuperacion' ? 'Recuperación' : 'Refuerzo'}
      </Badge>
    );
  };

  if (!solicitud) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaGraduationCap className="me-2" />
          Detalle de Solicitud de Recuperación
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

        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Información de la Solicitud</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Materia:</strong> {solicitud.materia_nombre}</p>
                    <p><strong>Tipo:</strong> {getTipoSolicitudBadge(solicitud.tipo_solicitud)}</p>
                    <p><strong>Estado:</strong> {getEstadoBadge(solicitud.estado)}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Fecha de Solicitud:</strong> {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}</p>
                    {solicitud.fecha_respuesta && (
                      <p><strong>Fecha de Respuesta:</strong> {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES')}</p>
                    )}
                    {solicitud.fecha_limite && (
                      <p><strong>Fecha Límite:</strong> {new Date(solicitud.fecha_limite).toLocaleDateString('es-ES')}</p>
                    )}
                  </Col>
                </Row>
                <hr />
                <div>
                  <strong>Motivo de la Solicitud:</strong>
                  <p className="mt-2">{solicitud.motivo}</p>
                </div>
                {solicitud.comentario_profesor && (
                  <>
                    <hr />
                    <div>
                      <strong>Comentario del Profesor:</strong>
                      <p className="mt-2">{solicitud.comentario_profesor}</p>
                    </div>
                  </>
                )}
                {solicitud.nota_final && (
                  <>
                    <hr />
                    <div>
                      <strong>Nota Final:</strong>
                      <Badge bg="success" className="ms-2">{solicitud.nota_final}</Badge>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">Participantes</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  <FaUser className="me-2" />
                  <div>
                    <small className="text-muted">Estudiante</small>
                    <div>{solicitud.estudiante_nombre}</div>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <FaBook className="me-2" />
                  <div>
                    <small className="text-muted">Profesor</small>
                    <div>{solicitud.profesor_nombre}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Sección de respuesta para profesores */}
        {userRole === 'profesor' && solicitud.estado === 'pendiente' && (
          <Card className="mt-3">
            <Card.Header>
              <h6 className="mb-0">Responder Solicitud</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Decisión *</Form.Label>
                    <Form.Select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as 'aprobada' | 'rechazada' | '')}
                      required
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="aprobada">Aprobar Solicitud</option>
                      <option value="rechazada">Rechazar Solicitud</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Comentario (Opcional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Agrega un comentario sobre tu decisión..."
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  onClick={handleResponderSolicitud}
                  disabled={loading || !estado}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />
                      {estado === 'aprobada' ? 'Aprobar' : estado === 'rechazada' ? 'Rechazar' : 'Responder'}
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
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

export default DetalleSolicitudModal;
