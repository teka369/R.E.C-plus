import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Card, ListGroup } from 'react-bootstrap';
import { FaGraduationCap, FaSpinner, FaPaperPlane, FaUser, FaBook, FaComments } from 'react-icons/fa';
import axios from 'axios';
import type { SolicitudRecuperacion, SeguimientoRecuperacion, NuevoSeguimiento } from '../../../../types/Recuperacion';

interface SeguimientoModalProps {
  show: boolean;
  onHide: () => void;
  solicitud: SolicitudRecuperacion | null;
  userRole: string | null;
  userId: string | null;
  onSuccess: () => void;
}

const SeguimientoModal: React.FC<SeguimientoModalProps> = ({
  show,
  onHide,
  solicitud,
  userRole,
  userId,
  onSuccess
}) => {
  const [seguimientos, setSeguimientos] = useState<SeguimientoRecuperacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (show && solicitud) {
      cargarSeguimiento();
    }
  }, [show, solicitud]);

  const cargarSeguimiento = async () => {
    if (!solicitud) return;

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/api/recuperacion/${solicitud.id}/seguimiento`);
      setSeguimientos(response.data.data);
    } catch (error: any) {
      console.error('Error al cargar seguimiento:', error);
      setError('Error al cargar el seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitud || !userId || !mensaje.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const seguimientoData: NuevoSeguimiento = {
        solicitud_id: solicitud.id,
        usuario_id: parseInt(userId),
        tipo_usuario: userRole as 'estudiante' | 'profesor',
        mensaje: mensaje.trim()
      };

      const response = await axios.post(`http://localhost:4000/api/recuperacion/${solicitud.id}/seguimiento`, seguimientoData);

      if (response.data.success) {
        setSuccess('Mensaje enviado exitosamente');
        setMensaje('');
        cargarSeguimiento();
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      setError(error.response?.data?.message || 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!solicitud || !solicitud.estudiante_nombre) return null;

  console.log('estudiante_nombre:', solicitud.estudiante_nombre);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaComments className="me-2" />
          Seguimiento de Recuperación
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
          <Card.Header>
            <h6 className="mb-0">Información de la Solicitud</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Materia:</strong> {solicitud.materia_nombre}</p>
                <p><strong>Estudiante:</strong> [{solicitud.estudiante_nombre}]</p>
              </Col>
              <Col md={6}>
                <p><strong>Profesor:</strong> {solicitud.profesor_nombre}</p>
                <p><strong>Estado:</strong> {solicitud.estado}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Lista de Mensajes */}
        <Card>
          <Card.Header>
            <h6 className="mb-0">Historial de Comunicación</h6>
          </Card.Header>
          <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-4">
                <FaSpinner className="fa-spin" size={24} />
                <p className="mt-2">Cargando mensajes...</p>
              </div>
            ) : seguimientos.length === 0 ? (
              <div className="text-center py-4">
                <FaComments size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No hay mensajes</h5>
                <p className="text-muted">Sé el primero en iniciar la conversación</p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {seguimientos.map((seguimiento) => (
                  <ListGroup.Item key={seguimiento.id} className="border-0">
                    <div className={`d-flex ${seguimiento.tipo_usuario === userRole ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`p-3 rounded ${seguimiento.tipo_usuario === userRole ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '80%' }}>
                        <div className="d-flex align-items-center mb-2">
                          {seguimiento.tipo_usuario === 'estudiante' ? (
                            <FaUser className="me-2" />
                          ) : (
                            <FaBook className="me-2" />
                          )}
                          <strong>{seguimiento.usuario_nombre}</strong>
                          <small className={`ms-2 ${seguimiento.tipo_usuario === userRole ? 'text-white-50' : 'text-muted'}`}>
                            {formatFecha(seguimiento.fecha_mensaje)}
                          </small>
                        </div>
                        <p className="mb-0">{seguimiento.mensaje}</p>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>

        {/* Formulario para nuevo mensaje */}
        <Card className="mt-3">
          <Card.Header>
            <h6 className="mb-0">Nuevo Mensaje</h6>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleEnviarMensaje}>
              <Form.Group className="mb-3">
                <Form.Label>Tu mensaje</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder={`Escribe tu mensaje como ${userRole === 'estudiante' ? 'estudiante' : 'profesor'}...`}
                  required
                />
              </Form.Group>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Enviando como: <strong>{userRole === 'estudiante' ? 'Estudiante' : 'Profesor'}</strong>
                </small>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !mensaje.trim()}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SeguimientoModal; 