import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { Unidad } from '../../../../types/Temario';

interface UnidadModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (unidad: any) => void;
  unidad: Unidad | null;
}

const emptyList: string[] = [];

const UnidadModal: React.FC<UnidadModalProps> = ({ show, onHide, onSave, unidad }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [contenidos, setContenidos] = useState<string[]>([]);
  const [actividades, setActividades] = useState<string[]>([]);
  const [evaluacion, setEvaluacion] = useState<string[]>([]);
  const [recursos, setRecursos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unidad) {
      setTitulo(unidad.titulo || '');
      setDescripcion(unidad.descripcion || '');
      setDuracion(unidad.duracion || '');
      setObjetivos(unidad.objetivos && unidad.objetivos.length ? unidad.objetivos : []);
      setContenidos(unidad.contenidos && unidad.contenidos.length ? unidad.contenidos : []);
      setActividades(unidad.actividades && unidad.actividades.length ? unidad.actividades : []);
      setEvaluacion(unidad.evaluacion && unidad.evaluacion.length ? unidad.evaluacion : []);
      setRecursos(unidad.recursos && unidad.recursos.length ? unidad.recursos : []);
    } else {
      setTitulo('');
      setDescripcion('');
      setDuracion('');
      setObjetivos([]);
      setContenidos([]);
      setActividades([]);
      setEvaluacion([]);
      setRecursos([]);
    }
    setError(null);
    setSuccess(null);
    setLoading(false);
  }, [unidad, show]);

  const handleListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, value: string) => {
    setter(prev => prev.map((item, i) => (i === idx ? value : item)));
  };

  const handleAddToList = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const handleRemoveFromList = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) => {
    setter(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const validate = () => {
    if (!titulo.trim() || titulo.length < 3) return 'El título es obligatorio y debe tener al menos 3 caracteres.';
    if (!descripcion.trim() || descripcion.length < 5) return 'La descripción es obligatoria y debe tener al menos 5 caracteres.';
    if (objetivos.filter(o => o.trim() !== '').length === 0) return 'Debe agregar al menos un objetivo.';
    if (contenidos.filter(c => c.trim() !== '').length === 0) return 'Debe agregar al menos un contenido.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await onSave({
        titulo,
        descripcion,
        duracion,
        objetivos: objetivos.filter(o => o.trim() !== ''),
        contenidos: contenidos.filter(c => c.trim() !== ''),
        actividades: actividades.filter(a => a.trim() !== ''),
        evaluacion: evaluacion.filter(ev => ev.trim() !== ''),
        recursos: recursos.filter(r => r.trim() !== ''),
      });
      setSuccess('¡Guardado exitosamente!');
      setTimeout(() => {
        setSuccess(null);
        onHide();
      }, 800);
    } catch (err) {
      setError('Ocurrió un error al guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{unidad ? 'Editar Unidad/Sesión' : 'Nueva Unidad/Sesión'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Título <span className="text-danger">*</span></Form.Label>
            <Form.Control
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              minLength={3}
              placeholder="Ej: Números enteros, Proyecto de ciencias, etc."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
              minLength={5}
              placeholder="Breve explicación de la sesión o actividad."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Duración</Form.Label>
            <Form.Control
              value={duracion}
              onChange={e => setDuracion(e.target.value)}
              placeholder="Ej: 1 semana, 2 horas, etc. (opcional)"
            />
          </Form.Group>
          <hr />
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Objetivos <span className="text-danger">*</span></Form.Label>
              {objetivos.map((o, idx) => (
                <InputGroup className="mb-2" key={idx}>
                  <Form.Control
                    value={o}
                    onChange={e => handleListChange(setObjetivos, idx, e.target.value)}
                    placeholder="Ej: Comprender el concepto de..."
                  />
                  <Button variant="outline-danger" onClick={() => handleRemoveFromList(setObjetivos, idx)}>-</Button>
                </InputGroup>
              ))}
              <Button size="sm" variant="outline-primary" onClick={() => handleAddToList(setObjetivos)}>Agregar objetivo</Button>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Contenidos <span className="text-danger">*</span></Form.Label>
              {contenidos.map((c, idx) => (
                <InputGroup className="mb-2" key={idx}>
                  <Form.Control
                    value={c}
                    onChange={e => handleListChange(setContenidos, idx, e.target.value)}
                    placeholder="Ej: Suma y resta de enteros"
                  />
                  <Button variant="outline-danger" onClick={() => handleRemoveFromList(setContenidos, idx)}>-</Button>
                </InputGroup>
              ))}
              <Button size="sm" variant="outline-primary" onClick={() => handleAddToList(setContenidos)}>Agregar contenido</Button>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6} className="mb-3">
              <Form.Label>Actividades</Form.Label>
              {actividades.map((a, idx) => (
                <InputGroup className="mb-2" key={idx}>
                  <Form.Control
                    value={a}
                    onChange={e => handleListChange(setActividades, idx, e.target.value)}
                    placeholder="Ej: Resolver ejercicios, hacer experimento, etc."
                  />
                  <Button variant="outline-danger" onClick={() => handleRemoveFromList(setActividades, idx)}>-</Button>
                </InputGroup>
              ))}
              <Button size="sm" variant="outline-primary" onClick={() => handleAddToList(setActividades)}>Agregar actividad</Button>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Evaluación</Form.Label>
              {evaluacion.map((ev, idx) => (
                <InputGroup className="mb-2" key={idx}>
                  <Form.Control
                    value={ev}
                    onChange={e => handleListChange(setEvaluacion, idx, e.target.value)}
                    placeholder="Ej: Examen, exposición, etc."
                  />
                  <Button variant="outline-danger" onClick={() => handleRemoveFromList(setEvaluacion, idx)}>-</Button>
                </InputGroup>
              ))}
              <Button size="sm" variant="outline-primary" onClick={() => handleAddToList(setEvaluacion)}>Agregar evaluación</Button>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Label>Recursos</Form.Label>
              {recursos.map((r, idx) => (
                <InputGroup className="mb-2" key={idx}>
                  <Form.Control
                    value={r}
                    onChange={e => handleListChange(setRecursos, idx, e.target.value)}
                    placeholder="Ej: Libro, video, página web, etc."
                  />
                  <Button variant="outline-danger" onClick={() => handleRemoveFromList(setRecursos, idx)}>-</Button>
                </InputGroup>
              ))}
              <Button size="sm" variant="outline-primary" onClick={() => handleAddToList(setRecursos)}>Agregar recurso</Button>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UnidadModal; 