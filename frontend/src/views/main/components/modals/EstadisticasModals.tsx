import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSave, faTimes, faChartLine, faCalendarCheck, faUserGraduate } from '@fortawesome/free-solid-svg-icons';

// Interfaces
export interface EstadisticasGrado {
  promedioGeneral: number;
  asistenciaPromedio: number;
  aprobacion: number;
  mejorCurso: string;
  mejorAsignatura: string;
  estudiantesDestacados: number;
  inasistenciasJustificadas: number;
  inasistenciasInjustificadas: number;
  porcentajeCursoMayorAsistencia: number;
  variacionPromedio: number;
  variacionAprobacion: number;
  reduccionAusencias: number;
  tendenciaGeneral: string;
}

interface ModalProps {
  show: boolean;
  onHide: () => void;
}

interface EstadisticaModalProps extends ModalProps {
  onSave: (estadisticas: EstadisticasGrado, grado: string) => void;
  grado: string;
  initialData?: EstadisticasGrado;
}

// Catálogo de grados para la selección en el modal
const GRADOS_CATALOGO = [
  '6.1', '6.2', '6.3', '7.1', '7.2', '7.3', '8.1', '8.2', '8.3', 
  '9.1', '9.2', '9.3', '10.1', '10.2', '10.3', '11.1', '11.2', '11.3'
];

// Modal para crear o editar estadísticas de un grado
export const EstadisticaModal: React.FC<EstadisticaModalProps> = ({ show, onHide, onSave, grado, initialData }) => {
  const [formData, setFormData] = useState<EstadisticasGrado>({
    promedioGeneral: 0,
    asistenciaPromedio: 0,
    aprobacion: 0,
    mejorCurso: '',
    mejorAsignatura: '',
    estudiantesDestacados: 0,
    inasistenciasJustificadas: 0,
    inasistenciasInjustificadas: 0,
    porcentajeCursoMayorAsistencia: 0,
    variacionPromedio: 0,
    variacionAprobacion: 0,
    reduccionAusencias: 0,
    tendenciaGeneral: 'Positiva'
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('rendimiento');

  useEffect(() => {
    if (show) {
      if (initialData) {
        setFormData(initialData);
      } else {
      setFormData({
        promedioGeneral: 0,
        asistenciaPromedio: 0,
        aprobacion: 0,
        mejorCurso: '',
        mejorAsignatura: '',
        estudiantesDestacados: 0,
        inasistenciasJustificadas: 0,
        inasistenciasInjustificadas: 0,
        porcentajeCursoMayorAsistencia: 0,
        variacionPromedio: 0,
        variacionAprobacion: 0,
        reduccionAusencias: 0,
        tendenciaGeneral: 'Positiva'
      });
      }
      setError(null);
      setActiveTab('rendimiento');
    }
  }, [show, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grado) {
      setError('No hay grado seleccionado.');
      return;
    }
    onSave(formData, grado);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="bg-light" closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faPlus} className="me-2 text-primary" />
            {initialData ? `Editar Estadísticas para Grado ${grado}` : `Nuevas Estadísticas para Grado ${grado}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          
          <Tabs
            id="estadisticas-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'rendimiento')}
            className="mb-3 nav-pills"
            justify
            >
            <Tab eventKey="rendimiento" title={<><FontAwesomeIcon icon={faUserGraduate} className="me-2" />Rendimiento</>}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Promedio General</Form.Label>
                    <Form.Control type="number" step="0.1" name="promedioGeneral" value={isNaN(formData.promedioGeneral) ? '' : formData.promedioGeneral} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Porcentaje de Aprobación (%)</Form.Label>
                    <Form.Control type="number" name="aprobacion" value={isNaN(formData.aprobacion) ? '' : formData.aprobacion} onChange={handleChange} required />
              </Form.Group>
                </Col>
                <Col md={6}>
              <Form.Group className="mb-3">
                    <Form.Label>Estudiantes Destacados</Form.Label>
                    <Form.Control type="number" name="estudiantesDestacados" value={isNaN(formData.estudiantesDestacados) ? '' : formData.estudiantesDestacados} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mejor Asignatura</Form.Label>
                <Form.Control type="text" name="mejorAsignatura" value={formData.mejorAsignatura} onChange={handleChange} required />
              </Form.Group>
            </Col>
              </Row>
            </Tab>
            <Tab eventKey="asistencia" title={<><FontAwesomeIcon icon={faCalendarCheck} className="me-2" />Asistencia</>}>
              <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                    <Form.Label>Asistencia Promedio (%)</Form.Label>
                    <Form.Control type="number" name="asistenciaPromedio" value={isNaN(formData.asistenciaPromedio) ? '' : formData.asistenciaPromedio} onChange={handleChange} required />
              </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Porcentaje Curso Mayor Asistencia (%)</Form.Label>
                    <Form.Control type="number" name="porcentajeCursoMayorAsistencia" value={isNaN(formData.porcentajeCursoMayorAsistencia) ? '' : formData.porcentajeCursoMayorAsistencia} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Inasistencias Justificadas</Form.Label>
                    <Form.Control type="number" name="inasistenciasJustificadas" value={isNaN(formData.inasistenciasJustificadas) ? '' : formData.inasistenciasJustificadas} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Inasistencias Injustificadas</Form.Label>
                    <Form.Control type="number" name="inasistenciasInjustificadas" value={isNaN(formData.inasistenciasInjustificadas) ? '' : formData.inasistenciasInjustificadas} onChange={handleChange} required />
              </Form.Group>
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="comparativo" title={<><FontAwesomeIcon icon={faChartLine} className="me-2" />Comparativo</>}>
              <Row>
                <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Variación en Promedio</Form.Label>
                    <Form.Control type="number" step="0.1" name="variacionPromedio" value={isNaN(formData.variacionPromedio) ? '' : formData.variacionPromedio} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Variación en Aprobación (%)</Form.Label>
                    <Form.Control type="number" name="variacionAprobacion" value={isNaN(formData.variacionAprobacion) ? '' : formData.variacionAprobacion} onChange={handleChange} required />
              </Form.Group>
                </Col>
                <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reducción de Ausencias (%)</Form.Label>
                    <Form.Control type="number" name="reduccionAusencias" value={isNaN(formData.reduccionAusencias) ? '' : formData.reduccionAusencias} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tendencia General</Form.Label>
                <Form.Select name="tendenciaGeneral" value={formData.tendenciaGeneral} onChange={handleChange} required>
                  <option value="Positiva">Positiva</option>
                  <option value="Negativa">Negativa</option>
                  <option value="Estabilizada">Estabilizada</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
            </Tab>
          </Tabs>
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

// Hook personalizado para gestionar los modales de estadísticas
export const useEstadisticasModals = (grado: string) => {
  const [showModal, setShowModal] = useState(false);
  const [estadisticaSeleccionada, setEstadisticaSeleccionada] = useState<EstadisticasGrado | undefined>();
  const [onSaveCallback, setOnSaveCallback] = useState<((estadisticas: EstadisticasGrado, grado: string) => void) | undefined>();

  const openModal = (onSave: (estadisticas: EstadisticasGrado, grado: string) => void, initialData?: EstadisticasGrado) => {
    setEstadisticaSeleccionada(initialData);
    setOnSaveCallback(() => onSave);
    setShowModal(true);
  };

  const handleSave = (estadisticas: EstadisticasGrado, grado: string) => {
    if (onSaveCallback) {
      onSaveCallback(estadisticas, grado);
    }
    setShowModal(false);
  };

  const modals = (
    <>
      <EstadisticaModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        grado={grado}
        initialData={estadisticaSeleccionada}
      />
    </>
  );

  return {
    modals,
    openModal,
  };
}; 