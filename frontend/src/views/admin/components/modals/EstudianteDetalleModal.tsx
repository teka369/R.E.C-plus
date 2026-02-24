import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaAward, FaPlus, FaEye, FaSave } from 'react-icons/fa';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'entregada' | 'calificada';
  calificacion?: number;
  materia: string;
  grado: string;
}

interface AsistenciaRegistro {
  id: number;
  fecha: string;
  estado: 'presente' | 'ausente' | 'justificado';
}

interface PromedioMateria {
  materia: string;
  promedio: number;
}

interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  grado: string;
  tareas: Tarea[];
  asistencias: AsistenciaRegistro[];
  promedios: PromedioMateria[];
}

interface EstudianteDetalleModalProps {
  show: boolean;
  onHide: () => void;
  estudiante: Estudiante;
  userSubject: string;
  onSavePromedio: (estudianteId: number, materia: string, nuevoPromedio: number) => void;
}

export const EstudianteDetalleModal: React.FC<EstudianteDetalleModalProps> = ({
  show,
  onHide,
  estudiante,
  userSubject,
  onSavePromedio,
}) => {
  const [editedPromedio, setEditedPromedio] = useState<number | string>('');
  const [localEstudiante, setLocalEstudiante] = useState<Estudiante>(estudiante);

  useEffect(() => {
    console.log('EstudianteDetalleModal: Prop estudiante cambiada:', estudiante);
    setLocalEstudiante(estudiante);
  }, [estudiante]);

  useEffect(() => {
    console.log('EstudianteDetalleModal: Estado localEstudiante actualizado:', localEstudiante);
    const currentPromedio = localEstudiante.promedios.find(p => p.materia === userSubject)?.promedio;
    setEditedPromedio(currentPromedio !== undefined ? currentPromedio : '');
  }, [localEstudiante, userSubject, show]);

  const handlePromedioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setEditedPromedio(value);
    }
  };

  const handleSavePromedio = () => {
    if (editedPromedio !== '' && !isNaN(Number(editedPromedio))) {
      onSavePromedio(localEstudiante.id, userSubject, Number(editedPromedio));
      setLocalEstudiante(prev => ({
        ...prev,
        promedios: prev.promedios.some(p => p.materia === userSubject)
          ? prev.promedios.map(p => p.materia === userSubject ? { ...p, promedio: Number(editedPromedio) } : p)
          : [...prev.promedios, { materia: userSubject, promedio: Number(editedPromedio) }]
      }));
    }
  };

  const tareasFiltradas = localEstudiante.tareas.filter(tarea => tarea.materia === userSubject);
  console.log('EstudianteDetalleModal: Tareas filtradas por materia:', tareasFiltradas);
  const promediosFiltrados = localEstudiante.promedios.filter(promedio => promedio.materia === userSubject);
  const asistenciasFiltradas = localEstudiante.asistencias;

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Detalles de {localEstudiante.nombre} {localEstudiante.apellido}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Información General</h4>
        <p><strong>Grado:</strong> {localEstudiante.grado}</p>

        <h4 className="mt-4">Gestión de Promedio ({userSubject})</h4>
        <Row className="mb-4 align-items-end">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Promedio Actual</Form.Label>
              <Form.Control
                type="text"
                value={editedPromedio}
                onChange={handlePromedioChange}
                placeholder="Ej: 4.5"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Button variant="success" onClick={handleSavePromedio}>
              <FaSave className="me-2" /> Guardar Promedio
            </Button>
          </Col>
        </Row>

        <h4 className="mt-4">Promedios ({userSubject})</h4>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Materia</th>
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {promediosFiltrados.length > 0 ? (
              promediosFiltrados.map((promedio, index) => (
                <tr key={index}>
                  <td>{promedio.materia}</td>
                  <td><Badge bg="info">{promedio.promedio}</Badge></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center">No hay promedios para esta materia.</td>
              </tr>
            )}
          </tbody>
        </Table>

        <h4 className="mt-4">Asistencia ({userSubject})</h4>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asistenciasFiltradas.length > 0 ? (
              asistenciasFiltradas.map(asistencia => (
                <tr key={asistencia.id}>
                  <td>{asistencia.fecha}</td>
                  <td>
                    <Badge
                      bg={asistencia.estado === 'presente' ? 'success' : asistencia.estado === 'ausente' ? 'danger' : 'warning'}
                    >
                      {asistencia.estado.charAt(0).toUpperCase() + asistencia.estado.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center">No hay registros de asistencia para este estudiante.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};