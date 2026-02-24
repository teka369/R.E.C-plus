import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaUserGraduate } from 'react-icons/fa';
import axios from 'axios';
import '../../assets/main/styles/PerfilUsuario.css';
import { Link } from 'react-router-dom';

interface Grupo {
  id: number;
  nombre: string;
}

interface StudentProfile {
  id: number;
  nombre: string;
  apellido: string;
  documento_identidad: string;
  correo_institucional: string;
  grupos: Grupo[];
}

const PerfilEstudiante: React.FC = () => {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          setError('No se encontró el correo del usuario');
          setLoading(false);
          return;
        }
        const response = await axios.get(`http://localhost:4000/api/estudiantes/${email}`);
        if (response.data.success) {
          setStudentProfile(response.data.data);
          setUserInitial(response.data.data.nombre.charAt(0).toUpperCase());
        }
      } catch (err: any) {
        console.error('Error al cargar los datos del estudiante:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos del estudiante');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="profile-page bg-light py-5 text-center">
        Cargando datos del estudiante...
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

  if (!studentProfile) {
    return (
        <div className="profile-page bg-light py-5 text-center">
            No se encontraron datos del estudiante.
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
                  <Badge bg="success" className="px-3 py-2">
                    <FaUserGraduate className="me-1" /> Estudiante
                  </Badge>
                </div>
              </Col>
              <Col md={9}>
                <h2 className="mb-1">{`${studentProfile.nombre} ${studentProfile.apellido}`}</h2>
                <p className="text-muted mb-3">{studentProfile.correo_institucional}</p>
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
                    <strong>Nombre Completo:</strong> {`${studentProfile.nombre} ${studentProfile.apellido}`}
                  </li>
                  <li className="mb-2">
                    <strong>Correo Institucional:</strong> {studentProfile.correo_institucional}
                  </li>
                  <li className="mb-2">
                    <strong>Grados y Grupos:</strong> {' '}
                    {studentProfile.grupos && studentProfile.grupos.length > 0 ? (
                      studentProfile.grupos.map(grupo => grupo.nombre).join(', ')
                    ) : (
                      'N/A'
                    )}
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <h5 className="mb-3">Resumen Académico</h5>
                <div className="my-4">
                  <span style={{ fontSize: '1.2rem', color: '#888' }}>
                    <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', color: '#6366f1' }}></i><br/>
                    <b>¡Muy pronto disponible!</b><br/>
                    El resumen académico estará habilitado en una próxima actualización.
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PerfilEstudiante;