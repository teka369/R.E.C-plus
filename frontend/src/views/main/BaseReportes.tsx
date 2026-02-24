import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { FaEdit, FaSave, FaChartLine, FaUserGraduate, FaCalendarCheck, FaPlus } from 'react-icons/fa';
import { useEstadisticasModals, EstadisticasGrado } from './components/modals/EstadisticasModals';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useProfesorGrupos } from '../../hooks/useProfesorGrupos';
import { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos';


interface EstadisticasGradoState {
  [key: string]: EstadisticasGrado;
}

interface Grupo {
  id: number;
  nombre: string;
}

const Reportes: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { modals: estadisticaModals, openModal } = useEstadisticasModals(gradoSeleccionado);
  const [estadisticasPorGrado, setEstadisticasPorGrado] = useState<EstadisticasGradoState>({});

  const { user, role } = useAuth();
  useEffect(() => {
    const currentRole = role || null;
    const email = (user?.correo as string) || (user?.correo_institucional as string) || null;
    setUserRole(currentRole);
    setUserEmail(email);
  }, [user, role]);

  // Obtener el ID del profesor del localStorage
  const profesorId = typeof user?.id === 'string' ? parseInt(user.id) : (user?.id as number | null);

  // Usar hooks para obtener grupos según el rol
  const { grupos: gruposProfesor, loading: loadingGruposProfesor, error: errorGruposProfesor } = useProfesorGrupos(profesorId);
  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante, error: errorGruposEstudiante } = useEstudianteGrupos(userEmail);

  let grupos: any[] = [];
  let loadingGrupos = false;
  let errorGrupos: string | null = null;

  if (userRole === 'profesor') {
    grupos = gruposProfesor;
    loadingGrupos = loadingGruposProfesor;
    errorGrupos = errorGruposProfesor;
  } else if (userRole === 'estudiante') {
    grupos = gruposEstudiante;
    loadingGrupos = loadingGruposEstudiante;
    errorGrupos = errorGruposEstudiante;
  }

  // Selección automática de grado por defecto
  useEffect(() => {
    if (!gradoSeleccionado && grupos.length > 0) {
      setGradoSeleccionado(grupos[0].nombre);
    }
  }, [grupos, gradoSeleccionado]);

  // Cargar estadísticas al cambiar el grado seleccionado
  useEffect(() => {
    if (gradoSeleccionado) {
      api.get(`/estadisticas/grado/${gradoSeleccionado}`)
        .then(res => {
          if (res.data.data) {
            setEstadisticasPorGrado({ [gradoSeleccionado]: res.data.data });
          } else {
            setEstadisticasPorGrado({});
          }
        })
        .catch(() => setEstadisticasPorGrado({}));
    } else {
      setEstadisticasPorGrado({});
    }
  }, [gradoSeleccionado]);

  const handleSaveNewEstadistica = async (newEstadistica: EstadisticasGrado, grado: string) => {
    try {
      await api.post(`/estadisticas/grado/${grado}`, newEstadistica);
    setEstadisticasPorGrado(prev => ({
      ...prev,
      [grado]: newEstadistica
    }));
    } catch (error) {
      console.error("Error al guardar las estadísticas:", error);
    }
  };

  const generarOpcionesGrado = () => {
    if (loadingGrupos) return [<option key="loading">Cargando grupos...</option>];
    if (errorGrupos) return [<option key="error">Error al cargar grupos</option>];
    if (grupos.length === 0) return [<option key="no-groups">No hay grupos disponibles</option>];
    return grupos.map(grupo => (
      <option key={grupo.id} value={grupo.nombre}>Grado {grupo.nombre}</option>
    ));
  };

  const stats = estadisticasPorGrado[gradoSeleccionado];
  const handleSaveCallback = (estadistica: EstadisticasGrado, grado: string) => handleSaveNewEstadistica(estadistica, grado);

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 text-primary">Estadísticas por Grado</h2>
            <p className="text-muted mb-0">Análisis detallado del rendimiento académico</p>
          </div>
          <div className="d-flex gap-2">
            <Form.Select
              value={gradoSeleccionado}
              onChange={(e) => setGradoSeleccionado(e.target.value)}
              className="me-2"
              style={{ width: 'auto' }}
              disabled={loadingGrupos || Boolean(errorGrupos)}
            >
              <option value="">Seleccionar grado</option>
              {generarOpcionesGrado()}
            </Form.Select>
            {userRole === 'profesor' && (
              <>
                <Button
                  variant="success"
                  onClick={() => openModal(handleSaveCallback)}
                  className="d-flex align-items-center gap-2 px-4"
                  disabled={!!stats}
                >
                  <FaPlus /> Crear
                </Button>
            <Button 
                  variant="primary"
                  onClick={() => openModal(handleSaveCallback, stats)}
              className="d-flex align-items-center gap-2 px-4"
                  disabled={!stats}
                >
                  <FaEdit /> Editar
            </Button>
              </>
            )}
          </div>
        </div>

        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="icon-circle bg-primary bg-opacity-10 me-3">
                    <FaUserGraduate className="text-primary" size={20} />
                  </div>
                  <h5 className="mb-0">Rendimiento Académico</h5>
                </div>
                <div className="d-flex flex-column gap-3">
                  <div className="stat-item">
                    <span className="text-muted">Promedio General</span>
                    <span className="stat-value">{stats?.promedioGeneral ? Number(stats.promedioGeneral).toFixed(1) : 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Porcentaje de Aprobación</span>
                    <span className="stat-value">{stats?.aprobacion || 'N/A'}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Mejor Asignatura</span>
                    <span className="stat-value">{stats?.mejorAsignatura || 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Estudiantes Destacados</span>
                    <span className="stat-value">{stats?.estudiantesDestacados || 'N/A'}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="icon-circle bg-success bg-opacity-10 me-3">
                    <FaCalendarCheck className="text-success" size={20} />
                  </div>
                  <h5 className="mb-0">Asistencia</h5>
                </div>
                <div className="d-flex flex-column gap-3">
                  <div className="stat-item">
                    <span className="text-muted">Asistencia Promedio</span>
                     <span className="stat-value">{stats?.asistenciaPromedio || 'N/A'}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Inasistencias Justificadas</span>
                    <span className="stat-value">{stats?.inasistenciasJustificadas || 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Inasistencias Injustificadas</span>
                    <span className="stat-value">{stats?.inasistenciasInjustificadas || 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Curso con Mayor Asistencia</span>
                    <span className="stat-value">{stats?.porcentajeCursoMayorAsistencia || 'N/A'}%</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-card">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="icon-circle bg-info bg-opacity-10 me-3">
                    <FaChartLine className="text-info" size={20} />
                  </div>
                  <h5 className="mb-0">Comparativo</h5>
                </div>
                <div className="d-flex flex-column gap-3">
                  <div className="stat-item">
                    <span className="text-muted">Variación en Promedio</span>
                    <span className="stat-value text-success">+{stats?.variacionPromedio || 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Variación en Aprobación</span>
                    <span className="stat-value text-success">+{stats?.variacionAprobacion || 'N/A'}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Reducción de Ausencias</span>
                    <span className="stat-value text-success">-{stats?.reduccionAusencias || 'N/A'}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="text-muted">Tendencia General</span>
                    <span className="stat-value text-success">{stats?.tendenciaGeneral || 'N/A'}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {estadisticaModals}
      </Container>   

      <style>{`
        .hover-card {
          transition: transform 0.2s ease-in-out;
        }
        .hover-card:hover {
          transform: translateY(-5px);
        }
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .stat-item:last-child {
          border-bottom: none;
        }
        .stat-value {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .stat-input {
          width: 100px;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default Reportes;
