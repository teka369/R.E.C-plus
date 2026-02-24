import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaGraduationCap, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import type { MateriaConProfesor, NuevaSolicitudRecuperacion } from '../../../../types/Recuperacion';

interface SolicitudModalProps {
  show: boolean;
  onHide: () => void;
  materias: MateriaConProfesor[];
  onSuccess: () => void;
}

const SolicitudModal: React.FC<SolicitudModalProps> = ({
  show,
  onHide,
  materias,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    materia_id: '',
    tipo_solicitud: 'recuperacion' as 'recuperacion' | 'refuerzo',
    motivo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const estudianteId = localStorage.getItem('userId');
      const materiaSeleccionada = materias.find(m => m.materia_id.toString() === formData.materia_id);

      if (!estudianteId || !materiaSeleccionada) {
        throw new Error('Datos de usuario o materia no válidos');
      }

      const solicitudData: NuevaSolicitudRecuperacion = {
        estudiante_id: parseInt(estudianteId),
        profesor_id: materiaSeleccionada.profesor_id,
        materia_id: materiaSeleccionada.materia_id,
        tipo_solicitud: formData.tipo_solicitud,
        motivo: formData.motivo
      };

      const response = await axios.post('http://localhost:4000/api/recuperacion', solicitudData);

      if (response.data.success) {
        setSuccess('Solicitud de recuperación enviada exitosamente');
        setFormData({
          materia_id: '',
          tipo_solicitud: 'recuperacion',
          motivo: ''
        });
        
        setTimeout(() => {
          onSuccess();
          onHide();
          setSuccess(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error al enviar solicitud:', error);
      setError(error.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaGraduationCap className="me-2" />
          Nueva Solicitud de Recuperación
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

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Materia *</Form.Label>
                <Form.Select
                  name="materia_id"
                  value={formData.materia_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona una materia</option>
                  {materias.map((materia) => (
                    <option key={materia.materia_id} value={materia.materia_id}>
                      {materia.materia_nombre} - {materia.profesor_nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Solicitud *</Form.Label>
                <Form.Select
                  name="tipo_solicitud"
                  value={formData.tipo_solicitud}
                  onChange={handleInputChange}
                  required
                >
                  <option value="recuperacion">Recuperación</option>
                  <option value="refuerzo">Refuerzo</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  <strong>Recuperación:</strong> Para recuperar materia perdida<br />
                  <strong>Refuerzo:</strong> Para mejorar conocimientos
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Motivo *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              placeholder="Explica detalladamente el motivo de tu solicitud..."
              required
            />
            <Form.Text className="text-muted">
              Sé específico sobre las razones de tu solicitud
            </Form.Text>
          </Form.Group>



          <div className="alert alert-info">
            <strong>Nota:</strong> Tu solicitud será revisada por el profesor de la materia. 
            Una vez aprobada, podrás acceder a las actividades de recuperación asignadas.
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          type="submit" 
          onClick={handleSubmit}
          disabled={loading || !formData.materia_id || !formData.motivo}
        >
          {loading ? (
            <>
              <FaSpinner className="fa-spin me-2" />
              Enviando...
            </>
          ) : (
            <>
              <FaGraduationCap className="me-2" />
              Enviar Solicitud
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SolicitudModal;