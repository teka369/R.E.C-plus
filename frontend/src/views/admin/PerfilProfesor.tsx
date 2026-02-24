import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaChalkboardTeacher, FaBook, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import '../../assets/main/styles/PerfilUsuario.css';
import { Link } from 'react-router-dom';

interface Grupo {
  id: number;
  nombre: string;
}

interface Materia {
  id: number;
  nombre: string;
}

interface TeacherProfile {
  id: number;
  nombre: string;
  apellido: string;
  correo_institucional: string;
  telefono: string;
  grupos: Grupo[];
  materias: Materia[];
}

const PerfilProfesor: React.FC = () => {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState('');

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          setError('No se encontró el correo del usuario');
          setLoading(false);
          return;
        }
        const response = await axios.get(`http://localhost:4000/api/profesores/${email}`);
        if (response.data.success) {
          setTeacherProfile(response.data.data);
          setUserInitial(response.data.data.nombre.charAt(0).toUpperCase());
        }
      } catch (err) {
        setError('Error al cargar los datos del profesor');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, []);

  if (loading) {
    return (
      <div className="profile-page bg-light py-5 text-center">
        Cargando datos del profesor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page bg-light py-5 text-center text-danger">
        Error: {error}
      </div>
    );
  }

  if (!teacherProfile) {
    return (
        <div className="profile-page bg-light py-5 text-center">
            No se encontraron datos del profesor.
        </div>
    );
  }

  return (
    <div className="profile-page bg-light py-5">
      <Container>
        {/* Perfil Header */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3} className="text-center">
                <div className="profile-initial-container-admin">
                  <div className="profile-initial-admin">{userInitial}</div>
                </div>
                <div className="mt-2">
                  <Badge bg="primary" className="px-3 py-2">
                    <FaChalkboardTeacher className="me-1" /> Profesor
                  </Badge>
                </div>
              </Col>
              <Col md={9}>
                <h2 className="mb-1">{`${teacherProfile.nombre} ${teacherProfile.apellido}`}</h2>
                <p className="text-muted mb-3">{teacherProfile.correo_institucional}</p>
                <div className="d-flex gap-3">
                  <Link to="/cambiar-contrasena" className="btn btn-outline-secondary">
                    Cambiar Contraseña
                  </Link>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Información Principal */}
        <Row>
          <Col md={6}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Datos Personales</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong>Nombre Completo:</strong> {`${teacherProfile.nombre} ${teacherProfile.apellido}`}
                  </li>
                  <li className="mb-2">
                    <strong>Correo Institucional:</strong> {teacherProfile.correo_institucional}
                  </li>
                  <li className="mb-2">
                    <strong>Teléfono:</strong> {teacherProfile.telefono || 'No especificado'}
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Resumen</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="d-flex align-items-center">
                      <FaBook className="me-2" /> Materias que enseña
                    </span>
                    <Badge bg="info" className="px-3 py-2">
                      {teacherProfile.materias?.length || 0}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="d-flex align-items-center">
                      <FaUsers className="me-2" /> Grupos asignados
                    </span>
                    <Badge bg="success" className="px-3 py-2">
                      {teacherProfile.grupos?.length || 0}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Materias y Grupos */}
        <Row className="mt-4">
          <Col md={6}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">
                  <FaBook className="me-2" />
                  Materias
                </h5>
                {teacherProfile.materias && teacherProfile.materias.length > 0 ? (
                  <div className="list-group">
                    {teacherProfile.materias.map((materia) => (
                      <div key={materia.id} className="list-group-item">
                        {materia.nombre}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No hay materias asignadas</p>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">
                  <FaUsers className="me-2" />
                  Grupos
                </h5>
                {teacherProfile.grupos && teacherProfile.grupos.length > 0 ? (
                  <div className="list-group">
                    {teacherProfile.grupos.map((grupo) => (
                      <div key={grupo.id} className="list-group-item">
                        Grado {grupo.nombre}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No hay grupos asignados</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PerfilProfesor;