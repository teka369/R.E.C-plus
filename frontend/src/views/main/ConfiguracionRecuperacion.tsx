import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const ConfiguracionRecuperacion: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setCargando(true);
        const res = await axios.get('/api/config/recuperaciones');
        if (res.data.activo) {
          setFechaInicio(res.data.fecha_inicio?.slice(0, 16) || '');
          setFechaFin(res.data.fecha_fin?.slice(0, 16) || '');
        }
      } catch (e) {
        setError('No se pudo cargar la configuración actual.');
      } finally {
        setCargando(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);
    if (!fechaInicio || !fechaFin) {
      setError('Debes ingresar ambas fechas.');
      return;
    }
    try {
      await axios.post('/api/config/recuperaciones', {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      setMensaje('¡Configuración guardada exitosamente!');
    } catch (e) {
      setError('Error al guardar la configuración.');
    }
  };

  return (
    <Container className="mt-4">
      <Card className="shadow-sm mx-auto" style={{ maxWidth: 500 }}>
        <Card.Header>
          <h4 className="mb-0">Configurar periodo de recuperaciones</h4>
        </Card.Header>
        <Card.Body>
          {mensaje && <Alert variant="success">{mensaje}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha y hora de inicio</Form.Label>
              <Form.Control
                type="datetime-local"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                required
                disabled={cargando}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha y hora de fin</Form.Label>
              <Form.Control
                type="datetime-local"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                required
                disabled={cargando}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={cargando}>
              Guardar configuración
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ConfiguracionRecuperacion; 